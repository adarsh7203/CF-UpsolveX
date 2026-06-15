from fastapi import APIRouter, HTTPException
from app.db.supabase_client import supabase
from app.services.priority_queue import calculate_priority_score
from app.services.completion_service import filter_problems_by_index, calculate_kpis
from datetime import datetime
import dateutil.parser

router = APIRouter()

@router.get("/queue/{handle}")
async def get_extension_data(handle: str):
    """Unauthenticated endpoint to fetch top 10 queue and stats for the Chrome Extension."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection failed")
        
    user_res = supabase.table("users").select("id, min_notify_index, rating").eq("cf_handle", handle).execute()
    if not user_res.data:
        raise HTTPException(status_code=404, detail="User not found")
        
    user_id = user_res.data[0]["id"]
    min_notify_index = user_res.data[0].get("min_notify_index", "Z").upper()
    user_rating = user_res.data[0].get("rating")
    
    # Get all problem statuses for this user
    problems_res = supabase.table("user_problem_status").select("*, contests(start_time, name)").eq("user_id", user_id).execute()
    
    # Filter problems based on user's notification index settings
    filtered_all = filter_problems_by_index(problems_res.data, min_notify_index)
    
    # Calculate KPIs
    kpis = calculate_kpis(filtered_all)
    
    # Isolate pending problems for the queue
    pending_problems = [p for p in filtered_all if p.get("status") in ["wrong", "not_attempted"]]
    
    queue = []
    for p in pending_problems:
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
            failed_attempts=p.get("failed_attempts", 0),
            user_rating=user_rating
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
                normalized = (p["priority_score"] / max_score) * 10
                p["priority_score"] = round(normalized, 2)
                
    # Only return top 10 items
    top_10 = queue[:10]
    
    return {
        "handle": handle,
        "queue": top_10,
        "queue_size": len(queue),
        "stats": kpis
    }
