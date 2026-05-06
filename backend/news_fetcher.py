import feedparser
import json
import os

PAKISTAN_NEWS_FEEDS = {
    "dawn": "https://www.dawn.com/feeds/home",
    "propakistani": "https://propakistani.pk/feed/",
    "techjuice": "https://techjuice.pk/feed/",
    "tribune": "https://tribune.com.pk/feed/home",
}

CAREER_KEYWORDS = [
    "jobs", "employment", "university", "scholarship", "internship",
    "startup", "technology", "education", "degree", "salary", "hiring",
    "NUST", "LUMS", "IBA", "FAST", "UET", "HEC", "NTS", "youth",
    "freelance", "AI", "digital", "cloud", "google", "remote", "skill",
    "CPEC", "PSEB", "minister", "government", "policy", "export", "fintech"
]

def fetch_news_trends():
    articles = []
    for source, url in PAKISTAN_NEWS_FEEDS.items():
        try:
            feed = feedparser.parse(url)
            for entry in feed.entries[:20]:
                title = entry.get("title", "")
                summary = entry.get("summary", "")
                combined = (title + " " + summary).lower()
                if any(kw.lower() in combined for kw in CAREER_KEYWORDS):
                    articles.append({
                        "source": source,
                        "title": title,
                        "summary": summary[:300],
                        "published": entry.get("published", ""),
                        "link": entry.get("link", "")
                    })
        except Exception as e:
            print(f"Feed failed {source}: {e}")
    return articles[:20]

def get_trending_careers_from_news(articles: list):
    if not articles:
        return _fallback_trends(articles)

    api_key = os.getenv("GEMINI_API_KEY")
    groq_key = os.getenv("GROQ_API_KEY")

    # Try Groq first if available
    if groq_key and not groq_key.startswith("REPLACE"):
        result = _analyze_with_groq(articles, groq_key)
        if result:
            return result

    # Fall back to Gemini
    if api_key and not api_key.startswith("REPLACE") and api_key != "your_gemini_api_key_here":
        result = _analyze_with_gemini(articles, api_key)
        if result:
            return result

    print("⚠️ No AI API key set — using curated Pakistan career trends.")
    return _fallback_trends(articles)

def _build_trend_prompt(articles):
    articles_text = "\n\n".join([
        f"Source: {a['source']}\nTitle: {a['title']}\nSummary: {a['summary']}"
        for a in articles[:10]
    ])
    return f"""
Analyze these Pakistani news articles. Extract career and education trends relevant to Pakistani youth (ages 13-20).
Focus on government policies, CPEC impacts, HEC decisions, and economic changes affecting careers.

Articles:
{articles_text}

Return ONLY a JSON array. No explanation. No markdown.
[
    {{
        "trend": "trend name",
        "description": "what this means for Pakistani youth careers — mention government/economic context",
        "relevant_fields": ["field1", "field2"],
        "opportunity_level": "high or medium or low"
    }}
]
"""

def _analyze_with_groq(articles, api_key):
    try:
        from groq import Groq
        client = Groq(api_key=api_key)
        response = client.chat.completions.create(
            model="llama-3.1-70b-versatile",
            messages=[{"role": "user", "content": _build_trend_prompt(articles)}],
            temperature=0.3,
            max_tokens=1024
        )
        text = response.choices[0].message.content.strip()
        text = text.replace("```json", "").replace("```", "").strip()
        start = text.find("[")
        if start == -1:
            return None
        text = text[start:]
        end = text.rfind("]") + 1
        return json.loads(text[:end])
    except Exception as e:
        print(f"Groq trend analysis failed: {e}")
        return None

def _analyze_with_gemini(articles, api_key):
    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(_build_trend_prompt(articles))
        text = response.text.strip().replace("```json", "").replace("```", "").strip()
        start = text.find("[")
        if start == -1:
            return None
        text = text[start:]
        end = text.rfind("]") + 1
        return json.loads(text[:end])
    except Exception as e:
        print(f"Gemini trend analysis failed: {e}")
        return None

def _fallback_trends(articles):
    """Curated Pakistan government-backed career trends 2025-2026"""
    return [
        {
            "trend": "Digital Pakistan — IT Export Push (MoITT + PSEB)",
            "description": "Ministry of IT & Telecom and PSEB target $5B IT exports by 2026. Tax exemptions for IT companies, dedicated freelancer bank accounts via SBP. CS, Software Engineering, AI/ML roles have direct government backing and fastest salary growth.",
            "relevant_fields": ["Computer Science", "AI/ML Engineering", "Cybersecurity", "Cloud Computing"],
            "opportunity_level": "high"
        },
        {
            "trend": "CPEC Phase 2 — Industrial & SEZ Demand",
            "description": "CPEC Phase 2 shifts to industrial cooperation. Special Economic Zones in Faisalabad, Lahore, KPK and Gwadar need engineers, supply chain managers, and trade professionals. Civil and mechanical engineers in high demand for corridor projects.",
            "relevant_fields": ["Civil Engineering", "Mechanical Engineering", "Supply Chain Management"],
            "opportunity_level": "high"
        },
        {
            "trend": "Pakistan Freelancing — 4th Globally ($500M+/year)",
            "description": "With PKR at ~280/USD, a freelancer earning $500/month earns PKR 140,000 — more than most entry-level corporate jobs. Government now supports freelancers with dedicated SBP bank accounts and PSEB registration benefits.",
            "relevant_fields": ["Web Development", "Graphic Design", "Digital Marketing", "UI/UX Design"],
            "opportunity_level": "high"
        },
        {
            "trend": "Healthcare Infrastructure Expansion (PSDP 2024-25)",
            "description": "Federal PSDP allocates PKR 120 billion for new hospitals. NHSRC hiring at scale. Lady Health Workers expanding to rural areas. Healthcare offers stable government employment even in economic downturns.",
            "relevant_fields": ["Medicine", "Nursing", "Pharmacy", "Public Health"],
            "opportunity_level": "medium"
        },
        {
            "trend": "HEC STEM Scholarships Doubled (2024-25)",
            "description": "HEC doubled scholarship seats under Ehsaas Undergraduate Scholarship. Priority: Engineering, IT, Agriculture, Sciences. Low-income students can access full tuition + stipend at public universities — a major opportunity right now.",
            "relevant_fields": ["Engineering", "Agriculture", "Natural Sciences", "Information Technology"],
            "opportunity_level": "high"
        },
        {
            "trend": "Fintech Boom — SBP Open Banking Policy",
            "description": "SBP's Open Banking policy and EMI licenses fuel Pakistan's fintech sector. JazzCash, Easypaisa, and Islamic fintech startups are hiring. Finance + tech hybrid skills are extremely scarce and command premium pay.",
            "relevant_fields": ["Finance", "Islamic Banking", "Computer Science", "Business Analytics"],
            "opportunity_level": "high"
        },
        {
            "trend": "Agri-Tech & Kisaan Card Digitization",
            "description": "Agriculture is 24% of GDP. Government's Kisaan Card and agricultural digitization creates demand for agri-tech professionals — a niche combining agricultural knowledge with technology. Very low competition, growing need.",
            "relevant_fields": ["Agricultural Science", "Agri-Tech", "Environmental Science", "Food Technology"],
            "opportunity_level": "medium"
        }
    ]