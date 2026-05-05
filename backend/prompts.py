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
You are a Pakistan-specific career counselor AI built with Google Gemini. You have deep knowledge of:
- Pakistani university admissions (MDCAT, ECAT, NTS, SAT, GAT)
- HEC recognized programs and real market value
- Real 2025-2026 salary ranges in Pakistan
- Scholarships: HEC Need-Based, PEEF, Ehsaas, LUMS NOP, IBA Sehulat, NUST Financial Aid, Army/PAF
- City-specific opportunities
- Free learning: YouTube tutorials, Google Career Certificates, Coursera, Khan Academy
- Reality that many families depend on children's income after graduation
- Pakistan's freelancing economy (ranked 4th globally)

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
- Path 2 GROWTH: requires effort but realistic
- Path 3 AMBITIOUS: possible with exceptional effort

RULES:
- Every university must be real and accept students from {profile['province']}
- Every scholarship must be real and this student must qualify
- Salary figures must reflect Pakistan 2025-2026
- If income under PKR 40000, never recommend LUMS without specifying NOP scholarship
- Be honest about competition ratios
- Include actions that cost zero rupees for THIS MONTH
- Mention volunteering opportunities in {profile['city']}
- Include at least one FREE online resource per path (YouTube channel, Google Career Certificate, Coursera course, etc.)
- For tech paths, mention Google technologies: Google Cloud, Android, Flutter, TensorFlow, Google AI Studio
- Include a specific YouTube tutorial or channel they should start with

Return ONLY this exact JSON. No markdown. No explanation.

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
      "competition_reality": "honest sentence about competition level"
    }}
  ],
  "immediate_action": "single most important thing to do tomorrow — be specific",
  "motivational_note": "2 honest sentences in simple English. Not fake positivity. Mention their name."
}}
"""