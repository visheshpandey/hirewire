import os

from dotenv import load_dotenv
from google import genai


load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")

if not API_KEY:
    raise ValueError("GEMINI_API_KEY is not set in .env file")


client = genai.Client(api_key=API_KEY)


def analyze_jd(jd_text: str):

    prompt = f"""
You are an AI recruitment analysis assistant.

Analyze the following Job Description.

Return ONLY valid JSON.

Required JSON structure:

{{
    "job_title": "",
    "must_have": [],
    "nice_to_have": [],
    "experience_years": null,
    "education": [],
    "certifications": [],
    "responsibilities": [],
    "weighted_priorities": []
}}

Rules:
- Do not invent information.
- If something is not mentioned, use an empty array or null.
- Keep skills concise.
- Extract only information supported by the job description.

JOB DESCRIPTION:

{jd_text}
"""

    response = client.models.generate_content(
       model="gemini-3.6-flash",
        contents=prompt
    )

    return response.text