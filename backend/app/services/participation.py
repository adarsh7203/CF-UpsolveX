from typing import List, Dict, Any

def did_participate(contest_id: int, contest_start_time_seconds: int, contest_end_time_seconds: int, submissions: List[Dict[str, Any]], rating_history: List[Dict[str, Any]]) -> bool:
    """
    Robust participation detection rule.
    Signal 1: Rating History (Rated contests only)
    Signal 2: Submission Contest ID (Unrated/educational)
    """
    # Signal 1: rating history
    if any(r.get("contestId") == contest_id for r in rating_history):
        return True
    
    # Signal 2: submission with matching contest_id during contest window
    for s in submissions:
        if s.get("contestId") == contest_id:
            creation_time = s.get("creationTimeSeconds", 0)
            if contest_start_time_seconds <= creation_time <= contest_end_time_seconds:
                return True
                
    return False
