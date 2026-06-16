from fastapi import APIRouter, HTTPException, Depends
from app.db.supabase_client import supabase
from app.services.contest_detail import format_contest_history
from app.services.auth_middleware import verify_token

router = APIRouter()

from app.services.codeforces import get_user_rating

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
    
    problems_res = supabase.table("user_problem_status").select("*, contests(*)").eq("user_id", user_id).execute()
    
    from app.services.completion_service import filter_problems_by_index
    filtered_problems = filter_problems_by_index(problems_res.data, min_notify_index)
    
    results = format_contest_history(filtered_problems)
    
    # Tag virtual contests dynamically
    from app.services.codeforces import get_user_rating, get_user_info, get_all_contests
    
    rating_history = await get_user_rating(handle)
    official_cids = {r["contestId"] for r in rating_history}
    
    participated_cids = set()
    for c in results:
        c["is_virtual"] = c["contest_id"] not in official_cids
        c["is_missed"] = False
        participated_cids.add(c["contest_id"])
        
    # Append missed contests
    cf_info = await get_user_info(handle)
    reg_time = cf_info.get("registrationTimeSeconds", 0) if cf_info else 0
    
    all_cf_contests = await get_all_contests()
    from datetime import datetime, timezone
    
    for cf_c in all_cf_contests:
        if cf_c.get("phase") == "FINISHED":
            start_time_sec = cf_c.get("startTimeSeconds", 0)
            cid = cf_c.get("id")
            # Only consider contests after registration and not participated in
            if start_time_sec >= reg_time and cid not in participated_cids:
                results.append({
                    "contest_id": cid,
                    "name": cf_c.get("name"),
                    "start_time": datetime.fromtimestamp(start_time_sec, tz=timezone.utc).isoformat(),
                    "solved": 0,
                    "upsolved": 0,
                    "total_problems": 0,
                    "problems": [],
                    "completion_percentage": 0,
                    "is_virtual": False,
                    "is_missed": True
                })
                
    # Sort again since we appended new contests
    results.sort(key=lambda x: x["start_time"] or "", reverse=True)
    
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
    
    problems_res = supabase.table("user_problem_status").select("*").eq("user_id", user_id).eq("contest_id", contest_id).order("problem_index").execute()
    
    from app.services.completion_service import filter_problems_by_index
    filtered_problems = filter_problems_by_index(problems_res.data, min_notify_index)
    
    contest_res = supabase.table("contests").select("*").eq("contest_id", contest_id).execute()
    contest_name = contest_res.data[0]["name"] if contest_res.data else f"Contest {contest_id}"
    
    return {
        "handle": handle, 
        "contest_id": contest_id, 
        "name": contest_name,
        "problems": filtered_problems,
        "reminder_sent": int(contest_id) <= last_notified
    }
