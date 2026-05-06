INCOME_CONTEXT = {
    "under_20000": {
        "label": "Very limited resources",
        "implications": "Government schools only. Needs full scholarship for any university. Freelancing or government job most realistic. Cannot afford private university without complete financial aid.",
        "realistic_paths": ["government service", "freelancing", "teaching", "TEVTA trades", "IT with self-study"]
    },
    "20000_40000": {
        "label": "Lower-middle income",
        "implications": "Public university possible with financial strain. Merit scholarships essential. May need to work while studying. Private university only with full scholarship.",
        "realistic_paths": ["public university degrees", "TEVTA programs", "freelancing", "CSS/PMS civil service"]
    },
    "40000_80000": {
        "label": "Middle income",
        "implications": "Public university comfortable. Some private universities possible. Can relocate to major cities for studies.",
        "realistic_paths": ["engineering", "medicine at public uni", "CS", "business", "commerce"]
    },
    "80000_150000": {
        "label": "Upper-middle income",
        "implications": "Private universities accessible. LUMS/IBA/NUST all realistic. Can study in any major city.",
        "realistic_paths": ["any field", "entrepreneurship", "specialized degrees"]
    },
    "above_150000": {
        "label": "Comfortable",
        "implications": "Full range of options including private universities. Can consider studying abroad with effort.",
        "realistic_paths": ["any field including high-cost professional degrees"]
    }
}

PERSONALITY_CAREER_MAP = {
    "INTJ": ["software engineer", "data scientist", "researcher", "architect", "strategist"],
    "INTP": ["software developer", "mathematician", "analyst", "researcher", "professor"],
    "ENTJ": ["manager", "entrepreneur", "lawyer", "consultant", "executive"],
    "ENTP": ["entrepreneur", "marketing", "consultant", "product manager", "journalist"],
    "INFJ": ["psychologist", "social worker", "teacher", "writer", "NGO worker"],
    "INFP": ["writer", "graphic designer", "teacher", "counselor", "artist"],
    "ENFJ": ["teacher", "HR manager", "trainer", "community leader", "counselor"],
    "ENFP": ["journalist", "marketing", "teacher", "entrepreneur", "social worker"],
    "ISTJ": ["accountant", "auditor", "administrator", "engineer", "civil servant"],
    "ISFJ": ["nurse", "teacher", "social worker", "librarian", "administrator"],
    "ESTJ": ["manager", "military officer", "lawyer", "administrator", "accountant"],
    "ESFJ": ["nurse", "teacher", "HR", "social worker", "event manager"],
    "ISTP": ["mechanic", "engineer", "pilot", "surgeon", "IT technician"],
    "ISFP": ["graphic designer", "nurse", "chef", "photographer", "veterinarian"],
    "ESTP": ["entrepreneur", "salesperson", "paramedic", "police officer", "athlete"],
    "ESFP": ["performer", "nurse", "salesperson", "event planner", "teacher"]
}

ENNEAGRAM_CONTEXT = {
    "1": "The Reformer — principled, purposeful, self-controlled. Driven by wanting to do the right thing.",
    "2": "The Helper — generous, people-pleasing, possessive. Driven by wanting to be loved and needed.",
    "3": "The Achiever — adaptive, driven, image-conscious. Motivated by success and recognition.",
    "4": "The Individualist — expressive, dramatic, self-absorbed. Driven by the need for identity and significance.",
    "5": "The Investigator — perceptive, innovative, isolated. Driven by the need to understand and be competent.",
    "6": "The Loyalist — engaging, responsible, anxious. Driven by the need for security and support.",
    "7": "The Enthusiast — spontaneous, versatile, scattered. Driven by wanting to be happy and avoid pain.",
    "8": "The Challenger — self-confident, decisive, confrontational. Driven by the need to be strong and in control.",
    "9": "The Peacemaker — receptive, reassuring, complacent. Driven by the need for peace and harmony.",
}

# Pakistan government department focus areas — used to prime the AI with real context
PAKISTAN_GOV_CONTEXT = """
PAKISTAN GOVERNMENT & ECONOMIC CONTEXT (2025-2026):

KEY GOVERNMENT INITIATIVES:
- Digital Pakistan Vision: Ministry of IT & Telecom (MoITT) targeting $5B IT exports by 2026
- PSEB (Pakistan Software Export Board): Registering IT companies, providing export facilitation
- CPEC Phase 2: Focus on industrial zones, agriculture modernization, energy projects, SEZs in KPK, Punjab, Balochistan
- Ehsaas Programme: Social safety net — 15 million families, creates demand for social workers, economists, data analysts
- PM's Youth Programme: Skills development, laptops, interest-free loans for startups
- HEC Vision 2025: Prioritizing STEM, agriculture, and social sciences
- SBP (State Bank): Pushing digital banking, fintech regulation — demand for finance + tech hybrid roles
- TEVTA/NAVTTC: Skilled trades and vocational training expansion
- Ministry of National Health Services: Hospital expansion, Lady Health Workers programme
- Ministry of Commerce: E-commerce facilitation, Kamyab Jawan programme

ECONOMIC REALITY (2025-2026):
- PKR/USD rate: ~280 PKR per USD (remote/freelance work earns 3-4x more in effective purchasing power)
- Inflation: ~20-25% — nominal salaries must be compared against this
- Youth unemployment: ~30% among 15-29 age group
- IT sector growth: 25-30% YoY — one of few sectors growing faster than inflation
- Healthcare: Growing — 200+ new hospitals planned under PSDP
- Agriculture: 24% of GDP but modernizing — agri-tech roles emerging
- Construction/Civil: CPEC corridor still active, housing schemes expanding
- Legal: Slow salary growth but CSS/judiciary still prestigious
- Freelancing: Pakistan ranked 4th globally on Upwork — $500M+ annual remittances from freelancers

IMPORTANT: Be HONEST about economic outlook. Do not sugarcoat declining sectors.
"""

def get_income_bracket_key(income: int) -> str:
    if income < 20000:
        return "under_20000"
    elif income < 40000:
        return "20000_40000"
    elif income < 80000:
        return "40000_80000"
    elif income < 150000:
        return "80000_150000"
    else:
        return "above_150000"

def build_roadmap_prompt(profile: dict, tfidf_matches: list) -> str:
    income_key = get_income_bracket_key(profile["income_bracket"])
    income_ctx = INCOME_CONTEXT[income_key]
    personality_careers = PERSONALITY_CAREER_MAP.get(profile["personality_type"], [])
    tfidf_titles = [m["title"] for m in tfidf_matches[:3]]

    # Extract enneagram core type
    enneagram = profile.get("enneagram_type", "")
    enneagram_core = ""
    if enneagram:
        core_num = enneagram[0] if enneagram[0].isdigit() else ""
        enneagram_core = ENNEAGRAM_CONTEXT.get(core_num, "")

    return f"""
You are a Pakistan-specific career counselor AI. You have deep knowledge of:
- Pakistani university admissions (MDCAT, ECAT, NTS, SAT, GAT)
- HEC recognized programs and real market value
- Real 2025-2026 salary ranges in Pakistan (accounting for PKR/USD ~280 rate)
- Scholarships: HEC Need-Based, PEEF, Ehsaas, LUMS NOP, IBA Sehulat, NUST Financial Aid, Army/PAF
- City-specific opportunities
- Free learning: YouTube tutorials, Google Career Certificates, Coursera, Khan Academy
- Pakistan's freelancing economy (ranked 4th globally, $500M+ annual earnings)
- Government development priorities and CPEC impacts on career markets

{PAKISTAN_GOV_CONTEXT}

USER PROFILE:
Name: {profile['name']}, Age: {profile['age']}
City: {profile['city']}, Province: {profile['province']}
Monthly family income: PKR {profile['income_bracket']} ({income_ctx['label']})
Financial reality: {income_ctx['implications']}
Father education: {profile['father_education']}
Mother education: {profile['mother_education']}
Siblings: {profile['siblings']}
Personality: {profile['personality_type']} — naturally suited for {', '.join(personality_careers)}
Enneagram: {enneagram} — {enneagram_core}
Interests from conversation: {', '.join(profile.get('interests', []))}
Academic strength: {profile.get('academic_strength', 'general studies')}
Conversation summary: {profile.get('conversation_summary', '')}
ML-matched careers: {', '.join(tfidf_titles)}

Generate exactly 3 career paths:
- Path 1 SAFE: highest probability stable income given their background
- Path 2 GROWTH: requires effort but realistic with Pakistan's current job market
- Path 3 AMBITIOUS: possible with exceptional effort, aligned with their personality

CRITICAL RULES:
- Every university must be real and accept students from {profile['province']}
- Every scholarship must be real and this student must qualify
- Salary figures must reflect Pakistan 2025-2026 (account for inflation)
- If income under PKR 40000, never recommend LUMS without specifying NOP scholarship
- Be honest about competition ratios and declining sectors
- Include actions that cost zero rupees for THIS MONTH
- Mention volunteering opportunities in {profile['city']}

FOR EACH PATH — MANDATORY NEW SECTIONS:

1. PAKISTAN GOVERNMENT TREND ANALYSIS:
   - Analyze what the Pakistani government is CURRENTLY doing in this career sector
   - Mention specific programs, ministries, CPEC links, or HEC policies relevant to this field
   - State the hiring trend HONESTLY: is this sector growing because of government investment, or declining?
   - Mention the economic reality — how does PKR inflation affect pay in this field?
   - Which specific government body/ministry regulates or funds this sector?
   - How does CPEC Phase 2 (if relevant) affect this career?

2. YOUTUBE CHANNELS (university student level — specific to Pakistan):
   - Provide 3-4 YouTube channels popular among Pakistani university students studying this field
   - Include channels that teach in Urdu OR English (both types)
   - For each: channel name, URL, language (Urdu/English/Bilingual), what to watch first (exact playlist/video name), why Pakistani students specifically love this channel
   - Prioritize channels with 100k+ subscribers that are actively used in Pakistani universities
   - Include at least one Pakistani channel (if it exists) and one international channel

3. FIRST STEP EXPLORATION GUIDE:
   - Exactly 6 concrete actions the student can take TODAY or THIS WEEK to explore this career
   - open_right_now: A specific website URL to open right now and what to do on it
   - watch_first: A specific YouTube video or playlist title + channel name to watch TODAY
   - join_community: A specific online community (Facebook group / Discord / LinkedIn group) with how to find it
   - offline_action: A concrete real-world action in {profile['city']} (visit a place, talk to someone, attend something)
   - free_skill_to_practice: One specific free skill they can start building today with a tool name
   - how_to_verify_fit: How they can KNOW this career is right for them before committing (a specific test or experience)

Return ONLY this exact JSON. No markdown. No explanation outside the JSON.

{{
  "user_name": "{profile['name']}",
  "personality_summary": "{profile['personality_type']} + {enneagram}",
  "income_reality_check": "one honest sentence about what their income means for their options",
  "paths": [
    {{
      "id": "safe",
      "title": "career title",
      "tagline": "one motivating sentence",
      "personality_fit": "why this fits their MBTI and Enneagram personality",
      "realistic_monthly_income": {{
        "entry_level": "PKR X",
        "after_5_years": "PKR X"
      }},
      "education_route": {{
        "degree": "exact degree name",
        "duration": "X years",
        "best_universities": [
          {{"name": "university", "city": "city", "admission_test": "test", "fee_per_semester": "PKR X"}}
        ],
        "scholarships": [
          {{"name": "scholarship", "amount": "amount", "eligibility": "criteria", "apply_at": "url or process"}}
        ]
      }},
      "free_resources": [
        {{"title": "resource name", "type": "YouTube / Google Certificate / Coursera", "url": "actual URL", "why": "why this helps them start"}}
      ],
      "roadmap": {{
        "this_month": ["free action 1", "free action 2"],
        "next_6_months": ["milestone 1", "milestone 2"],
        "year_1_2": ["achievement"],
        "year_3_5": ["achievement"],
        "first_job": "realistic first job description"
      }},
      "volunteering_now": [
        {{"org": "org name", "type": "what they do", "city": "{profile['city']}", "how_to_join": "instructions"}}
      ],
      "dont_mess_up": "the single most critical thing they must not fail",
      "competition_reality": "honest sentence about competition level",
      "pakistan_gov_trend": {{
        "government_focus": "specific active programs and policies in this sector right now",
        "cpec_relevance": "how CPEC Phase 2 affects this career — or 'Not directly relevant' if it does not",
        "economic_outlook": "honest 2-sentence economic reality for this field in Pakistan 2025-2026",
        "hiring_trend": "growing OR stable OR declining",
        "key_ministry_body": "exact ministry or regulatory body governing this field",
        "salary_impact": "how PKR inflation and economy specifically affects pay in this field"
      }},
      "youtube_channels": [
        {{
          "channel_name": "exact channel name",
          "channel_url": "https://youtube.com/@channelname",
          "language": "Urdu OR English OR Bilingual",
          "what_to_watch_first": "exact playlist name or video title to start with",
          "why_popular": "why Pakistani university students specifically watch this",
          "level": "Beginner OR Intermediate OR Advanced"
        }}
      ],
      "first_step_exploration": {{
        "open_right_now": "specific URL and what to do: e.g. Go to coursera.org and search for X, then enroll in Y",
        "watch_first": "Exact video or playlist: '[Title]' by [Channel Name] on YouTube — what you will learn",
        "join_community": "Specific group: e.g. Facebook group 'CS Students Pakistan' with 50k+ members — search this name",
        "offline_action": "Specific action in {profile['city']}: e.g. Visit [specific place] and speak to [who] about [what]",
        "free_skill_to_practice": "Install [tool] / Open [website] and practice [specific skill] for 30 minutes today",
        "how_to_verify_fit": "Specific test: e.g. Spend one week doing [activity] — if you feel [X], this career is likely right for you"
      }}
    }}
  ],
  "immediate_action": "single most important thing to do tomorrow — be very specific with URL or location",
  "motivational_note": "2 honest sentences in simple English. Not fake positivity. Mention their name. Be real about Pakistan."
}}
"""