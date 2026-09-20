import json
from app.ai_service import client


def evaluate_interview(jd_data, candidate_data, interview_notes):

    prompt = f"""
You are an AI recruitment interview evaluation assistant.

Evaluate the candidate's interview based on the Job Description,
Candidate Profile, and Interview Notes.

JOB DESCRIPTION:

{json.dumps(jd_data, indent=2)}

CANDIDATE PROFILE:

{json.dumps(candidate_data, indent=2)}

INTERVIEW NOTES:

{interview_notes}

Return ONLY valid JSON.

Use exactly this structure:

{{
    "overall_assessment": "",
    "strengths": [],
    "concerns": [],
    "requirement_evidence": [
        {{
            "requirement": "",
            "evidence": "",
            "status": "supported"
        }}
    ],
    "follow_up_points": [],
    "report_summary": ""
}}

Allowed status values:

- supported
- partially_supported
- not_supported
- unclear

Rules:

1. Base the evaluation only on the provided information.
2. Do not invent candidate experience or interview answers.
3. Map interview evidence to important JD requirements.
4. Clearly separate evidence from concerns.
5. If the notes do not provide enough evidence, mark it as unclear.
6. Keep the assessment factual and concise.
7. This is decision support, not an automatic hiring decision.
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