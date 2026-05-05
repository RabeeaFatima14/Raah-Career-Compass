from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

CAREER_DATABASE = [
    {"title": "Software Engineer", "description": "coding programming computers apps websites technology algorithms data structures python java javascript problem solving logic systems full stack backend frontend", "min_income_pkr": 30000, "education": "BS Computer Science (4 years)", "growth": "high", "freelance_possible": True},
    {"title": "Doctor (MBBS)", "description": "medicine biology chemistry patients hospital health care anatomy science helping people disease treatment diagnosis", "min_income_pkr": 60000, "education": "MBBS (5 years) + 1 year house job", "growth": "stable", "freelance_possible": False},
    {"title": "Civil Engineer", "description": "construction buildings infrastructure design mathematics physics structures roads bridges planning", "min_income_pkr": 40000, "education": "BS Civil Engineering (4 years)", "growth": "stable", "freelance_possible": True},
    {"title": "Graphic Designer", "description": "art design creativity visual colors logos branding photoshop illustration creative drawings UI UX", "min_income_pkr": 20000, "education": "Short course or BFA (2-4 years)", "growth": "medium", "freelance_possible": True},
    {"title": "Teacher", "description": "education students school teaching explaining helping learning knowledge sharing classroom curriculum", "min_income_pkr": 20000, "education": "BA/BSc + B.Ed", "growth": "stable", "freelance_possible": True},
    {"title": "Chartered Accountant", "description": "accounting finance numbers taxes auditing business money calculations ICAP balance sheet", "min_income_pkr": 50000, "education": "CA (3-5 years after intermediate)", "growth": "stable", "freelance_possible": True},
    {"title": "Freelancer Tech", "description": "online remote work fiverr upwork web development programming independent flexible laptop internet", "min_income_pkr": 15000, "education": "Skills-based, no degree required", "growth": "high", "freelance_possible": True},
    {"title": "Pharmacist", "description": "medicine drugs pharmacy chemistry biology hospital dispensary prescription health", "min_income_pkr": 35000, "education": "Pharm-D (5 years)", "growth": "stable", "freelance_possible": False},
    {"title": "Lawyer", "description": "law justice court legal rights cases arguing constitution criminal civil government", "min_income_pkr": 30000, "education": "LLB (3 years after BA) or BS Law (5 years)", "growth": "high", "freelance_possible": True},
    {"title": "Journalist", "description": "writing news reporting media stories public information television radio digital social communication", "min_income_pkr": 25000, "education": "BS Mass Communication (4 years)", "growth": "medium", "freelance_possible": True},
    {"title": "Data Scientist", "description": "data analysis statistics machine learning AI python R mathematics patterns insights models neural networks deep learning", "min_income_pkr": 50000, "education": "BS Statistics or CS + specialization", "growth": "high", "freelance_possible": True},
    {"title": "Psychologist", "description": "mental health counseling behavior emotions therapy listening understanding people feelings mind", "min_income_pkr": 30000, "education": "BS Psychology + MS (6 years)", "growth": "growing", "freelance_possible": True},
    {"title": "Electrician Technician", "description": "electricity circuits wiring technical hands-on fixing machines practical electrical tools workshop", "min_income_pkr": 25000, "education": "DAE Electrical 3 years TEVTA", "growth": "stable", "freelance_possible": True},
    {"title": "Civil Servant CSS", "description": "government service country administration public sector leadership military discipline management policy", "min_income_pkr": 40000, "education": "Any bachelor degree + competitive exam", "growth": "stable", "freelance_possible": False},
    {"title": "Architect", "description": "buildings design spaces interior exterior drawing structures aesthetics creative planning housing construction", "min_income_pkr": 35000, "education": "B.Arch (5 years)", "growth": "medium", "freelance_possible": True},
    {"title": "Nurse", "description": "healthcare patients hospital caring helping medication treatment procedures clinical compassion bedside", "min_income_pkr": 25000, "education": "BS Nursing 4 years or Diploma 3 years", "growth": "high", "freelance_possible": False},
    {"title": "Digital Marketer", "description": "social media marketing online advertising campaigns analytics brand audience content engagement", "min_income_pkr": 25000, "education": "Any degree + certifications Google Meta", "growth": "high", "freelance_possible": True},
    {"title": "Video Editor Content Creator", "description": "video editing youtube content creation social media premiere after effects creative storytelling visual", "min_income_pkr": 20000, "education": "Self-taught or short course", "growth": "high", "freelance_possible": True},
    {"title": "Agricultural Scientist", "description": "farming crops soil plants agriculture rural food production environmental science outdoor nature", "min_income_pkr": 30000, "education": "BS Agriculture (4 years)", "growth": "stable", "freelance_possible": False},
    # NEW ADDITIONS
    {"title": "Cybersecurity Analyst", "description": "security hacking ethical hacker networks protection data privacy cyber threats firewall penetration testing", "min_income_pkr": 50000, "education": "BS CS/IT + security certifications (CEH, CompTIA)", "growth": "high", "freelance_possible": True},
    {"title": "UI/UX Designer", "description": "user interface experience design figma prototyping wireframes usability research mobile app web design interaction", "min_income_pkr": 30000, "education": "Short courses or BFA/BS Design (2-4 years)", "growth": "high", "freelance_possible": True},
    {"title": "Dentist", "description": "teeth dental oral health surgery patients clinic BDS dentistry mouth care cosmetic", "min_income_pkr": 50000, "education": "BDS (4 years + 1 house job)", "growth": "stable", "freelance_possible": True},
    {"title": "Islamic Finance Specialist", "description": "islamic banking halal finance shariah compliance sukuk takaful financial management economics business", "min_income_pkr": 45000, "education": "BS Finance/Economics + Islamic Finance certification", "growth": "high", "freelance_possible": False},
    {"title": "Supply Chain Manager", "description": "logistics supply chain operations inventory management procurement warehouse distribution planning transportation", "min_income_pkr": 40000, "education": "BBA/BS Supply Chain Management (4 years)", "growth": "medium", "freelance_possible": False},
    {"title": "AI/ML Engineer", "description": "artificial intelligence machine learning deep learning neural networks python tensorflow pytorch automation robotics", "min_income_pkr": 60000, "education": "BS CS/AI + specialization (4 years)", "growth": "high", "freelance_possible": True},
    {"title": "Cloud Engineer", "description": "cloud computing google cloud AWS azure devops infrastructure servers deployment kubernetes docker", "min_income_pkr": 50000, "education": "BS CS/IT + Google Cloud certifications", "growth": "high", "freelance_possible": True},
    {"title": "Mechanical Engineer", "description": "machines engines manufacturing automotive design CAD mechanics physics thermodynamics", "min_income_pkr": 35000, "education": "BS Mechanical Engineering (4 years)", "growth": "stable", "freelance_possible": False},
    {"title": "Social Media Manager", "description": "social media instagram tiktok facebook content creation branding community engagement viral marketing influencer", "min_income_pkr": 20000, "education": "Self-taught or BS Mass Comm", "growth": "high", "freelance_possible": True},
]

PERSONALITY_BOOSTS = {
    "INTJ": ["Software Engineer", "Data Scientist", "Architect", "Lawyer", "AI/ML Engineer", "Cybersecurity Analyst"],
    "INTP": ["Software Engineer", "Data Scientist", "Pharmacist", "AI/ML Engineer", "Cloud Engineer"],
    "ENTJ": ["Lawyer", "Chartered Accountant", "Civil Servant CSS", "Supply Chain Manager"],
    "ENTP": ["Lawyer", "Journalist", "Digital Marketer", "Data Scientist", "AI/ML Engineer"],
    "INFJ": ["Psychologist", "Teacher", "Journalist", "Islamic Finance Specialist"],
    "INFP": ["Graphic Designer", "Journalist", "Psychologist", "Video Editor Content Creator", "UI/UX Designer"],
    "ENFJ": ["Teacher", "Psychologist", "Civil Servant CSS", "Social Media Manager"],
    "ENFP": ["Digital Marketer", "Journalist", "Teacher", "Video Editor Content Creator", "Social Media Manager"],
    "ISTJ": ["Chartered Accountant", "Civil Engineer", "Civil Servant CSS", "Pharmacist", "Supply Chain Manager"],
    "ISFJ": ["Nurse", "Teacher", "Pharmacist", "Psychologist", "Dentist"],
    "ESTJ": ["Civil Servant CSS", "Lawyer", "Chartered Accountant", "Civil Engineer", "Supply Chain Manager"],
    "ESFJ": ["Nurse", "Teacher", "Digital Marketer", "Social Media Manager", "Dentist"],
    "ISTP": ["Electrician Technician", "Civil Engineer", "Software Engineer", "Mechanical Engineer", "Cybersecurity Analyst"],
    "ISFP": ["Graphic Designer", "Nurse", "Video Editor Content Creator", "Architect", "UI/UX Designer"],
    "ESTP": ["Digital Marketer", "Freelancer Tech", "Civil Servant CSS", "Social Media Manager"],
    "ESFP": ["Digital Marketer", "Video Editor Content Creator", "Nurse", "Teacher", "Social Media Manager"],
}

class CareerMatcher:
    def __init__(self):
        self.careers = CAREER_DATABASE
        self.vectorizer = TfidfVectorizer(
            stop_words='english',
            ngram_range=(1, 2),
            max_features=500
        )
        career_texts = [c["description"] for c in self.careers]
        self.career_vectors = self.vectorizer.fit_transform(career_texts)

    def match(self, user_text: str, income_bracket: int,
              personality_type: str = "", top_n: int = 5):
        if not user_text.strip():
            user_text = "general interest helping people"

        user_vector = self.vectorizer.transform([user_text])
        similarities = cosine_similarity(user_vector, self.career_vectors)[0].copy()

        boosts = PERSONALITY_BOOSTS.get(personality_type, [])
        for i, career in enumerate(self.careers):
            if career["title"] in boosts:
                similarities[i] = min(1.0, similarities[i] + 0.2)

        top_indices = np.argsort(similarities)[::-1]
        results = []

        for idx in top_indices:
            career = self.careers[idx]
            projected = income_bracket * 2
            if career["min_income_pkr"] <= projected:
                results.append({
                    **career,
                    "match_score": float(similarities[idx]),
                    "match_percentage": f"{min(99, int(similarities[idx] * 100))}%",
                    "personality_boosted": career["title"] in boosts
                })
            if len(results) >= top_n:
                break

        # If income filter removed all careers, return top matches regardless
        if not results:
            for idx in top_indices[:top_n]:
                career = self.careers[idx]
                results.append({
                    **career,
                    "match_score": float(similarities[idx]),
                    "match_percentage": f"{min(99, int(similarities[idx] * 100))}%",
                    "personality_boosted": career["title"] in boosts,
                    "note": "May require scholarship or financial aid"
                })

        return results