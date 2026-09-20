import json
from app.ai_service import client


def generate_evaluation_report(
    jd_data,
    candidate_data,
    interview_evaluation
):

    prompt = f"""
You are an AI recruitment evaluation report assistant.

Create a standardized interview evaluation report.

JOB DESCRIPTION:

{json.dumps(jd_data, indent=2)}

CANDIDATE PROFILE:

{json.dumps(candidate_data, indent=2)}

INTERVIEW EVALUATION:

{json.dumps(interview_evaluation, indent=2)}

Return ONLY valid JSON.

Use exactly this structure:

{{
    "candidate_name": "",
    "overall_summary": "",
    "requirement_evidence": [
        {{
            "requirement": "",
            "evidence": "",
            "status": ""
        }}
    ],
    "strengths": [],
    "concerns": [],
    "unanswered_areas": [],
    "follow_up_points": [],
    "interviewer_recommendation": ""
}}

Rules:

1. Use only the provided information.
2. Do not invent interview evidence.
3. Map important JD requirements to the available interview evidence.
4. Explicitly list requirements that were not covered.
5. Keep strengths and concerns evidence-based.
6. interviewer_recommendation must remain empty.
7. The interviewer must make the final recommendation.
8. Do not generate a hire/no-hire decision.
9. Keep the report concise and professional.
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