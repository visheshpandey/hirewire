from pathlib import Path
import shutil
import uuid

from app.parser import extract_text
from app.candidate_service import analyze_resume


UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


def process_resume(file):

    extension = Path(file.filename).suffix.lower()

    allowed_extensions = {
        ".pdf",
        ".docx",
        ".txt"
    }

    if extension not in allowed_extensions:
        raise ValueError(
            f"Unsupported file type: {file.filename}"
        )

    file_id = str(uuid.uuid4())
    safe_filename = f"{file_id}{extension}"
    file_path = UPLOAD_DIR / safe_filename

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        text = extract_text(str(file_path))

        if not text.strip():
            raise ValueError(
                f"No text found in {file.filename}"
            )

        candidate = analyze_resume(text)

        return {
            "file_id": file_id,
            "filename": file.filename,
            "resume_text": text,
            "candidate": candidate
        }

    except Exception:
        file_path.unlink(missing_ok=True)
        raise