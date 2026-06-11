from typing import List, Dict, Any

def filter_problems_by_index(problems: List[Dict[str, Any]], min_notify_index: str) -> List[Dict[str, Any]]:
    """Dynamically filters problems based on user's min_notify_index setting."""
    filtered = []
    for p in problems:
        cid = p.get("contest_id")
        idx = p.get("problem_index", "")
        if cid and cid < 100000:
            letter = ''.join([c for c in idx if c.isalpha()]).upper()
            if letter and letter > min_notify_index:
                continue
        filtered.append(p)
    return filtered

def calculate_kpis(problems: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Calculates dashboard KPI metrics from raw problem statuses."""
    pending_upsolves = len([p for p in problems if p.get("status") in ["wrong", "not_attempted"]])
    completed_upsolves = len([p for p in problems if p.get("status") == "upsolved"])
    solved_during = len([p for p in problems if p.get("status") == "solved"])
    
    unique_contests = set(p.get("contest_id") for p in problems)
    total_contests = len(unique_contests)
    
    total_problems = len(problems)
    completion_rate = 0.0
    if total_problems > 0:
        completion_rate = round(((solved_during + completed_upsolves) / total_problems) * 100, 2)
        
    return {
        "pending_upsolves": pending_upsolves,
        "completed_upsolves": completed_upsolves,
        "current_streak": 0, # Planned feature
        "total_contests": total_contests,
        "total_solved": solved_during,
        "completion_rate": completion_rate
    }
