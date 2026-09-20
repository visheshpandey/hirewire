import json
from app.ai_service import client


def generate_followup_question(
    jd_data,
    candidate_data,
    question,
    answer
):

    prompt = f"""
You are an AI interview assistant.

Analyze the candidate's answer to an interview question.

JOB DESCRIPTION:
{json.dumps(jd_data, indent=2)}

CANDIDATE PROFILE:
{json.dumps(candidate_data, indent=2)}

INTERVIEW QUESTION:
{question}

CANDIDATE ANSWER:
{answer}

Determine whether the answer sufficiently addresses the question.

Return ONLY valid JSON.

Use exactly this structure:

{{
    "answer_quality": "sufficient",
    "reason": "",
    "follow_up_needed": false,
    "follow_up_question": ""
}}

Allowed answer_quality values:

- sufficient
- partially_sufficient
- insufficient
- unclear

Rules:

1. Evaluate only the provided answer.
2. Do not invent candidate experience.
3. If the answer is vague, shallow, contradictory, or does not provide enough evidence,
   set follow_up_needed to true.
4. If the answer is sufficient, set follow_up_needed to false.
5. If follow-up is needed, generate ONE specific question.
6. The follow-up should help validate the candidate's actual knowledge or experience.
7. Keep the response concise.
8. This is decision support, not an automatic hiring decision.
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