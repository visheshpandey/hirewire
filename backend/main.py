from pathlib import Path
import shutil
import uuid
import json
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.candidate_service import analyze_resume
from app.matching_service import match_candidate
from app.parser import extract_text
from app.ai_service import analyze_jd
from app.audit_service import create_audit_log, get_audit_logs
from app.database import SessionLocal, JobDescription, Candidate, MatchResult

from app.interview_service import generate_interview_questions
from app.interview_evaluation_service import evaluate_interview
from app.candidate_summary_service import generate_candidate_summary
from typing import Annotated
from app.adaptive_followup_service import generate_followup_question
from app.evaluation_report_service import generate_evaluation_report
from app.batch_resume_service import process_resume
from app.candidate_pool_service import get_candidate_pool
from app.query_service import query_candidates
app = FastAPI(
    title="HireFlow API",
    description="AI Candidate Screening & Interview Intelligence Agent",
    version="1.0.0"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://hireflow-frontend-sepia.vercel.app",
    ],
    allow_origin_regex=r"https://hireflow-frontend.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


@app.get("/")
def home():
    return {
        "message": "HireFlow Backend is Running!",
        "status": "success"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }


@app.post("/api/jd/upload")
async def upload_job_description(
    file: UploadFile = File(...)
):

    allowed_extensions = {
        ".pdf",
        ".docx",
        ".txt"
    }

    extension = Path(file.filename).suffix.lower()

    if extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail="Only PDF, DOCX and TXT files are supported."
        )

    file_id = str(uuid.uuid4())

    safe_filename = f"{file_id}{extension}"

    file_path = UPLOAD_DIR / safe_filename

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        text = extract_text(str(file_path))

    except Exception as e:
        file_path.unlink(missing_ok=True)

        raise HTTPException(
            status_code=500,
            detail=f"Could not extract text: {str(e)}"
        )

    return {
        "success": True,
        "message": "Job description uploaded successfully.",
        "filename": file.filename,
        "file_id": file_id,
        "text_length": len(text),
        "text": text
    }

@app.post("/api/jd/analyze")
async def analyze_job_description(data: dict):

    jd_text = data.get("text")

    if not jd_text:
        return {
            "success": False,
            "message": "JD text is required."
        }

    result = analyze_jd(jd_text)

    return {
        "success": True,
        "analysis": result
    }
@app.post("/api/resume/upload")
async def upload_resume(
    file: UploadFile = File(...)
):

    allowed_extensions = {
        ".pdf",
        ".docx",
        ".txt"
    }

    extension = Path(file.filename).suffix.lower()

    if extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail="Only PDF, DOCX and TXT files are supported."
        )

    file_id = str(uuid.uuid4())

    safe_filename = f"{file_id}{extension}"
    file_path = UPLOAD_DIR / safe_filename

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        text = extract_text(str(file_path))

    except Exception as e:
        file_path.unlink(missing_ok=True)

        raise HTTPException(
            status_code=500,
            detail=f"Could not extract resume text: {str(e)}"
        )

    return {
        "success": True,
        "message": "Resume uploaded successfully.",
        "filename": file.filename,
        "file_id": file_id,
        "text_length": len(text),
        "text": text
    }

@app.post("/api/resume/analyze")
async def analyze_resume_endpoint(data: dict):

    resume_text = data.get("text")

    if not resume_text:
        return {
            "success": False,
            "message": "Resume text is required."
        }

    try:
        result = analyze_resume(resume_text)

        return {
            "success": True,
            "candidate": result
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Resume analysis failed: {str(e)}"
        )
@app.post("/api/match")
async def match_candidate_endpoint(data: dict):

    jd = data.get("jd")
    candidate = data.get("candidate")

    if not jd:
        return {
            "success": False,
            "message": "JD data is required."
        }

    if not candidate:
        return {
            "success": False,
            "message": "Candidate data is required."
        }

    try:
        result = match_candidate(jd, candidate)

        return {
            "success": True,
            "match": result
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Matching failed: {str(e)}"
        )

@app.post("/api/interview/questions")
async def interview_questions_endpoint(data: dict):

    jd = data.get("jd")
    candidate = data.get("candidate")

    if not jd:
        return {
            "success": False,
            "message": "JD data is required."
        }

    if not candidate:
        return {
            "success": False,
            "message": "Candidate data is required."
        }

    try:
        result = generate_interview_questions(jd, candidate)

        return {
            "success": True,
            "interview": result
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Interview generation failed: {str(e)}"
        )
@app.post("/api/interview/evaluate")
async def evaluate_interview_endpoint(data: dict):

    jd = data.get("jd")
    candidate = data.get("candidate")
    interview_notes = data.get("interview_notes")

    if not jd:
        return {
            "success": False,
            "message": "JD data is required."
        }

    if not candidate:
        return {
            "success": False,
            "message": "Candidate data is required."
        }

    if not interview_notes:
        return {
            "success": False,
            "message": "Interview notes are required."
        }

    try:
        result = evaluate_interview(
            jd,
            candidate,
            interview_notes
        )

        return {
            "success": True,
            "evaluation": result
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Interview evaluation failed: {str(e)}"
        )

@app.post("/api/candidate/summary")
async def candidate_summary_endpoint(data: dict):

    candidate = data.get("candidate")
    match = data.get("match")

    if not candidate:
        return {
            "success": False,
            "message": "Candidate data is required."
        }

    if not match:
        return {
            "success": False,
            "message": "Match data is required."
        }

    try:
        result = generate_candidate_summary(
            candidate,
            match
        )

        return {
            "success": True,
            "summary": result
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Candidate summary failed: {str(e)}"
        )

@app.post("/api/interview/follow-up")
async def follow_up_endpoint(data: dict):

    jd = data.get("jd")
    candidate = data.get("candidate")
    question = data.get("question")
    answer = data.get("answer")

    if not jd:
        return {
            "success": False,
            "message": "JD data is required."
        }

    if not candidate:
        return {
            "success": False,
            "message": "Candidate data is required."
        }

    if not question:
        return {
            "success": False,
            "message": "Interview question is required."
        }

    if not answer:
        return {
            "success": False,
            "message": "Candidate answer is required."
        }

    try:

        result = generate_followup_question(
            jd,
            candidate,
            question,
            answer
        )

        return {
            "success": True,
            "follow_up": result
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Follow-up generation failed: {str(e)}"
        )

@app.post("/api/interview/report")
async def interview_report_endpoint(data: dict):

    jd = data.get("jd")
    candidate = data.get("candidate")
    evaluation = data.get("evaluation")

    if not jd:
        return {
            "success": False,
            "message": "JD data is required."
        }

    if not candidate:
        return {
            "success": False,
            "message": "Candidate data is required."
        }

    if not evaluation:
        return {
            "success": False,
            "message": "Interview evaluation is required."
        }

    try:

        result = generate_evaluation_report(
            jd,
            candidate,
            evaluation
        )

        return {
            "success": True,
            "report": result
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Evaluation report generation failed: {str(e)}"
        )
@app.get("/api/database/test")
async def database_test():

    db = SessionLocal()

    try:
        job_count = db.query(JobDescription).count()
        candidate_count = db.query(Candidate).count()
        match_count = db.query(MatchResult).count()

        return {
            "success": True,
            "database": "connected",
            "job_descriptions": job_count,
            "candidates": candidate_count,
            "matches": match_count
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Database error: {str(e)}"
        )

    finally:
        db.close()

@app.post("/api/jd/save")
async def save_job_description(data: dict):

    jd_text = data.get("text")
    analysis = data.get("analysis")

    if not jd_text:
        return {
            "success": False,
            "message": "JD text is required."
        }

    db = SessionLocal()

    try:
        job_title = ""

        if isinstance(analysis, dict):
            job_title = analysis.get("job_title", "")

        elif isinstance(analysis, str):
            job_title = "Job Position"

        job = JobDescription(
            title=job_title,
            raw_text=jd_text,
            analysis=str(analysis) if analysis else None
        )

        db.add(job)
        db.commit()
        db.refresh(job)

        create_audit_log(
            db=db,
            action="JD_SAVED",
            entity_type="job",
            entity_id=job.id,
            source="jd_save",
            details={
                "title": job_title,
                "has_analysis": bool(analysis)
            }
        )

        return {
            "success": True,
            "message": "Job description saved successfully.",
            "job_id": job.id,
            "title": job.title
        }

    except Exception as e:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Could not save job description: {str(e)}"
        )

    finally:
        db.close()

@app.post("/api/match/save")
async def save_match_result(data: dict):

    candidate_id = data.get("candidate_id")
    job_id = data.get("job_id")
    match = data.get("match")

    if not candidate_id:
        return {
            "success": False,
            "message": "Candidate ID is required."
        }

    if not job_id:
        return {
            "success": False,
            "message": "Job ID is required."
        }

    if not match:
        return {
            "success": False,
            "message": "Match data is required."
        }

    db = SessionLocal()

    try:
        score = match.get("overall_score")
        tier = match.get("tier")

        saved_match = MatchResult(
            candidate_id=candidate_id,
            job_id=job_id,
            score=score,
            tier=tier,
            result=str(match)
        )

        db.add(saved_match)
        db.commit()
        db.refresh(saved_match)
        create_audit_log(
            db=db,
            action="MATCH_SAVED",
            entity_type="match",
            entity_id=saved_match.id,
            source="matching_service",
            details={
                "candidate_id": candidate_id,
                "job_id": job_id,
                "score": score,
                "tier": tier
            }
        )

        return {
            "success": True,
            "message": "Match result saved successfully.",
            "match_id": saved_match.id
        }

    except Exception as e:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Could not save match result: {str(e)}"
        )

    finally:
        db.close()

@app.post("/api/resume/batch-upload")
async def batch_resume_upload(
    file1: UploadFile = File(...),
    file2: UploadFile = File(None),
    file3: UploadFile = File(None)
):

    files = [file1]

    if file2:
        files.append(file2)

    if file3:
        files.append(file3)

    results = []
    failed = []

    for file in files:

        try:
            result = process_resume(file)

            candidate_data = result["candidate"]

            db = SessionLocal()

            try:
                saved_candidate = Candidate(
                    name=candidate_data.get("name", ""),
                    email=candidate_data.get("email", ""),
                    resume_text=result["resume_text"],
                    profile=str(candidate_data)
                )

                db.add(saved_candidate)
                db.commit()
                db.refresh(saved_candidate)

                create_audit_log(
                    db=db,
                    action="CANDIDATE_UPLOADED",
                    entity_type="candidate",
                    entity_id=saved_candidate.id,
                    source="batch_resume_upload",
                    details={
                        "filename": file.filename,
                        "name": candidate_data.get("name", ""),
                        "email": candidate_data.get("email", "")
                    }
                )

                results.append({
                    "candidate_id": saved_candidate.id,
                    "file_id": result["file_id"],
                    "filename": result["filename"],
                    "candidate": candidate_data
                })

            finally:
                db.close()

        except Exception as e:

            failed.append({
                "filename": file.filename,
                "error": str(e)
            })

    return {
        "success": True,
        "message": "Batch resume processing completed.",
        "total_files": len(files),
        "successful": len(results),
        "failed": len(failed),
        "candidates": results,
        "errors": failed
    }

@app.get("/api/candidates")
async def candidate_pool_endpoint(
    job_id: int = None,
    tier: str = None,
    min_score: int = None
):

    db = SessionLocal()

    try:

        candidates = get_candidate_pool(
            db=db,
            job_id=job_id,
            tier=tier,
            min_score=min_score
        )

        return {
            "success": True,
            "total_candidates": len(candidates),
            "candidates": candidates
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Could not load candidate pool: {str(e)}"
        )

    finally:
        db.close()

@app.post("/api/candidates/query")
async def candidate_query_endpoint(data: dict):
    query = data.get("query")
    job_id = data.get("job_id")
    tier = data.get("tier")
    min_score = data.get("min_score")

    if not query:
        raise HTTPException(
            status_code=400,
            detail="Query is required."
        )

    db = SessionLocal()

    try:
        # First get candidates from our database
        candidates = get_candidate_pool(
            db=db,
            job_id=job_id,
            tier=tier,
            min_score=min_score
        )

        # Then ask AI to answer using ONLY those candidates
        result = query_candidates(
            user_query=query,
            candidates=candidates
        )

        create_audit_log(
            db=db,
            action="CANDIDATE_QUERY",
            entity_type="candidate_pool",
            entity_id=job_id,
            source="query_service",
            details={
                "query": query,
                "candidate_pool_size": len(candidates),
                "matches_found": len(result.get("matches", []))
            }
        )

        return {
            "success": True,
            "query": query,
            "candidate_pool_size": len(candidates),
            "result": result
        }



    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Candidate query failed: {str(e)}"
        )

    finally:
        db.close()

@app.get("/api/audit")
async def get_audit_endpoint(
    entity_type: str = None,
    entity_id: int = None,
    action: str = None
):
    db = SessionLocal()

    try:
        logs = get_audit_logs(
            db=db,
            entity_type=entity_type,
            entity_id=entity_id,
            action=action
        )

        return {
            "success": True,
            "total_logs": len(logs),
            "logs": [
                {
                    "id": log.id,
                    "action": log.action,
                    "entity_type": log.entity_type,
                    "entity_id": log.entity_id,
                    "source": log.source,
                    "details": log.details,
                    "created_at": log.created_at
                }
                for log in logs
            ]
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Could not load audit logs: {str(e)}"
        )

    finally:
        db.close()

@app.post("/api/audit/test")
async def create_audit_test(data: dict):
    db = SessionLocal()

    try:
        log = create_audit_log(
            db=db,
            action=data.get("action", "TEST_ACTION"),
            entity_type=data.get("entity_type", "test"),
            entity_id=data.get("entity_id"),
            source=data.get("source", "manual_test"),
            details=data.get("details", {})
        )

        return {
            "success": True,
            "message": "Audit log created successfully.",
            "audit_id": log.id
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Could not create audit log: {str(e)}"
        )

    finally:
        db.close()

@app.get("/api/dashboard")
async def dashboard_endpoint():
    db = SessionLocal()

    try:
        # Total job descriptions
        job_count = db.query(JobDescription).count()

        # Get job descriptions
        jobs = db.query(JobDescription).order_by(
            JobDescription.id.desc()
        ).all()

        # Get candidate pool
        candidates = get_candidate_pool(
            db=db,
            job_id=None,
            tier=None,
            min_score=None
        )

        # Get latest audit logs
        logs = get_audit_logs(db=db)

        return {
            "success": True,

            "stats": {
                "active_roles": job_count,
                "candidates_screened": len(candidates),
                "interview_sessions": 0
            },

            "roles": [
                {
                    "id": job.id,
                    "title": job.title or "Untitled Role"
                }
                for job in jobs
            ],

            "candidates": candidates,

            "audit_logs": [
                {
                    "id": log.id,
                    "action": log.action,
                    "entity_type": log.entity_type,
                    "entity_id": log.entity_id,
                    "source": log.source,
                    "details": log.details,
                    "created_at": log.created_at
                }
                for log in logs[:6]
            ]
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Dashboard data failed: {str(e)}"
        )

    finally:
        db.close()

@app.get("/api/roles")
async def get_roles():
    db = SessionLocal()

    try:
        jobs = db.query(JobDescription).order_by(
            JobDescription.id.desc()
        ).all()

        roles = []

        for job in jobs:

            roles.append({
                "id": str(job.id),
                "title": job.title or "Untitled Role",
                "department": "Engineering",
                "location": "Remote",
                "rawJd": job.raw_text or "",
                "status": "ACTIVE",
                "createdAt": "",
                "requirements": []
            })

        return {
            "success": True,
            "roles": roles
        }

    except Exception as e:

        print("ROLES API ERROR:", repr(e))

        raise HTTPException(
            status_code=500,
            detail=f"Could not load roles: {str(e)}"
        )

    finally:
        db.close()


@app.post("/api/roles/create")
async def create_role(data: dict):
    title = data.get("title")
    department = data.get("department") or "Engineering"
    location = data.get("location") or "Remote"
    raw_jd = data.get("rawJd")

    if not title:
        raise HTTPException(
            status_code=400,
            detail="Role title is required."
        )

    if not raw_jd:
        raise HTTPException(
            status_code=400,
            detail="Job description is required."
        )

    db = SessionLocal()

    try:
        # -----------------------------------------
        # 1. Analyze JD using Gemini
        # -----------------------------------------

        extracted = analyze_jd(raw_jd)

        # -----------------------------------------
        # 2. Store metadata + AI analysis
        # -----------------------------------------

        stored_analysis = {
            "title": title,
            "department": department,
            "location": location,
            "extracted": extracted
        }

        job = JobDescription(
            title=title,
            raw_text=raw_jd,
            analysis=json.dumps(
                stored_analysis,
                ensure_ascii=False
            )
        )

        db.add(job)
        db.commit()
        db.refresh(job)

        # -----------------------------------------
        # 3. Audit log
        # -----------------------------------------

        create_audit_log(
            db=db,
            action="ROLE_CREATED",
            entity_type="job",
            entity_id=job.id,
            source="role_creation",
            details={
                "title": title,
                "department": department,
                "location": location
            }
        )

        return {
            "success": True,
            "message": "Role created and JD analyzed successfully.",
            "role": {
                "id": str(job.id),
                "title": title,
                "department": department,
                "location": location,
                "rawJd": raw_jd,
                "status": "ACTIVE",
                "createdAt": (
                    job.created_at.isoformat()
                    if hasattr(job, "created_at") and job.created_at
                    else ""
                ),
                "analysis": extracted
            }
        }

    except Exception as e:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Role creation failed: {str(e)}"
        )

    finally:
        db.close()

@app.get("/api/roles/{role_id}/requirements")
async def get_role_requirements(role_id: int):
    db = SessionLocal()

    try:
        job = db.query(JobDescription).filter(
            JobDescription.id == role_id
        ).first()

        if not job:
            raise HTTPException(
                status_code=404,
                detail="Role not found."
            )

        # -----------------------------------------
        # Load stored analysis
        # -----------------------------------------

        analysis = {}

        if job.analysis:
            try:
                analysis = json.loads(job.analysis)
            except Exception:
                analysis = {}

        # -----------------------------------------
        # Extract AI analysis
        # -----------------------------------------

        extracted = analysis.get("extracted", {})

        # IMPORTANT:
        # Gemini analysis may have been stored as a JSON string.
        # Convert it back into a dictionary.
        if isinstance(extracted, str):

            try:
                extracted = json.loads(extracted)

            except Exception:
                extracted = {}

        # Safety check
        if not isinstance(extracted, dict):
            extracted = {}

        requirements = []

        # -----------------------------------------
        # Helper
        # -----------------------------------------

        def add_requirements(items, priority, req_type):

            if not items:
                return

            if isinstance(items, str):
                items = [items]

            if isinstance(items, dict):
                items = [items]

            if not isinstance(items, list):
                return

            for item in items:

                if isinstance(item, dict):

                    description = (
                        item.get("description")
                        or item.get("requirement")
                        or item.get("skill")
                        or item.get("name")
                        or ""
                    )

                    source = (
                        item.get("source")
                        or item.get("evidence")
                        or item.get("source_snippet")
                        or description
                    )

                    item_type = item.get(
                        "type",
                        req_type
                    )

                else:

                    description = str(item)
                    source = description
                    item_type = req_type

                if description.strip():

                    requirements.append({
                        "id": f"req-{job.id}-{len(requirements) + 1}",
                        "roleId": str(job.id),
                        "description": description,
                        "type": item_type,
                        "priority": priority,
                        "sourceSnippet": source,
                        "approved": False
                    })

        # -----------------------------------------
        # Required skills
        # -----------------------------------------

        add_requirements(
            extracted.get("must_have"),
            "REQUIRED",
            "technical"
        )

        add_requirements(
            extracted.get("must_have_skills"),
            "REQUIRED",
            "technical"
        )

        add_requirements(
            extracted.get("required_skills"),
            "REQUIRED",
            "technical"
        )

        # -----------------------------------------
        # Preferred skills
        # -----------------------------------------

        add_requirements(
            extracted.get("nice_to_have"),
            "PREFERRED",
            "technical"
        )

        add_requirements(
            extracted.get("nice_to_have_skills"),
            "PREFERRED",
            "technical"
        )

        add_requirements(
            extracted.get("preferred_skills"),
            "PREFERRED",
            "technical"
        )

        # -----------------------------------------
        # Generic requirements
        # -----------------------------------------

        add_requirements(
            extracted.get("requirements"),
            "REQUIRED",
            "technical"
        )

        # -----------------------------------------
        # Responsibilities
        # -----------------------------------------

        add_requirements(
            extracted.get("responsibilities"),
            "REQUIRED",
            "domain"
        )

        # -----------------------------------------
        # Experience
        # -----------------------------------------

        experience = (
            extracted.get("years_of_experience")
            or extracted.get("experience_years")
            or extracted.get("minimum_experience")
        )

        if experience:

            requirements.append({
                "id": f"req-{job.id}-{len(requirements) + 1}",
                "roleId": str(job.id),
                "description": f"Minimum experience: {experience}",
                "type": "experience",
                "priority": "REQUIRED",
                "sourceSnippet": str(experience),
                "approved": False
            })

        # -----------------------------------------
        # Education
        # -----------------------------------------

        education = extracted.get("education")

        if education:

            add_requirements(
                education,
                "REQUIRED",
                "education"
            )

        # -----------------------------------------
        # Certifications
        # -----------------------------------------

        certifications = extracted.get("certifications")

        if certifications:

            add_requirements(
                certifications,
                "PREFERRED",
                "domain"
            )

        # -----------------------------------------
        # Response
        # -----------------------------------------

        return {
            "success": True,
            "role_id": str(job.id),
            "total_requirements": len(requirements),
            "requirements": requirements
        }

    except HTTPException:
        raise

    except Exception as e:

        print(
            "REQUIREMENTS API ERROR:",
            repr(e)
        )

        raise HTTPException(
            status_code=500,
            detail=f"Could not load requirements: {str(e)}"
        )

    finally:
        db.close()