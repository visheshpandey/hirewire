import ast

from app.database import Candidate, MatchResult


def get_candidate_pool(db, job_id=None, tier=None, min_score=None):

    query = db.query(Candidate, MatchResult).join(
        MatchResult,
        Candidate.id == MatchResult.candidate_id
    )

    if job_id:
        query = query.filter(MatchResult.job_id == job_id)

    if tier:
        query = query.filter(MatchResult.tier == tier)

    if min_score is not None:
        query = query.filter(MatchResult.score >= min_score)

    rows = query.order_by(
        MatchResult.score.desc()
    ).all()

    candidates = []

    for candidate, match in rows:

        try:
            profile = ast.literal_eval(candidate.profile)
        except:
            profile = {}

        try:
            match_data = ast.literal_eval(match.result)
        except:
            match_data = {}

        candidates.append({
            "candidate_id": candidate.id,
            "name": candidate.name,
            "email": candidate.email,
            "score": match.score,
            "tier": match.tier,
            "skills": profile.get("skills", []),
            "strengths": match_data.get("strengths", []),
            "gaps": match_data.get("gaps", []),
            "validation_flags": match_data.get(
                "validation_flags", []
            ),
            "summary": match_data.get("summary", "")
        })

    return candidates