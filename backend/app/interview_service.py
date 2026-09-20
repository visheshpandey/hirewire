import json
from app.ai_service import client


def generate_interview_questions(jd_data, candidate_data):

    prompt = f"""
You are an AI recruitment interview assistant.

Generate interview questions for a candidate based on the Job Description
and the candidate's profile.

JOB DESCRIPTION:

{json.dumps(jd_data, indent=2)}

CANDIDATE PROFILE:

{json.dumps(candidate_data, indent=2)}

Return ONLY valid JSON.

Use exactly this structure:

{{
    "questions": [
        {{
            "question": "",
            "type": "technical",
            "difficulty": "easy",
            "reason": ""
        }}
    ]
}}

Rules:

1. Generate exactly 10 questions.
2. Questions must be relevant to the job role.
3. Use the candidate's actual skills and projects.
4. Include technical and experience-based questions.
5. Include questions about important skill gaps.
6. Difficulty should progress:
   easy → medium → hard.
7. Do not invent candidate experience.
8. Keep questions concise.
9. The interview should help the recruiter validate the candidate.
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