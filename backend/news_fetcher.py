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
    "freelance", "AI", "digital", "cloud", "google", "remote", "skill"
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
        return []

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or api_key.startswith("REPLACE") or api_key == "your_gemini_api_key_here":
        print("⚠️ GEMINI_API_KEY not set, skipping AI analysis for trends.")
        return _fallback_trends(articles)

    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")

        articles_text = "\n\n".join([
            f"Source: {a['source']}\nTitle: {a['title']}\nSummary: {a['summary']}"
            for a in articles[:10]  # Limit to 10 to save tokens
        ])

        prompt = f"""
Analyze these Pakistani news articles. Extract career and education trends relevant to Pakistani youth (ages 13-20).

Articles:
{articles_text}

Return ONLY a JSON array. No explanation. No markdown.
[
    {{
        "trend": "trend name",
        "description": "what this means for Pakistani youth careers",
        "relevant_fields": ["field1", "field2"],
        "opportunity_level": "high or medium or low"
    }}
]
"""
        response = model.generate_content(prompt)
        text = response.text.strip().replace("```json", "").replace("```", "").strip()
        start = text.find("[")
        if start == -1:
            return _fallback_trends(articles)
        text = text[start:]
        end = text.rfind("]") + 1
        return json.loads(text[:end])
    except Exception as e:
        print(f"News trend extraction failed: {e}")
        return _fallback_trends(articles)

def _fallback_trends(articles):
    """Return basic trends when AI is unavailable"""
    return [
        {
            "trend": "AI and Machine Learning Growth",
            "description": "Pakistan's tech sector is rapidly adopting AI. Google Cloud and AI certifications are in high demand.",
            "relevant_fields": ["Computer Science", "Data Science", "AI Engineering"],
            "opportunity_level": "high"
        },
        {
            "trend": "Freelancing Economy Boom",
            "description": "Pakistan ranks among top freelancing countries. Digital skills like web dev, design, and writing are highly valued.",
            "relevant_fields": ["Software Development", "Graphic Design", "Content Writing"],
            "opportunity_level": "high"
        },
        {
            "trend": "Healthcare Expansion",
            "description": "Growing healthcare infrastructure means more opportunities for medical professionals across Pakistan.",
            "relevant_fields": ["Medicine", "Nursing", "Pharmacy"],
            "opportunity_level": "medium"
        }
    ]