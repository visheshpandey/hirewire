import json

from app.ai_service import client


def match_candidate(jd_data, candidate_data):

    prompt = f"""
You are an AI recruitment matching engine.

Compare a candidate against a job description.

Return ONLY valid JSON.

JOB REQUIREMENTS:

{json.dumps(jd_data, indent=2)}

CANDIDATE PROFILE:

{json.dumps(candidate_data, indent=2)}

Return exactly this structure:

{{
    "overall_score": 0,
    "tier": "",
    "requirements": [
        {{
            "requirement": "",
            "status": "met",
            "evidence": "",
            "reason": ""
        }}
    ],
    "strengths": [],
    "gaps": [],
    "validation_flags": [],
    "summary": ""
}}

Allowed status values:

- met
- partially_met
- not_evident
- unclear

Tier must be one of:

- Strong Match
- Partial Match
- Not Aligned

Rules:

1. Compare every important JD requirement.
2. Do not invent candidate experience.
3. Evidence must come from the candidate profile.
4. If a skill is mentioned in the JD but not supported by the resume, mark it as not_evident.
5. Give more importance to must-have requirements.
6. The score is a screening aid, NOT a hiring decision.
7. Be factual and concise.
"""

    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=prompt
    )

    raw = response.text.strip()

    if raw.startswith("```"):
        raw = raw.replace("```json", "")
        raw = raw.replace("```", "")
        raw = raw.strip()

    return json.loads(raw)