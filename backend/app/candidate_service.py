import json

from app.ai_service import client


def analyze_resume(resume_text: str):

    prompt = f"""
You are an AI recruitment assistant.

Analyze the following candidate resume.

Return ONLY valid JSON.

Required structure:

{{
    "name": "",
    "email": "",
    "phone": "",
    "skills": [],
    "work_experience": [],
    "projects": [],
    "education": [],
    "certifications": [],
    "total_experience_years": null
}}

Rules:
- Do not invent information.
- If information is missing, use empty string, empty array, or null.
- Extract only information supported by the resume.
- Keep skills concise.
- For experience, include company, role, duration and responsibilities when available.
- For projects, include project name, description and technologies when available.

RESUME:

{resume_text}
"""

    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=prompt
    )

    raw = response.text.strip()

    # Remove markdown JSON fences if Gemini adds them
    if raw.startswith("```"):
        raw = raw.replace("```json", "")
        raw = raw.replace("```", "")
        raw = raw.strip()

    return json.loads(raw)