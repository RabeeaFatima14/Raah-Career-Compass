from fastapi import FastAPI, HTTPException, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator
from typing import Optional, List
from google import genai
from google.genai import types as genai_types
import json, os, uuid, time
from dotenv import load_dotenv
from collections import defaultdict

from career_matcher import CareerMatcher
from prompts import build_roadmap_prompt, get_income_bracket_key
from news_fetcher import fetch_news_trends, get_trending_careers_from_news

load_dotenv(override=True)

# ── Config ────────────────────────────────────────────
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = "gemini-2.0-flash"
if not GEMINI_API_KEY or GEMINI_API_KEY.startswith("REPLACE") or GEMINI_API_KEY == "your_gemini_api_key_here":
    print("[WARNING] GEMINI_API_KEY not configured. AI features will be disabled.")
    gemini_client = None
else:
    gemini_client = genai.Client(api_key=GEMINI_API_KEY)

# Firebase (optional)
db = None
try:
    import firebase_admin
    from firebase_admin import credentials, firestore
    if os.path.exists("serviceAccountKey.json"):
        cred = credentials.Certificate("serviceAccountKey.json")
        firebase_admin.initialize_app(cred)
        db = firestore.client()
        print("[OK] Firebase connected")
    else:
        print("[INFO] serviceAccountKey.json not found -- Firebase disabled")
except Exception as e:
    print(f"[WARNING] Firebase skipped: {e}")

matcher = CareerMatcher()
news_cache = {"data": [], "last_updated": 0}
roadmap_cache = {}

# ── Simple Rate Limiter ───────────────────────────────
rate_limit_store = defaultdict(list)
RATE_LIMIT_MAX = 15       # max requests
RATE_LIMIT_WINDOW = 60    # per 60 seconds

def check_rate_limit(request: Request):
    client_ip = request.client.host if request.client else "unknown"
    now = time.time()
    # Clean old entries
    rate_limit_store[client_ip] = [t for t in rate_limit_store[client_ip] if now - t < RATE_LIMIT_WINDOW]
    if len(rate_limit_store[client_ip]) >= RATE_LIMIT_MAX:
        raise HTTPException(429, "Too many requests. Please wait a moment and try again.")
    rate_limit_store[client_ip].append(now)

# ── Init ──────────────────────────────────────────────
app = FastAPI(title="Raah API — راہ Career Compass", version="1.0.0")

ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
]
# In production, add your deployed frontend URL here
FRONTEND_URL = os.getenv("FRONTEND_URL")
if FRONTEND_URL:
    ALLOWED_ORIGINS.append(FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Pydantic Models ───────────────────────────────────
class ChatPayload(BaseModel):
    session_id: str = Field(..., max_length=100)
    message: str = Field(..., min_length=1, max_length=2000)
    history: List[dict] = Field(default=[], max_length=50)

class PersonalityAnswers(BaseModel):
    answers: List[dict]

    @validator("answers")
    def validate_answers(cls, v):
        if len(v) < 1 or len(v) > 20:
            raise ValueError("Answers must be between 1 and 20")
        return v

class MatchCareersPayload(BaseModel):
    conversation_text: str = Field(default="", max_length=5000)
    income_bracket: int = Field(default=40000, ge=0, le=1000000)
    personality_type: str = Field(default="", max_length=10)

class UserProfile(BaseModel):
    session_id: str = Field(..., max_length=100)
    name: str = Field(..., min_length=1, max_length=100)
    age: int = Field(..., ge=13, le=20)
    city: str = Field(..., min_length=1, max_length=100)
    province: str = Field(..., max_length=50)
    income_bracket: int = Field(..., ge=0, le=1000000)
    father_education: str = Field(..., max_length=100)
    mother_education: str = Field(..., max_length=100)
    siblings: int = Field(..., ge=0, le=20)
    personality_type: str = Field(..., max_length=10)
    enneagram_type: Optional[str] = Field(default=None, max_length=20)
    conversation_summary: str = Field(..., max_length=5000)
    interests: List[str] = Field(default=[])
    academic_strength: str = Field(default="general studies", max_length=500)

# ── Helpers ───────────────────────────────────────────
def extract_json(text: str):
    text = text.strip().replace("```json", "").replace("```", "").strip()
    start_b = text.find("{")
    start_a = text.find("[")
    if start_b == -1 and start_a == -1:
        raise ValueError("No JSON in response")
    if start_b == -1: start = start_a
    elif start_a == -1: start = start_b
    else: start = min(start_b, start_a)
    text = text[start:]
    end = max(text.rfind("}"), text.rfind("]")) + 1
    return json.loads(text[:end])

def safe_gemini(prompt: str, retries: int = 2) -> str:
    if gemini_client is None:
        raise HTTPException(503, "AI service unavailable: GEMINI_API_KEY not configured.")
    for attempt in range(retries):
        try:
            response = gemini_client.models.generate_content(
                model=GEMINI_MODEL,
                contents=prompt
            )
            return response.text
        except Exception as e:
            error_text = str(e).lower()
            if "429" in error_text or "quota" in error_text or "rate limit" in error_text:
                raise HTTPException(503, f"AI quota or rate limit reached. Please check Google Cloud billing/quota. Error: {str(e)[:200]}")
            if attempt == retries - 1:
                raise HTTPException(503, f"AI service unavailable. Try again later. Error: {str(e)[:200]}")
            time.sleep((attempt + 1) * 2)
    return ""


ROADMAP_TEMPLATES = {
    "software_engineer": {
        "education_route": {
            "degree": "BS Computer Science",
            "duration": "4 years",
            "best_universities": [
                {"name": "FAST National University", "city": "Islamabad", "admission_test": "FAST NAT", "fee_per_semester": "PKR 80,000"},
                {"name": "UET Lahore", "city": "Lahore", "admission_test": "ECAT", "fee_per_semester": "PKR 60,000"}
            ],
            "scholarships": [
                {"name": "HEC Need-Based Scholarship", "amount": "Varies", "eligibility": "Low income and strong merit", "apply_at": "https://hec.gov.pk"},
                {"name": "FAST Financial Aid", "amount": "Up to 100%", "eligibility": "Academic merit", "apply_at": "https://fast.edu.pk"}
            ]
        },
        "free_resources": [
            {"title": "freeCodeCamp JavaScript Algorithms", "type": "YouTube / freeCodeCamp", "url": "https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/", "why": "Helps you build the programming foundation needed for software engineering."},
            {"title": "Coursera Python for Everybody", "type": "Coursera", "url": "https://www.coursera.org/specializations/python", "why": "A free beginner-friendly Python course that is widely used by Pakistani students."}
        ],
        "youtube_channels": [
            {"channel_name": "Code with Harry", "channel_url": "https://www.youtube.com/@CodeWithHarry", "language": "Hindi/Urdu", "what_to_watch_first": "Python Programming for Beginners", "why_popular": "Many Pakistani beginners use this channel to learn coding in Urdu.", "level": "Beginner"},
            {"channel_name": "Technical Guruji", "channel_url": "https://www.youtube.com/@TechnicalGuruji", "language": "Hindi/Urdu", "what_to_watch_first": "Computer Basics Course", "why_popular": "Easy for students to understand computers and basic programming concepts.", "level": "Beginner"}
        ],
        "first_step_exploration": {
            "open_right_now": "Go to freecodecamp.org and start the 'Responsive Web Design' course.",
            "watch_first": "'Python Programming for Beginners' by Code with Harry — learn the first coding concepts.",
            "join_community": "Search Facebook group 'Pakistan Web Developers' and ask one question about internships.",
            "offline_action": "Visit a local computer training center and ask about their programming classes.",
            "free_skill_to_practice": "Use freeCodeCamp to build a simple web page with HTML and CSS today.",
            "how_to_verify_fit": "If you enjoy solving a small coding problem and can complete it in one session, this path is a good fit."
        },
        "pakistan_gov_trend": {
            "government_focus": "Digital Pakistan and PSEB are pushing IT exports and software training for youth.",
            "cpec_relevance": "Directly relevant through CPEC digital corridor and special economic zones hiring tech talent.",
            "economic_outlook": "IT roles are among the fastest growing salary sectors in Pakistan; demand remains strong despite inflation.",
            "hiring_trend": "growing",
            "key_ministry_body": "Ministry of IT & Telecom (MoITT)",
            "salary_impact": "PKR inflation makes entry-level IT pay feel lower, but remote and freelance earnings can offset it."
        },
        "dont_mess_up": "Keep practicing code every day and finish at least one small project so you can show real work.",
        "competition_reality": "This field is popular, so real practice and projects matter more than certificates."
    },
    "data_scientist": {
        "education_route": {
            "degree": "BS Data Science / BS Statistics",
            "duration": "4 years",
            "best_universities": [
                {"name": "LUMS", "city": "Lahore", "admission_test": "SAT / LUMS Admission Test", "fee_per_semester": "PKR 180,000"},
                {"name": "COMSATS University", "city": "Islamabad", "admission_test": "COMSATS Test", "fee_per_semester": "PKR 65,000"}
            ],
            "scholarships": [
                {"name": "LUMS NOP", "amount": "Up to 100%", "eligibility": "Need-based merit scholarship", "apply_at": "https://lums.edu.pk"},
                {"name": "HEC Merit Scholarship", "amount": "Up to 100%", "eligibility": "High grades", "apply_at": "https://hec.gov.pk"}
            ]
        },
        "free_resources": [
            {"title": "IBM Data Science Professional Certificate", "type": "Coursera", "url": "https://www.coursera.org/professional-certificates/ibm-data-science", "why": "A beginner-friendly path to data science concepts and projects."},
            {"title": "Kaggle Learn Python", "type": "Kaggle", "url": "https://www.kaggle.com/learn/python", "why": "Hands-on notebooks let you learn Python with real data examples."}
        ],
        "youtube_channels": [
            {"channel_name": "Data Science Dojo", "channel_url": "https://www.youtube.com/@DataScienceDojo", "language": "English", "what_to_watch_first": "Introduction to Data Science", "why_popular": "Clear beginner videos about data science tools and thinking.", "level": "Beginner"},
            {"channel_name": "Code with Harry", "channel_url": "https://www.youtube.com/@CodeWithHarry", "language": "Hindi/Urdu", "what_to_watch_first": "Python for Data Science", "why_popular": "Popular among Pakistani students for Python and ML basics.", "level": "Beginner"}
        ],
        "first_step_exploration": {
            "open_right_now": "Go to kaggle.com and complete the 'Python' micro-course.",
            "watch_first": "'Introduction to Data Science' by Data Science Dojo — learn what data science actually does.",
            "join_community": "Search Facebook group 'Pakistan Data Science' and introduce yourself.",
            "offline_action": "Ask a local university computer science student about their data science projects.",
            "free_skill_to_practice": "Open Kaggle and analyze one dataset using Python today.",
            "how_to_verify_fit": "If you enjoy turning data into answers and can explain one dataset story, this field suits you."
        },
        "pakistan_gov_trend": {
            "government_focus": "Digital Pakistan and SBP fintech policies are increasing demand for data analytics in finance and exports.",
            "cpec_relevance": "CPEC's industrial data needs help create roles in analytics for manufacturing and logistics.",
            "economic_outlook": "Data skills are rising faster than general salaries, making it a strong bet despite inflation.",
            "hiring_trend": "growing",
            "key_ministry_body": "Ministry of IT & Telecom (MoITT)",
            "salary_impact": "Analytics pay can keep pace with inflation if you target export-oriented companies or remote freelancing."
        },
        "dont_mess_up": "Build a real data project instead of only watching tutorials; employers want evidence of skill.",
        "competition_reality": "There is strong competition, but practical projects and real datasets make you stand out."
    },
    "default": {
        "education_route": {
            "degree": "Relevant university degree or diploma",
            "duration": "2-4 years",
            "best_universities": [
                {"name": "Government University in your province", "city": "Your city", "admission_test": "Local entry test", "fee_per_semester": "PKR 25,000"}
            ],
            "scholarships": [
                {"name": "Ehsaas Undergraduate Scholarship", "amount": "Varies", "eligibility": "Merit + low income", "apply_at": "https://ehsaas.nadra.gov.pk"}
            ]
        },
        "free_resources": [
            {"title": "Google Digital Garage", "type": "Google", "url": "https://learndigital.withgoogle.com/digitalgarage", "why": "Free courses that help you build basic digital and professional skills."}
        ],
        "youtube_channels": [
            {"channel_name": "Code with Harry", "channel_url": "https://www.youtube.com/@CodeWithHarry", "language": "Hindi/Urdu", "what_to_watch_first": "Basics playlist", "why_popular": "Friendly beginner tutorials in Urdu.", "level": "Beginner"}
        ],
        "first_step_exploration": {
            "open_right_now": "Open Google and search for a free beginner course in your chosen field.",
            "watch_first": "First YouTube video on the field to test your interest.",
            "join_community": "Find a Pakistani Facebook group related to your interest.",
            "offline_action": "Visit a local college or training center and ask about their programs.",
            "free_skill_to_practice": "Start one free online course or tutorial today.",
            "how_to_verify_fit": "If you enjoy the first few lessons and want to keep learning tomorrow, this career may fit."
        },
        "pakistan_gov_trend": {
            "government_focus": "The government supports youth skills training through Digital Pakistan and HEC scholarships.",
            "cpec_relevance": "This path may benefit indirectly from CPEC if it is related to Pakistan's growing digital or industrial sectors.",
            "economic_outlook": "A practical field with steady demand can still be realistic if you focus on affordable training.",
            "hiring_trend": "stable",
            "key_ministry_body": "Higher Education Commission or Ministry of IT & Telecom",
            "salary_impact": "Inflation means you should seek skills that can earn in dollars or in-demand local roles."
        },
        "dont_mess_up": "Do not rely only on certificates; build one small real project to prove you can do the work.",
        "competition_reality": "Many students are interested in this area, so practical work and consistency matter most."
    }
}


def _normalize_title(title: str) -> str:
    return title.lower().replace("/", "_").replace(" ", "_").replace("-", "_")


def _career_sector(title: str) -> str:
    text = title.lower()
    if any(k in text for k in ["software", "data", "ai", "cloud", "cybersecurity", "engineer", "developer", "programmer"]):
        return "tech"
    if any(k in text for k in ["designer", "video", "ui/ux", "content", "marketing", "social media", "creative", "artist"]):
        return "creative"
    if any(k in text for k in ["teacher", "psychologist", "counselor", "journalist", "educat"]):
        return "education"
    if any(k in text for k in ["doctor", "nurse", "pharmacist", "dentist", "health", "medical"]):
        return "health"
    if any(k in text for k in ["lawyer", "chartered accountant", "css", "legal", "finance", "supply chain", "accounting", "bank"]):
        return "professional"
    if any(k in text for k in ["electrician", "mechanic", "architect", "civil", "trade", "technical"]):
        return "trade"
    if "freelancer" in text or "remote" in text:
        return "freelance"
    return "general"


def _select_universities(sector: str, province: str) -> list:
    province_name = province or "Your province"
    if sector == "tech":
        return [
            {"name": "FAST National University", "city": "Islamabad", "admission_test": "FAST NAT", "fee_per_semester": "PKR 80,000"},
            {"name": "COMSATS University", "city": "Islamabad", "admission_test": "COMSATS Test", "fee_per_semester": "PKR 65,000"}
        ]
    if sector == "creative":
        return [
            {"name": "National College of Arts", "city": "Lahore", "admission_test": "NCA Entry Test", "fee_per_semester": "PKR 70,000"},
            {"name": "Indus Valley School of Art", "city": "Karachi", "admission_test": "IVS Admission Test", "fee_per_semester": "PKR 90,000"}
        ]
    if sector == "education":
        return [
            {"name": "University of Education", "city": "Lahore", "admission_test": "UE Admission Test", "fee_per_semester": "PKR 35,000"},
            {"name": "GC University", "city": "Lahore", "admission_test": "GCU Entry Test", "fee_per_semester": "PKR 25,000"}
        ]
    if sector == "health":
        return [
            {"name": "Dow University", "city": "Karachi", "admission_test": "DUET", "fee_per_semester": "PKR 85,000"},
            {"name": "KEMU", "city": "Lahore", "admission_test": "KEMU Entry Test", "fee_per_semester": "PKR 75,000"}
        ]
    if sector == "professional":
        return [
            {"name": "IBA", "city": "Karachi", "admission_test": "IBA Admission Test", "fee_per_semester": "PKR 90,000"},
            {"name": "Lahore University", "city": "Lahore", "admission_test": "Local Entry Test", "fee_per_semester": "PKR 50,000"}
        ]
    if sector == "trade":
        return [
            {"name": "TEVTA Institute", "city": "Lahore", "admission_test": "TEVTA Entry", "fee_per_semester": "PKR 18,000"},
            {"name": "Government Trade Institute", "city": "Peshawar", "admission_test": "Local Entry", "fee_per_semester": "PKR 15,000"}
        ]
    return [
        {"name": "Government University", "city": province_name, "admission_test": "Local entry test", "fee_per_semester": "PKR 25,000"}
    ]


def _select_scholarships(sector: str, income_key: str) -> list:
    base = [
        {"name": "Ehsaas Undergraduate Scholarship", "amount": "Varies", "eligibility": "Merit + low income", "apply_at": "https://ehsaas.nadra.gov.pk"},
        {"name": "HEC Need-Based Scholarship", "amount": "Varies", "eligibility": "High grades plus low income", "apply_at": "https://hec.gov.pk"}
    ]
    if sector == "tech":
        base.append({"name": "FAST Financial Aid", "amount": "Up to 100%", "eligibility": "Academic merit", "apply_at": "https://fast.edu.pk"})
    if sector == "creative":
        base.append({"name": "Punjab Arts Scholarship", "amount": "Partial", "eligibility": "Art talent and need", "apply_at": "https://punjab.gov.pk"})
    if sector == "education":
        base.append({"name": "HEC Merit Scholarship", "amount": "Up to 100%", "eligibility": "Strong academic record", "apply_at": "https://hec.gov.pk"})
    if sector == "professional":
        base.append({"name": "PEEF Scholarship", "amount": "Partial", "eligibility": "Need + merit", "apply_at": "https://peef.org.pk"})
    return base[:3]


def _sector_resources(sector: str) -> tuple:
    if sector == "tech":
        return (
            [
                {"title": "freeCodeCamp JavaScript Algorithms", "type": "freeCodeCamp", "url": "https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/", "why": "A strong programming foundation used by beginners and bootcamp learners."},
                {"title": "Coursera Python for Everybody", "type": "Coursera", "url": "https://www.coursera.org/specializations/python", "why": "One of the most accessible paths into software engineering and data work."}
            ],
            [
                {"channel_name": "Code with Harry", "channel_url": "https://www.youtube.com/@CodeWithHarry", "language": "Hindi/Urdu", "what_to_watch_first": "Python Programming for Beginners", "why_popular": "Simple Urdu lessons for programming beginners.", "level": "Beginner"},
                {"channel_name": "Technical Guruji", "channel_url": "https://www.youtube.com/@TechnicalGuruji", "language": "Hindi/Urdu", "what_to_watch_first": "Computer Basics Course", "why_popular": "Good for building computer literacy before coding.", "level": "Beginner"}
            ],
            {
                "government_focus": "Digital Pakistan and PSEB are sponsoring IT exports and software training for youth.",
                "cpec_relevance": "CPEC digital corridor projects create more demand for software and cloud engineers.",
                "economic_outlook": "IT jobs remain the strongest growth area because remote work and exports boost pay.",
                "hiring_trend": "growing",
                "key_ministry_body": "Ministry of IT & Telecom (MoITT)",
                "salary_impact": "PKR inflation makes remote and freelance pay especially valuable in this sector."
            },
            "Practice a small coding project today and finish one online tutorial.",
            "Build a portfolio project, not just certificates.",
            "If you enjoy solving a coding problem and can do it in one sitting, this path fits you."
        )
    if sector == "creative":
        return (
            [
                {"title": "Canva Design School", "type": "Canva", "url": "https://www.canva.com/learn/design-school/", "why": "Free creative design lessons that are accessible for beginners."},
                {"title": "freeCodeCamp Responsive Web Design", "type": "freeCodeCamp", "url": "https://www.freecodecamp.org/learn/responsive-web-design/", "why": "Useful for visual and web content creators."}
            ],
            [
                {"channel_name": "The Futur", "channel_url": "https://www.youtube.com/@thefutur", "language": "English", "what_to_watch_first": "Graphic Design Basics", "why_popular": "Popular for design thinking and portfolio advice.", "level": "Beginner"},
                {"channel_name": "Code with Harry", "channel_url": "https://www.youtube.com/@CodeWithHarry", "language": "Hindi/Urdu", "what_to_watch_first": "Video Editing for Beginners", "why_popular": "Accessible tutorials for Pakistani creative learners.", "level": "Beginner"}
            ],
            {
                "government_focus": "PM's Youth Programme and Digital Pakistan support creative freelancing and digital content skills.",
                "cpec_relevance": "Creative digital services are indirectly supported by CPEC’s growing IT/export ecosystem.",
                "economic_outlook": "Local creative roles can grow quickly with freelancing and remote work even in inflation.",
                "hiring_trend": "growing",
                "key_ministry_body": "Ministry of IT & Telecom (MoITT)",
                "salary_impact": "Creative freelancing can earn in dollars, which helps offset PKR inflation."
            },
            "Build a small portfolio piece with free tools today.",
            "Show real work to people instead of relying on certificates.",
            "If you enjoy making one visual or video piece and want to improve it, this career fits you."
        )
    if sector == "education":
        return (
            [
                {"title": "Khan Academy", "type": "Online", "url": "https://www.khanacademy.org/", "why": "Free teaching resources and a strong grounding in education topics."},
                {"title": "Coursera Teaching Courses", "type": "Coursera", "url": "https://www.coursera.org/browse/education", "why": "Beginner teaching and education skills with free audit options."}
            ],
            [
                {"channel_name": "Khan Academy", "channel_url": "https://www.youtube.com/@khanacademy", "language": "English", "what_to_watch_first": "Teaching Strategies", "why_popular": "Trusted education content for learners and tutors.", "level": "Beginner"},
                {"channel_name": "Code with Harry", "channel_url": "https://www.youtube.com/@CodeWithHarry", "language": "Hindi/Urdu", "what_to_watch_first": "Career Guidance for Students", "why_popular": "Useful for Pakistani students planning education careers.", "level": "Beginner"}
            ],
            {
                "government_focus": "The Ministry of Federal Education is expanding teacher training and digital classrooms.",
                "cpec_relevance": "CPEC school and vocational projects indirectly need more educators and trainers.",
                "economic_outlook": "Teaching is stable, especially with government and NGO roles in rural education.",
                "hiring_trend": "stable",
                "key_ministry_body": "Ministry of Federal Education",
                "salary_impact": "Public education pay is modest, so combine teaching skills with tutoring or digital coaching."
            },
            "Help one student learn something new today.",
            "Focus on real teaching practice more than exam scores.",
            "If you enjoy explaining ideas and helping someone understand, this path fits you."
        )
    if sector == "health":
        return (
            [
                {"title": "Nursing School Guide", "type": "Online", "url": "https://www.hec.gov.pk/english/scholarships", "why": "Use HEC and health school guides to understand medical education pathways."},
                {"title": "Al-Khidmat Medical Volunteer", "type": "Volunteer", "url": "https://alkhidmat.org.pk/", "why": "Health volunteering helps you learn about patient care and hospital work."}
            ],
            [
                {"channel_name": "MedSchoolInsiders", "channel_url": "https://www.youtube.com/@MedSchoolInsiders", "language": "English", "what_to_watch_first": "How to Study Medicine", "why_popular": "Good for medical aspirants around the world.", "level": "Beginner"},
                {"channel_name": "Dr. Najeeb Lectures", "channel_url": "https://www.youtube.com/@DoctorNajeeb", "language": "English", "what_to_watch_first": "Basic Anatomy", "why_popular": "Widely used by medical students in Pakistan.", "level": "Beginner"}
            ],
            {
                "government_focus": "Health ministry spending on hospitals and nursing programs is rising under PSDP.",
                "cpec_relevance": "CPEC healthcare investment supports new hospitals and allied health roles.",
                "economic_outlook": "Health careers remain stable with strong demand for nurses and allied professionals.",
                "hiring_trend": "growing",
                "key_ministry_body": "Ministry of National Health Services",
                "salary_impact": "Healthcare pay is steady, but inflation means you should seek training that leads to government or NGO roles."
            },
            "Volunteer in a health or community clinic this week.",
            "Choose practical patient-care skills over expensive certifications.",
            "If you enjoy helping others in a calm, caring way, this career fits you."
        )
    if sector == "professional":
        return (
            [
                {"title": "Google Digital Garage", "type": "Google", "url": "https://learndigital.withgoogle.com/digitalgarage", "why": "A broad foundation in business and professional skills."},
                {"title": "HSBC Skills for Life", "type": "Online", "url": "https://www.hsbc.com.pk/", "why": "Useful for finance and professional development."}
            ],
            [
                {"channel_name": "Edspira", "channel_url": "https://www.youtube.com/@Edspira", "language": "English", "what_to_watch_first": "Accounting Basics", "why_popular": "Clear professional studies content.", "level": "Beginner"},
                {"channel_name": "The Financial Diet", "channel_url": "https://www.youtube.com/@TheFinancialDiet", "language": "English", "what_to_watch_first": "Career Advice", "why_popular": "Useful for understanding finance careers.", "level": "Beginner"}
            ],
            {
                "government_focus": "HEC and SBP are encouraging finance, accounting, and civil services training for youth.",
                "cpec_relevance": "CPEC creates demand for legal, accounting, and procurement professionals in corridor projects.",
                "economic_outlook": "Professional roles are stable and respected, though pay growth is moderate.",
                "hiring_trend": "stable",
                "key_ministry_body": "Ministry of Commerce or Ministry of Finance",
                "salary_impact": "Pay can keep pace with inflation if you build a strong professional skillset."
            },
            "Start one finance or professional skills course today.",
            "Build a small real example of your professional skills.",
            "If you enjoy detailed work and helping others solve problems, this path fits you."
        )
    if sector == "trade":
        return (
            [
                {"title": "TEVTA Trade Courses", "type": "TEVTA", "url": "https://www.tevta.gop.pk/", "why": "Practical technical training for trades and engineering skills."},
                {"title": "YouTube Skill Training", "type": "YouTube", "url": "https://www.youtube.com/results?search_query=electrical+training+for+beginners", "why": "Free how-to videos for hands-on technical skills."}
            ],
            [
                {"channel_name": "Engineering Explained", "channel_url": "https://www.youtube.com/@EngineeringExplained", "language": "English", "what_to_watch_first": "Basic Mechanics", "why_popular": "Useful for hands-on technical learners.", "level": "Beginner"},
                {"channel_name": "Technical Guruji", "channel_url": "https://www.youtube.com/@TechnicalGuruji", "language": "Hindi/Urdu", "what_to_watch_first": "Electronics Basics", "why_popular": "Good for technical foundation in Urdu.", "level": "Beginner"}
            ],
            {
                "government_focus": "TEVTA and NAVTTC are funding vocational training and skilled trade programs.",
                "cpec_relevance": "CPEC infrastructure projects need practical engineers and technicians.",
                "economic_outlook": "Trade skills are stable and in demand with ongoing construction and industrial projects.",
                "hiring_trend": "stable",
                "key_ministry_body": "NAVTTC / TEVTA",
                "salary_impact": "Trade salaries are modest but reliable, especially with certifications and local demand."
            },
            "Practice one hands-on technical skill today.",
            "Focus on real practical experience more than theory.",
            "If you enjoy fixing things and learning by doing, this career fits you."
        )
    return (
        [
            {"title": "Google Digital Garage", "type": "Google", "url": "https://learndigital.withgoogle.com/digitalgarage", "why": "Free skills for a wide range of careers."}
        ],
        [
            {"channel_name": "Code with Harry", "channel_url": "https://www.youtube.com/@CodeWithHarry", "language": "Hindi/Urdu", "what_to_watch_first": "Career Guidance", "why_popular": "Good starting point for many Pakistani learners.", "level": "Beginner"}
        ],
        {
            "government_focus": "Pakistan is encouraging youth skill development through Digital Pakistan.",
            "cpec_relevance": "General economic growth from CPEC can indirectly support this path.",
            "economic_outlook": "Stable demand exists for skills-based careers with practical training.",
            "hiring_trend": "stable",
            "key_ministry_body": "Ministry of IT & Telecom / HEC",
            "salary_impact": "Look for roles that can earn in dollars or add real value locally."
        },
        "Take one concrete first step today.",
        "Focus on real practice over certificates.",
        "If you enjoy the work after one week of practice, this path is likely right."
    )


def _build_generic_career_template(career: dict, profile: dict) -> dict:
    sector = _career_sector(career.get("title", ""))
    income_key = get_income_bracket_key(profile.get("income_bracket", 30000))
    degree = career.get("education", "Relevant training or degree")
    duration = "Varies"
    if "4 years" in degree or "(4 years)" in degree:
        duration = "4 years"
    elif "5 years" in degree or "(5 years)" in degree:
        duration = "5 years"
    elif "3 years" in degree or "(3 years)" in degree:
        duration = "3 years"

    free_resources, youtube_channels, gov_trend, dont_mess_up, competition_reality, verify_fit = _sector_resources(sector)

    return {
        "education_route": {
            "degree": degree,
            "duration": duration,
            "best_universities": _select_universities(sector, profile.get("province", "")),
            "scholarships": _select_scholarships(sector, income_key)
        },
        "free_resources": free_resources,
        "youtube_channels": youtube_channels,
        "first_step_exploration": {
            "open_right_now": f"Search YouTube for 'beginner {career.get('title')} tutorial' and watch the first lesson today.",
            "watch_first": f"Watch one beginner video on {career.get('title')} to test your interest.",
            "join_community": f"Search Facebook or WhatsApp groups for '{career.get('title')} Pakistan' and ask one question.",
            "offline_action": f"Visit a local training centre or college and ask about classes for {career.get('title')}",
            "free_skill_to_practice": f"Spend 30 minutes practicing a basic {career.get('title')} skill today.",
            "how_to_verify_fit": verify_fit
        },
        "pakistan_gov_trend": gov_trend,
        "dont_mess_up": dont_mess_up,
        "competition_reality": competition_reality
    }


def _template_for_career(career: dict, profile: dict) -> dict:
    template = ROADMAP_TEMPLATES.get(_normalize_title(career.get("title", "")))
    if template:
        return template
    return _build_generic_career_template(career, profile)


def _format_income(min_income: int, multiplier: float = 1.0) -> str:
    return f"PKR {int(min_income * multiplier):,}"


def generate_local_roadmap(profile: dict, tfidf_matches: list) -> dict:
    name = profile.get("name", "Student")
    matches = tfidf_matches or matcher.match(
        profile.get("conversation_summary", ""),
        profile.get("income_bracket", 30000),
        profile.get("personality_type", ""),
        top_n=6
    )
    if not matches:
        matches = matcher.match("general interest", profile.get("income_bracket", 30000), profile.get("personality_type", ""), top_n=3)

    selected = matches[:3]
    path_orders = ["safe", "growth", "ambitious"]
    paths = []
    interest_text = ", ".join(profile.get("interests", [])[:2]) or "practical work"
    academic_strength = profile.get("academic_strength", "real-world learning")

    for idx, career in enumerate(selected):
        template = _template_for_career(career, profile)
        path_id = path_orders[idx] if idx < len(path_orders) else "ambitious"
        if path_id == "safe":
            tagline = f"A stable path in {career['title']} with realistic income and practical training."
        elif path_id == "growth":
            tagline = f"A good growth path in {career['title']} that rewards effort and in-demand skills."
        else:
            tagline = f"An ambitious path in {career['title']} aimed at higher responsibility and income."

        entry_income = career.get("min_income_pkr", 25000)
        after_income = entry_income + 30000 if entry_income < 60000 else int(entry_income * 1.8)
        first_job = career.get("title")
        if "freelancer" in career["title"].lower():
            first_job = f"Freelance {career['title'].lower()} gigs or junior remote projects"

        paths.append({
            "id": path_id,
            "title": career["title"],
            "tagline": tagline,
            "personality_fit": f"This path fits a {profile.get('personality_type', 'balanced')} learner who likes {interest_text} and {academic_strength}.",
            "realistic_monthly_income": {
                "entry_level": _format_income(entry_income, 1.0),
                "after_5_years": _format_income(after_income, 1.0)
            },
            "education_route": template["education_route"],
            "free_resources": template["free_resources"],
            "roadmap": {
                "this_month": [
                    template["first_step_exploration"]["free_skill_to_practice"],
                    template["first_step_exploration"]["open_right_now"]
                ],
                "next_6_months": [
                    f"Complete the beginner learning path for {career['title']}",
                    f"Build one small project or portfolio item that demonstrates your interest in {career['title']}"
                ],
                "year_1_2": [
                    f"Join an internship, apprenticeship or entry-level role related to {career['title']}",
                    "Continue learning through free courses and scholarship-friendly programs"
                ],
                "year_3_5": [
                    f"Seek higher responsibility or freelance clients in {career['title']}",
                    "Consider a specialised degree or certification to boost your earning potential"
                ],
                "first_job": first_job
            },
            "volunteering_now": [
                {
                    "org": "Local community centre",
                    "type": f"Volunteer work related to {career['title']}",
                    "city": profile.get("city", "your city"),
                    "how_to_join": f"Ask at your local community centre or school about volunteering in a way that relates to {career['title']}"
                }
            ],
            "dont_mess_up": template["dont_mess_up"],
            "competition_reality": template["competition_reality"],
            "pakistan_gov_trend": template["pakistan_gov_trend"],
            "youtube_channels": template["youtube_channels"],
            "first_step_exploration": template["first_step_exploration"]
        })

    income_key = get_income_bracket_key(profile.get("income_bracket", 30000))
    income_label = {
        "under_20000": "very limited resources",
        "20000_40000": "a modest budget",
        "40000_80000": "moderate means",
        "80000_150000": "a solid family income",
        "above_150000": "comfortable support"
    }.get(income_key, "a realistic budget")

    return {
        "user_name": name,
        "income_reality_check": f"Your family income is {income_label}, so focus on options with scholarships, government support, or early income.",
        "immediate_action": paths[0]["first_step_exploration"]["open_right_now"],
        "motivational_note": f"{name}, this roadmap is built for your profile, interests and strengths with practical next steps.",
        "paths": paths
    }


def generate_demo_roadmap(profile: dict, tfidf_matches: list, reason: str = None) -> dict:
    user_name = profile.get("name", "Student")
    career_focus = "technology" if profile.get("personality_type") in ("INTJ", "INTP", "ENTP", "ENTJ") else "business"
    income_key = get_income_bracket_key(profile.get("income_bracket", 30000))
    income_hint = {
        "under_20000": "Your family income is tight, so focus on career paths with low cost and strong scholarship support.",
        "20000_40000": "You have a modest budget, so choose options with government support and low-cost learning.",
        "40000_80000": "You can pursue public university programs with a good chance of success.",
        "80000_150000": "You can pursue a mix of quality universities and scholarships with effort.",
        "above_150000": "You have a comfortable budget and can aim for competitive programs with support.",
    }.get(income_key, "Start with stable, realistic options and grow from there.")

    return {
        "user_name": user_name,
        "income_reality_check": income_hint,
        "immediate_action": "Open a browser and search for 'free Python course for beginners' on YouTube; start the first lesson today.",
        "motivational_note": f"{user_name}, this demo roadmap is based on your profile and is ready now. If AI is unavailable, use it to keep moving forward.",
        "paths": [
            {
                "id": "safe",
                "title": "Career Support Technician",
                "tagline": "A stable tech-adjacent path with quick entry and practical skill growth.",
                "personality_fit": "This path suits thoughtful planners who prefer clear steps and steady progress.",
                "realistic_monthly_income": {"entry_level": "PKR 45,000", "after_5_years": "PKR 90,000"},
                "education_route": {
                    "degree": "Diploma in IT/Computer Hardware",
                    "duration": "1-2 years",
                    "best_universities": [
                        {"name": "Government College University", "city": "Lahore", "admission_test": "Entry test", "fee_per_semester": "PKR 25,000"}
                    ],
                    "scholarships": [
                        {"name": "Ehsaas Needs-Based Scholarship", "amount": "PKR 40,000", "eligibility": "Low income + good academics", "apply_at": "https://ehsaas.nadra.gov.pk"}
                    ]
                },
                "roadmap": {
                    "this_month": ["List 3 local IT training centers", "Watch a basic computer hardware guide on YouTube"],
                    "next_6_months": ["Complete a diploma or IT certificate", "Volunteer at a local computer lab"],
                    "year_1_2": ["Start an entry-level support job", "Build a small freelance portfolio"],
                    "year_3_5": ["Move to a higher technical role", "Prepare for a bachelor’s program if possible"],
                    "first_job": "Entry-level support technician or junior IT helpdesk role at a school or office"
                },
                "volunteering_now": [
                    {"org": "Edhi Foundation", "type": "Community IT support", "city": profile.get("city", "Islamabad"), "how_to_join": "Visit the local Edhi centre and offer computer lab help."}
                ],
                "dont_mess_up": "Keep your attendance and basic computer skills strong — employers value reliability over flashy skills.",
                "competition_reality": "Moderate competition, but practical skills and good communication make you stand out.",
                "pakistan_gov_trend": {
                    "government_focus": "Government is supporting digital skills training and IT support roles through Digital Pakistan initiatives.",
                    "cpec_relevance": "Not directly relevant, but improved internet infrastructure helps this field.",
                    "economic_outlook": "Entry-level support roles are stable in 2025-2026; pay is modest but consistent.",
                    "hiring_trend": "stable",
                    "key_ministry_body": "Ministry of IT & Telecom (MoITT)",
                    "salary_impact": "PKR inflation means starting salaries may feel low, so aim for roles with increment paths."
                },
                "youtube_channels": [
                    {"channel_name": "Technical Guruji", "channel_url": "https://www.youtube.com/@TechnicalGuruji", "language": "Hindi/Urdu", "what_to_watch_first": "Computer Hardware Course", "why_popular": "Popular for easy-to-follow hardware and troubleshooting tutorials.", "level": "Beginner"}
                ],
                "first_step_exploration": {
                    "open_right_now": "Open YouTube and search for 'basic computer hardware tutorial' — watch the first 15-minute video.",
                    "watch_first": "'Computer Hardware for Beginners' by Technical Guruji on YouTube — learn basic PC parts.",
                    "join_community": "Search Facebook group 'Pakistan IT Support' and request to join.",
                    "offline_action": "Visit a nearby computer shop and ask if you can observe or help with basic repair work.",
                    "free_skill_to_practice": "Use YouTube and practice identifying PC parts in a local computer lab.",
                    "how_to_verify_fit": "If you enjoy solving computer problems and can explain them simply after one week, this path fits you."
                }
            },
            {
                "id": "growth",
                "title": "Junior Web Developer",
                "tagline": "A practical coding path with strong demand across Pakistani startups and agencies.",
                "personality_fit": "Good for curious learners who enjoy building and solving real problems.",
                "realistic_monthly_income": {"entry_level": "PKR 50,000", "after_5_years": "PKR 120,000"},
                "education_route": {
                    "degree": "Associate Degree in Software Development",
                    "duration": "2 years",
                    "best_universities": [
                        {"name": "COMSATS University", "city": "Islamabad", "admission_test": "COMSATS test", "fee_per_semester": "PKR 40,000"}
                    ],
                    "scholarships": [
                        {"name": "ICT R&D Scholarship", "amount": "Up to 50%", "eligibility": "Merit-based for computing students", "apply_at": "https://ictrd.gov.pk"}
                    ]
                },
                "roadmap": {
                    "this_month": ["Create a GitHub account", "Complete a free HTML/CSS tutorial"],
                    "next_6_months": ["Build 2 small web projects", "Apply for internships"],
                    "year_1_2": ["Join a junior developer role", "Learn JavaScript frameworks"],
                    "year_3_5": ["Lead small web projects", "Move to higher-paying tech firms"],
                    "first_job": "Junior front-end web developer or intern at a local software house"
                },
                "volunteering_now": [
                    {"org": "Code for Pakistan", "type": "Civic tech", "city": profile.get("city", "Islamabad"), "how_to_join": "Attend a meetup or email the local chapter."}
                ],
                "dont_mess_up": "Keep your code portfolio updated with real projects — practical examples matter more than certificates.",
                "competition_reality": "Strong demand in urban centers, but recruiters want demonstrable skills and projects.",
                "pakistan_gov_trend": {
                    "government_focus": "Digital Pakistan and PSEB are pushing web development skills for export-ready startups.",
                    "cpec_relevance": "Indirectly useful because more digital services are being developed in CPEC-related economic zones.",
                    "economic_outlook": "Web development demand remains strong in 2025-2026, especially for remote freelance work.",
                    "hiring_trend": "growing",
                    "key_ministry_body": "Pakistan Software Export Board (PSEB)",
                    "salary_impact": "PKR inflation increases the value of foreign-earned freelance income more than local salaries."
                },
                "youtube_channels": [
                    {"channel_name": "Code with Harry", "channel_url": "https://www.youtube.com/@CodeWithHarry", "language": "Hindi/Urdu", "what_to_watch_first": "Web development playlist", "why_popular": "Highly rated by beginners for clear tutorials.", "level": "Beginner"}
                ],
                "first_step_exploration": {
                    "open_right_now": "Open freeCodeCamp and start the 'Responsive Web Design' section.",
                    "watch_first": "'HTML and CSS Tutorial for Beginners' by Code with Harry — learn page structure.",
                    "join_community": "Join Facebook group 'Pakistan Web Developers' and ask one question.",
                    "offline_action": "Visit a local software house and ask about junior web developer internships.",
                    "free_skill_to_practice": "Build a one-page website for a friend or local shop.",
                    "how_to_verify_fit": "If you enjoy building small websites and debugging layout issues, this path is a good fit."
                }
            },
            {
                "id": "ambitious",
                "title": "Freelance Full Stack Developer",
                "tagline": "A higher-growth path that can pay well with a strong portfolio and freelance access.",
                "personality_fit": "Best for creative problem solvers who want flexibility and higher income potential.",
                "realistic_monthly_income": {"entry_level": "PKR 60,000", "after_5_years": "PKR 180,000"},
                "education_route": {
                    "degree": "Bachelor’s in Computer Science",
                    "duration": "4 years",
                    "best_universities": [
                        {"name": "National University of Sciences & Technology", "city": "Islamabad", "admission_test": "NUST EEE", "fee_per_semester": "PKR 100,000"}
                    ],
                    "scholarships": [
                        {"name": "NUST Financial Aid", "amount": "Up to 100%", "eligibility": "Merit + need-based", "apply_at": "https://nust.edu.pk"}
                    ]
                },
                "roadmap": {
                    "this_month": ["Learn JavaScript basics", "Join a Pakistani freelancing forum"],
                    "next_6_months": ["Build a full-stack mini app", "Create a Fiverr/Upwork profile"],
                    "year_1_2": ["Win your first freelancing client", "Build repeatable project templates"],
                    "year_3_5": ["Scale into higher-value web apps", "Mentor junior developers"],
                    "first_job": "Junior full-stack developer or freelance web app builder"
                },
                "volunteering_now": [
                    {"org": "Pakistani Youth Change Advocates", "type": "Digital leadership", "city": profile.get("city", "Karachi"), "how_to_join": "Search the group on Facebook and request membership."}
                ],
                "dont_mess_up": "Keep learning by doing real projects, not just watching videos.",
                "competition_reality": "High interest, but strong portfolios and client work stand out.",
                "pakistan_gov_trend": {
                    "government_focus": "Freelancing is promoted by the PM Youth Programme and Digital Pakistan skills training.",
                    "cpec_relevance": "Not directly, but digital infrastructure improvements help remote work.",
                    "economic_outlook": "Freelancing growth is strong, especially for software skills that earn in dollars.",
                    "hiring_trend": "growing",
                    "key_ministry_body": "Ministry of IT & Telecom (MoITT)",
                    "salary_impact": "PKR inflation makes dollar-earning freelancing especially valuable in Pakistan."
                },
                "youtube_channels": [
                    {"channel_name": "Traversy Media", "channel_url": "https://www.youtube.com/@TraversyMedia", "language": "English", "what_to_watch_first": "Full Stack Web Development Tutorial", "why_popular": "Good for project-based learning and real products.", "level": "Intermediate"}
                ],
                "first_step_exploration": {
                    "open_right_now": "Open Upwork and read the beginner freelancing guide.",
                    "watch_first": "'How to Start Freelancing' by Traversy Media — learn the first steps.",
                    "join_community": "Join the Facebook group 'Pakistani Freelancers' and introduce yourself.",
                    "offline_action": "Talk to a local programmer or freelancer about their first client.",
                    "free_skill_to_practice": "Build a simple full-stack app using free resources like freeCodeCamp.",
                    "how_to_verify_fit": "If you can complete one small app and enjoy the process, this path is right for you."
                }
            }
        ],
        "fallback_reason": reason,
    }

# ── MBTI → Enneagram Mapping ─────────────────────────
MBTI_TO_ENNEAGRAM = {
    "INTJ": "5w6 (The Investigator)",
    "INTP": "5w4 (The Iconoclast)",
    "ENTJ": "8w7 (The Maverick)",
    "ENTP": "7w8 (The Realist)",
    "INFJ": "4w5 (The Bohemian)",
    "INFP": "4w5 (The Bohemian)",
    "ENFJ": "2w3 (The Host)",
    "ENFP": "7w6 (The Entertainer)",
    "ISTJ": "1w9 (The Optimist)",
    "ISFJ": "6w5 (The Defender)",
    "ESTJ": "8w9 (The Bear)",
    "ESFJ": "2w1 (The Servant)",
    "ISTP": "5w6 (The Investigator)",
    "ISFP": "9w1 (The Dreamer)",
    "ESTP": "7w8 (The Realist)",
    "ESFP": "7w6 (The Entertainer)",
}

# ── ENDPOINT: Health Check ────────────────────────────
@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "ai_available": gemini_client is not None,
        "firebase_connected": db is not None,
        "version": "1.0.0"
    }

# ── ENDPOINT 1: Session ──────────────────────────────
@app.post("/session/create")
async def create_session(request: Request):
    check_rate_limit(request)
    sid = str(uuid.uuid4())
    if db:
        try:
            db.collection("sessions").document(sid).set({
                "created_at": firestore.SERVER_TIMESTAMP,
                "chat_complete": False,
                "personality_complete": False,
                "roadmap_generated": False
            })
        except Exception as e:
            print(f"Firebase session create error: {e}")
    return {"session_id": sid}

@app.get("/session/{session_id}")
async def get_session(session_id: str):
    if not db:
        return {"session_id": session_id, "chat_complete": False}
    doc = db.collection("sessions").document(session_id).get()
    if not doc.exists:
        raise HTTPException(404, "Session not found")
    return doc.to_dict()

# ── ENDPOINT 2: Chat ─────────────────────────────────
CHAT_SYSTEM = """
You are Raah (راہ), a friendly Pakistani career companion for teenagers aged 13-20.
Your name means "path" in Urdu. You are warm and speak simple English mixed with occasional Urdu words.

YOUR GOAL: Understand the teenager through natural conversation.
Find out:
1. Which subjects they enjoy or hate
2. What they do in free time (hobbies, YouTube, gaming, reading etc)
3. What future they imagine for themselves
4. What their parents do for work
5. What skills they already have or want to learn

Rules:
- Ask ONE question at a time only. Never multiple.
- Keep responses under 3 sentences.
- Be encouraging but NOT fake. Be real about Pakistan's job market.
- Use occasional Urdu phrases like "Mashallah", "Inshallah", "Bohat acha" to feel relatable.
- After the user has answered 4-5 of your questions,
  add this EXACTLY at the end of your response on a new line:
  ###READY###
  {"interests": ["interest1", "interest2"], "academic_strength": "subjects they mentioned", "raw_summary": "2 sentence summary of what this student wants and where they come from"}

Do not show ###READY### to the user visually — the app handles it.
"""

@app.post("/chat")
async def chat(payload: ChatPayload, request: Request):
    check_rate_limit(request)
    if gemini_client is None:
        raise HTTPException(503, "AI service unavailable: GEMINI_API_KEY not configured.")
    try:
        # Build history in new SDK format
        formatted = []
        for m in payload.history:
            role = m["role"] if m["role"] in ("user", "model") else "user"
            formatted.append(
                genai_types.Content(role=role, parts=[genai_types.Part(text=m["content"])])
            )

        chat_session = gemini_client.chats.create(
            model=GEMINI_MODEL,
            history=formatted
        )

        # Only prepend system context on first message (no history)
        if len(payload.history) == 0:
            full_message = f"{CHAT_SYSTEM}\n\nUser: {payload.message}"
        else:
            full_message = payload.message

        response = chat_session.send_message(full_message)
        text = response.text

        is_ready = "###READY###" in text
        extracted = None
        display = text

        if is_ready:
            parts = text.split("###READY###")
            display = parts[0].strip()
            try:
                extracted = extract_json(parts[1])
            except:
                extracted = None

        if db and is_ready:
            try:
                db.collection("sessions").document(payload.session_id).update({
                    "chat_complete": True,
                    "extracted_data": extracted
                })
            except Exception as e:
                print(f"Firebase update error: {e}")

        return {
            "response": display,
            "is_ready": is_ready,
            "extracted_data": extracted,
            "session_id": payload.session_id
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Chat error: {str(e)[:200]}")

# ── ENDPOINT 3: Personality ──────────────────────────
@app.get("/personality/questions")
async def get_questions():
    return [
        {"id": 1, "dimension": "EI", "text": "After a long school day, you feel better when you...",
         "options": [{"text": "Hang out with friends or family", "scores": {"E": 1, "I": 0}},
                     {"text": "Spend time alone doing something you enjoy", "scores": {"E": 0, "I": 1}}]},
        {"id": 2, "dimension": "EI", "text": "In group projects, you usually...",
         "options": [{"text": "Take the lead and talk a lot", "scores": {"E": 1, "I": 0}},
                     {"text": "Do the work quietly in the background", "scores": {"E": 0, "I": 1}}]},
        {"id": 3, "dimension": "SN", "text": "When solving a problem, you prefer...",
         "options": [{"text": "Step-by-step proven methods", "scores": {"S": 1, "N": 0}},
                     {"text": "Creative new approaches even if untested", "scores": {"S": 0, "N": 1}}]},
        {"id": 4, "dimension": "SN", "text": "You are more interested in...",
         "options": [{"text": "What is real and practical today", "scores": {"S": 1, "N": 0}},
                     {"text": "What could be possible in the future", "scores": {"S": 0, "N": 1}}]},
        {"id": 5, "dimension": "TF", "text": "When a friend is upset, you first...",
         "options": [{"text": "Help them solve the problem logically", "scores": {"T": 1, "F": 0}},
                     {"text": "Listen and make them feel understood", "scores": {"T": 0, "F": 1}}]},
        {"id": 6, "dimension": "TF", "text": "You make big decisions based on...",
         "options": [{"text": "Logic and what makes sense", "scores": {"T": 1, "F": 0}},
                     {"text": "Feelings and what feels right", "scores": {"T": 0, "F": 1}}]},
        {"id": 7, "dimension": "JP", "text": "Your room or school bag is usually...",
         "options": [{"text": "Organized — you know where everything is", "scores": {"J": 1, "P": 0}},
                     {"text": "A bit messy but you manage", "scores": {"J": 0, "P": 1}}]},
        {"id": 8, "dimension": "JP", "text": "For a deadline, you...",
         "options": [{"text": "Start early and finish before time", "scores": {"J": 1, "P": 0}},
                     {"text": "Work better under pressure at the last minute", "scores": {"J": 0, "P": 1}}]},
        {"id": 9, "dimension": "SN", "text": "In class you prefer when the teacher...",
         "options": [{"text": "Gives clear facts and examples", "scores": {"S": 1, "N": 0}},
                     {"text": "Discusses big ideas and theories", "scores": {"S": 0, "N": 1}}]},
        {"id": 10, "dimension": "TF", "text": "Between justice and mercy, you believe in...",
         "options": [{"text": "Justice — rules exist for a reason", "scores": {"T": 1, "F": 0}},
                     {"text": "Mercy — people deserve understanding", "scores": {"T": 0, "F": 1}}]},
        {"id": 11, "dimension": "EI", "text": "At an event with strangers, you...",
         "options": [{"text": "Enjoy meeting new people", "scores": {"E": 1, "I": 0}},
                     {"text": "Stay close to the people you came with", "scores": {"E": 0, "I": 1}}]},
        {"id": 12, "dimension": "JP", "text": "On a completely free day with no plans, you feel...",
         "options": [{"text": "A bit lost — you like structure", "scores": {"J": 1, "P": 0}},
                     {"text": "Free — you love going with the flow", "scores": {"J": 0, "P": 1}}]},
    ]

TRAIT_MAP = {
    "INTJ": "strategic, independent, long-term planner — thrives in research and complex systems",
    "INTP": "analytical, curious, logic-driven — excellent at solving complex problems",
    "ENTJ": "natural leader, decisive, goal-oriented — suited for management and entrepreneurship",
    "ENTP": "innovative, debate-loving, entrepreneurial — sees possibilities others miss",
    "INFJ": "empathetic, visionary, purpose-driven — excellent in counseling and social impact",
    "INFP": "creative, idealistic, value-driven — suited for arts and helping professions",
    "ENFJ": "charismatic, people-focused, motivating — natural teacher or community leader",
    "ENFP": "enthusiastic, creative, sociable — great in communication and creative fields",
    "ISTJ": "reliable, detail-oriented, traditional — excellent in accounting and administration",
    "ISFJ": "caring, dependable, service-oriented — suited for healthcare and education",
    "ESTJ": "organized, practical, leadership-capable — great in management and law",
    "ESFJ": "warm, social, harmony-seeking — suited for HR and community roles",
    "ISTP": "practical, hands-on problem solver — great in engineering and technical trades",
    "ISFP": "artistic, gentle, present-focused — suited for design and healthcare",
    "ESTP": "action-oriented, realistic, good under pressure — great in business and entrepreneurship",
    "ESFP": "energetic, spontaneous, people-loving — great in creative and social fields"
}

@app.post("/personality/calculate")
async def calculate(payload: PersonalityAnswers, request: Request):
    check_rate_limit(request)
    scores = {"E": 0, "I": 0, "S": 0, "N": 0, "T": 0, "F": 0, "J": 0, "P": 0}
    for answer in payload.answers:
        for dim, pts in answer.get("scores", answer).items():
            if dim in scores:
                scores[dim] += pts
    mbti = (
        ("E" if scores["E"] >= scores["I"] else "I") +
        ("S" if scores["S"] >= scores["N"] else "N") +
        ("T" if scores["T"] >= scores["F"] else "F") +
        ("J" if scores["J"] >= scores["P"] else "P")
    )
    enneagram = MBTI_TO_ENNEAGRAM.get(mbti, "9w1 (The Peacemaker)")
    return {
        "type": mbti,
        "traits": TRAIT_MAP.get(mbti, "balanced"),
        "scores": scores,
        "enneagram": enneagram
    }

# ── ENDPOINT 4: Career Match ─────────────────────────
@app.post("/match-careers")
async def match_careers(payload: MatchCareersPayload, request: Request):
    check_rate_limit(request)
    matches = matcher.match(
        payload.conversation_text,
        payload.income_bracket,
        payload.personality_type
    )
    return {"matches": matches}

# ── ENDPOINT 5: Generate Roadmap ─────────────────────
@app.post("/generate-roadmap")
async def generate_roadmap(profile: UserProfile, request: Request):
    check_rate_limit(request)
    cache_key = f"{profile.session_id}_roadmap"
    if cache_key in roadmap_cache:
        return roadmap_cache[cache_key]

    # Auto-fill enneagram if not provided
    if not profile.enneagram_type:
        profile.enneagram_type = MBTI_TO_ENNEAGRAM.get(profile.personality_type, "9w1 (The Peacemaker)")

    tfidf = matcher.match(
        profile.conversation_summary,
        profile.income_bracket,
        profile.personality_type
    )

    try:
        roadmap = generate_local_roadmap(profile.model_dump(), tfidf)
    except Exception as e:
        raise HTTPException(500, f"Roadmap generation failed: {str(e)[:200]}")

    if db:
        try:
            db.collection("roadmaps").document(profile.session_id).set({
                "profile": profile.model_dump(),
                "roadmap": roadmap,
                "created_at": firestore.SERVER_TIMESTAMP
            })
            db.collection("sessions").document(profile.session_id).update({
                "roadmap_generated": True
            })
        except Exception as e:
            print(f"Firebase save error: {e}")

    roadmap_cache[cache_key] = roadmap
    return roadmap

# ── ENDPOINT 6: Opportunities ────────────────────────
OPPORTUNITIES_DB = {
    "rawalpindi": [
        {"title": "IEEE FJWU Volunteer", "org": "IEEE", "type": "Technology", "commitment": "Weekend events", "contact": "ieee.fjwu@gmail.com", "benefit": "Certificate + IEEE membership"},
        {"title": "Edhi Foundation Helper", "org": "Edhi Foundation", "type": "Social Work", "commitment": "Anytime", "contact": "Visit nearest Edhi center", "benefit": "Experience + reference letter"},
        {"title": "Teach For Pakistan", "org": "TFP", "type": "Education", "commitment": "Part-time", "contact": "teachforpakistan.org", "benefit": "Training + possible stipend"},
        {"title": "Al-Khidmat Youth Wing", "org": "Al-Khidmat Foundation", "type": "Community Service", "commitment": "Flexible", "contact": "alkhidmat.org", "benefit": "Leadership skills + certificate"},
    ],
    "islamabad": [
        {"title": "GDGoC IST Event Volunteer", "org": "GDGoC IST", "type": "Technology", "commitment": "Event-based", "contact": "gdgoc.ist@gmail.com", "benefit": "Tech network + Google certificate"},
        {"title": "Pakistan Youth Change Advocates", "org": "PYCA", "type": "Social Impact", "commitment": "Flexible", "contact": "pyca.org.pk", "benefit": "Leadership training"},
        {"title": "Digital Pakistan Youth", "org": "MoIT", "type": "Digital Literacy", "commitment": "Flexible", "contact": "digitalpakistan.gov.pk", "benefit": "Government certificate"},
        {"title": "NUST Community Service Club", "org": "NUST", "type": "Education", "commitment": "Weekly", "contact": "nust.edu.pk/community", "benefit": "University exposure + mentorship"},
        {"title": "Al-Khidmat Foundation Islamabad", "org": "Al-Khidmat Foundation", "type": "Humanitarian", "commitment": "Flexible", "contact": "alkhidmat.org", "benefit": "Community impact + certificate"},
    ],
    "lahore": [
        {"title": "Akhuwat Foundation Volunteer", "org": "Akhuwat", "type": "Microfinance & Social Work", "commitment": "Part-time", "contact": "akhuwat.org.pk", "benefit": "Reference + experience"},
        {"title": "Lahore Museum Youth Guide", "org": "Lahore Museum", "type": "Heritage", "commitment": "Weekends", "contact": "Visit Lahore Museum admin", "benefit": "Certificate"},
        {"title": "LUMS Social Enterprise", "org": "LUMS", "type": "Entrepreneurship", "commitment": "Semester-based", "contact": "lums.edu.pk", "benefit": "Mentorship + LUMS network"},
        {"title": "Code for Pakistan — Lahore Chapter", "org": "Code for Pakistan", "type": "Civic Tech", "commitment": "Monthly meetups", "contact": "codeforpakistan.org", "benefit": "Tech skills + portfolio"},
    ],
    "karachi": [
        {"title": "IBA Community Service", "org": "IBA Karachi", "type": "Education", "commitment": "Semester-based", "contact": "iba.edu.pk", "benefit": "IBA network"},
        {"title": "Karachi Youth Assembly", "org": "KYA", "type": "Civic Leadership", "commitment": "Monthly", "contact": "Facebook: Karachi Youth Assembly", "benefit": "Leadership certificate"},
        {"title": "Indus Valley Design Workshop", "org": "IVS", "type": "Design & Arts", "commitment": "Weekend workshops", "contact": "indusvalley.edu.pk", "benefit": "Portfolio + mentorship"},
    ],
    "peshawar": [
        {"title": "UET Peshawar Tech Club", "org": "UET", "type": "Technology", "commitment": "Event-based", "contact": "uetpeshawar.edu.pk", "benefit": "Tech exposure"},
        {"title": "UNHCR Volunteer", "org": "UNHCR", "type": "Humanitarian", "commitment": "Flexible", "contact": "unhcr.org/pakistan", "benefit": "International org experience"},
        {"title": "Peshawar 2.0 Tech Community", "org": "P2.0", "type": "Technology", "commitment": "Monthly meetups", "contact": "peshawar2.com", "benefit": "Startup ecosystem access"},
    ],
    "quetta": [
        {"title": "Balochistan Youth Council", "org": "BYC", "type": "Civic", "commitment": "Monthly", "contact": "Facebook: Balochistan Youth Council", "benefit": "Leadership network"},
        {"title": "Edhi Foundation Quetta", "org": "Edhi Foundation", "type": "Humanitarian", "commitment": "Anytime", "contact": "Visit nearest Edhi center", "benefit": "Service experience"},
    ],
    "faisalabad": [
        {"title": "GC University Tech Society", "org": "GCU Faisalabad", "type": "Technology", "commitment": "Weekly", "contact": "gcuf.edu.pk", "benefit": "Technical skills"},
        {"title": "Faisalabad Chamber Youth Wing", "org": "FCCI", "type": "Business", "commitment": "Monthly", "contact": "fcci.com.pk", "benefit": "Business networking"},
    ],
    "multan": [
        {"title": "BZU Youth Volunteers", "org": "BZU Multan", "type": "Education", "commitment": "Event-based", "contact": "bzu.edu.pk", "benefit": "Academic networking"},
        {"title": "Al-Khidmat Foundation Multan", "org": "Al-Khidmat Foundation", "type": "Community Service", "commitment": "Flexible", "contact": "alkhidmat.org", "benefit": "Leadership + certificate"},
    ],
}

@app.get("/opportunities/{city}")
async def get_opportunities(city: str):
    city_lower = city.lower().strip()
    # Try exact match first, then partial match
    if city_lower in OPPORTUNITIES_DB:
        return OPPORTUNITIES_DB[city_lower]
    for key in OPPORTUNITIES_DB:
        if key in city_lower or city_lower in key:
            return OPPORTUNITIES_DB[key]
    # Default with a note
    return OPPORTUNITIES_DB.get("islamabad", [])

# ── ENDPOINT 7: Trends ───────────────────────────────
@app.get("/trends")
async def get_trends(background_tasks: BackgroundTasks, request: Request):
    check_rate_limit(request)
    age = time.time() - news_cache["last_updated"]
    if age < 10800 and news_cache["data"]:
        return {"trends": news_cache["data"], "cached": True}
    background_tasks.add_task(_refresh_news)
    if news_cache["data"]:
        return {"trends": news_cache["data"], "cached": True, "refreshing": True}
    _refresh_news()
    return {"trends": news_cache["data"], "cached": False}

def _refresh_news():
    try:
        articles = fetch_news_trends()
        trends = get_trending_careers_from_news(articles)
        news_cache["data"] = trends
        news_cache["last_updated"] = time.time()
    except Exception as e:
        print(f"News refresh failed: {e}")

# ── Run ───────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)