from fastapi import APIRouter, HTTPException, Depends
from app.db.supabase_client import supabase
from app.services.contest_detail import format_contest_history
from app.services.auth_middleware import verify_token

router = APIRouter()

@router.get("/{handle}")
async def get_contests(handle: str, user=Depends(verify_token)):
    """Full contest history with per-problem status."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection failed")
        
    user_res = supabase.table("users").select("id, min_notify_index").eq("cf_handle", handle).execute()
    if not user_res.data:
        raise HTTPException(status_code=404, detail="User not found")
    user_id = user_res.data[0]["id"]
    min_notify_index = user_res.data[0].get("min_notify_index", "Z").upper()
    
    if user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this data")
    
    from app.db.supabase_client import fetch_all
    problems_data = fetch_all(supabase.table("user_problem_status").select("*, contests(*)").eq("user_id", user_id))
    
    from app.services.completion_service import filter_problems_by_index
    filtered_problems = filter_problems_by_index(problems_data, min_notify_index)
    
    results = format_contest_history(filtered_problems)
    
    return {"handle": handle, "contests": results}

@router.get("/{handle}/{contest_id}")
async def get_contest_detail(handle: str, contest_id: int, user=Depends(verify_token)):
    """Detail view for a single contest."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection failed")
        
    user_res = supabase.table("users").select("id, min_notify_index, last_notified_contest_id").eq("cf_handle", handle).execute()
    if not user_res.data:
        raise HTTPException(status_code=404, detail="User not found")
    user_id = user_res.data[0]["id"]
    min_notify_index = user_res.data[0].get("min_notify_index", "Z").upper()
    last_notified = user_res.data[0].get("last_notified_contest_id") or 0
    
    if user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this data")
    
    from app.db.supabase_client import fetch_all
    problems_data = fetch_all(supabase.table("user_problem_status").select("*").eq("user_id", user_id).eq("contest_id", contest_id).order("problem_index"))
    
    from app.services.completion_service import filter_problems_by_index
    filtered_problems = filter_problems_by_index(problems_data, min_notify_index)
    
    if not filtered_problems:
        # If there are no problems locally, it means they didn't participate in this contest
        # or didn't sync yet. In offline mode, we just return empty array instead of
        # dynamically fetching from codeforces.
        pass
    
    contest_res = supabase.table("contests").select("*").eq("contest_id", contest_id).execute()
    contest_name = contest_res.data[0]["name"] if contest_res.data else f"Contest {contest_id}"
    
    is_missed = False
    if filtered_problems:
        is_virt = filtered_problems[0].get("is_virtual")
        if is_virt is None:
            is_missed = True

    return {
        "handle": handle, 
        "contest_id": contest_id, 
        "name": contest_name,
        "problems": filtered_problems,
        "reminder_sent": int(contest_id) <= last_notified and not is_missed,
        "is_missed": is_missed
    }
