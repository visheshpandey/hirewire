def generate_candidate_summary(candidate_data, match_data):

    return {
        "name": candidate_data.get("name", ""),
        "match_score": match_data.get("overall_score", 0),
        "tier": match_data.get("tier", ""),
        "strengths": match_data.get("strengths", []),
        "gaps": match_data.get("gaps", []),
        "validation_flags": match_data.get("validation_flags", []),
        "summary": match_data.get("summary", "")
    }