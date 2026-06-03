from fastapi import APIRouter, HTTPException
from app.db.supabase_client import supabase
from app.services.email_service import send_reminder_email
# In a real scenario, you'd calculate upsolve queue or use the upsolve route logic here.
# For simplicity in this route, we fetch some basic contest stats to simulate the nudge.

router = APIRouter()

@router.post("/{handle}")
async def trigger_notification(handle: str, contest_id: int):
    """Manually trigger email reminder for a user and contest."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection failed")
        
    user_res = supabase.table("users").select("*").eq("cf_handle", handle).execute()
    if not user_res.data:
        raise HTTPException(status_code=404, detail="User not found")
        
    user = user_res.data[0]
    user_id = user["id"]
    email = user["email"]
    
    # We would normally get the most recent contest and generate the upsolve queue
    problems_res = supabase.table("user_problem_status").select("*").eq("user_id", user_id).eq("contest_id", contest_id).execute()
    
    if not problems_res.data:
        raise HTTPException(status_code=404, detail="No participation found for this contest")
        
    solved = len([p for p in problems_res.data if p.get("status") == "solved"])
    total = len(problems_res.data)
    missed = total - solved
    completion = round((solved / total) * 100, 2) if total > 0 else 0
    
    # Get missed problems for queue
    missed_problems = [p for p in problems_res.data if p.get("status") in ["wrong", "not_attempted"]]
    
    contest_res = supabase.table("contests").select("name").eq("contest_id", contest_id).execute()
    contest_name = contest_res.data[0]["name"] if contest_res.data else f"Contest {contest_id}"
    
    dashboard_link = f"https://cfupsolvex.com/dashboard/{handle}"
    
    # Send email
    result = send_reminder_email(
        user_email=email,
        contest_name=contest_name,
        completion_percent=completion,
        solved=solved,
        total=total,
        missed=missed,
        upsolve_queue=missed_problems,
        dashboard_link=dashboard_link
    )
    
    return {"handle": handle, "status": "triggered", "result": result}
