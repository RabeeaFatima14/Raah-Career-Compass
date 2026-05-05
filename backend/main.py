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

def safe_gemini(prompt: str, retries: int = 3) -> str:
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
            if "429" in str(e) or "quota" in str(e).lower():
                time.sleep((attempt + 1) * 10)
            elif attempt == retries - 1:
                raise HTTPException(503, f"AI service unavailable. Try again. Error: {str(e)[:100]}")
    return ""

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
        "ai_available": model is not None,
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

    prompt = build_roadmap_prompt(profile.model_dump(), tfidf)
    raw = safe_gemini(prompt)

    try:
        roadmap = extract_json(raw)
    except Exception as e:
        raise HTTPException(500, f"Failed to parse AI response. Please try again.")

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