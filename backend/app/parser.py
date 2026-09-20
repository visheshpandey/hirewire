from pathlib import Path

from pypdf import PdfReader
from docx import Document


def extract_text(file_path: str) -> str:
    """
    Extract text from PDF, DOCX or TXT files.
    """

    path = Path(file_path)
    extension = path.suffix.lower()

    if extension == ".pdf":
        reader = PdfReader(file_path)

        text = []

        for page in reader.pages:
            page_text = page.extract_text()

            if page_text:
                text.append(page_text)

        return "\n".join(text).strip()

    elif extension == ".docx":
        document = Document(file_path)

        paragraphs = []

        for paragraph in document.paragraphs:
            if paragraph.text.strip():
                paragraphs.append(paragraph.text)

        return "\n".join(paragraphs).strip()

    elif extension == ".txt":
        return path.read_text(
            encoding="utf-8",
            errors="ignore"
        ).strip()

    else:
        raise ValueError(
            "Unsupported file type. Please upload PDF, DOCX or TXT."
        )