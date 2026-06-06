from fastapi import APIRouter, HTTPException
from app.db.supabase_client import supabase
from app.services.priority_queue import calculate_priority_score
from datetime import datetime
import dateutil.parser

router = APIRouter()

@router.get("/{handle}")
async def get_upsolve_queue(handle: str):
    """Priority-ordered upsolve queue."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection failed")
        
    user_res = supabase.table("users").select("id, min_notify_index").eq("cf_handle", handle).execute()
    if not user_res.data:
        raise HTTPException(status_code=404, detail="User not found")
    user_id = user_res.data[0]["id"]
    min_notify_index = user_res.data[0].get("min_notify_index", "Z").upper()
    
    # Get all unsolved problems
    problems_res = supabase.table("user_problem_status").select("*, contests(start_time)").eq("user_id", user_id).in_("status", ["wrong", "not_attempted"]).execute()
    
    from app.services.completion_service import filter_problems_by_index
    filtered_problems = filter_problems_by_index(problems_res.data, min_notify_index)
    
    queue = []
    for p in filtered_problems:
        contest_data = p.get("contests")
        if not contest_data or not contest_data.get("start_time"):
            continue
            
        try:
            start_time = dateutil.parser.isoparse(contest_data.get("start_time"))
        except Exception:
            start_time = datetime.now()
            
        priority = calculate_priority_score(
            contest_start_time=start_time,
            problem_rating=p.get("problem_rating"),
            failed_attempts=p.get("failed_attempts", 0)
        )
        p["priority_score"] = round(priority, 4)
        queue.append(p)
        
    # Sort by priority score descending
    queue.sort(key=lambda x: x["priority_score"], reverse=True)
    
    # Normalize scores so the most urgent problem is a 10.0
    if queue:
        max_score = queue[0]["priority_score"]
        if max_score > 0:
            for p in queue:
                # Scale relative to max_score
                normalized = (p["priority_score"] / max_score) * 10
                p["priority_score"] = round(normalized, 2)
    
    return {"handle": handle, "queue": queue}
