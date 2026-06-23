from typing import List, Dict, Any
from datetime import datetime, date, timedelta

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

def filter_by_virtual_setting(problems: List[Dict[str, Any]], include_virtual: bool) -> List[Dict[str, Any]]:
    """Filters problems to only include participated contests. include_virtual is handled during DB ingestion."""
    return [p for p in problems if p.get("is_virtual") is not None]

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
        
    # Calculate streak
    streak = 0
    solved_dates = set()
    for p in problems:
        if p.get("status") in ["solved", "upsolved"] and p.get("solved_at"):
            try:
                dt = datetime.fromisoformat(p.get("solved_at"))
                solved_dates.add(dt.date())
            except:
                pass
                
    if solved_dates:
        today = date.today()
        yesterday = today - timedelta(days=1)
        
        current_date = None
        if today in solved_dates:
            streak = 1
            current_date = yesterday
        elif yesterday in solved_dates:
            streak = 1
            current_date = yesterday - timedelta(days=1)
            
        if current_date:
            while current_date in solved_dates:
                streak += 1
                current_date -= timedelta(days=1)
                
    return {
        "pending_upsolves": pending_upsolves,
        "completed_upsolves": completed_upsolves,
        "current_streak": streak,
        "total_contests": total_contests,
        "total_solved": solved_during,
        "completion_rate": completion_rate
    }
