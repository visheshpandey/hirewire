import json
from app.ai_service import client


def query_candidates(user_query: str, candidates: list):
    """
    Search the stored candidate pool using natural language.
    Gemini is only allowed to use the candidate data supplied to it.
    """

    if not candidates:
        return {
            "answer": "No candidates are available in the candidate pool.",
            "matches": [],
            "cannot_answer": False
        }

    prompt = f"""
You are HireFlow's Candidate Query Assistant.

The recruiter has asked this question:

USER QUERY:
{user_query}

Below is the ONLY candidate data you are allowed to use:

CANDIDATE DATA:
{json.dumps(candidates, indent=2)}

Your job is to answer the recruiter's query using ONLY the supplied candidate data.

IMPORTANT RULES:

1. Never invent candidate information.
2. Never assume a skill that is not present in the supplied data.
3. Every matched candidate must have evidence.
4. Evidence must come directly from the supplied candidate data.
5. If the question cannot be answered from the available data,
   set "cannot_answer" to true.
6. Do not make hiring decisions.
7. Do not say someone should be hired or rejected.
8. Do not evaluate personality, culture fit, motivation, or intelligence
   unless the supplied data explicitly contains such information.
9. If the recruiter asks for a subjective judgment that cannot be
   determined from the data, explain that it cannot be answered.
10. Candidate IDs must come from the supplied data.

Return ONLY valid JSON.

Required format:

{{
    "answer": "",
    "cannot_answer": false,
    "matches": [
        {{
            "candidate_id": 0,
            "name": "",
            "evidence": [],
            "reason": ""
        }}
    ]
}}

If no candidate matches:

{{
    "answer": "No matching candidates found.",
    "cannot_answer": false,
    "matches": []
}}
"""

    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=prompt
    )

    raw = response.text.strip()

    # Remove markdown code fences if Gemini adds them
    if raw.startswith("```"):
        raw = raw.replace("```json", "")
        raw = raw.replace("```", "")
        raw = raw.strip()

    return json.loads(raw)