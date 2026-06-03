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
        
    user_res = supabase.table("users").select("id").eq("cf_handle", handle).execute()
    if not user_res.data:
        raise HTTPException(status_code=404, detail="User not found")
    user_id = user_res.data[0]["id"]
    
    if user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this data")
    
    problems_res = supabase.table("user_problem_status").select("*, contests(*)").eq("user_id", user_id).execute()
    
    results = format_contest_history(problems_res.data)
    
    return {"handle": handle, "contests": results}

@router.get("/{handle}/{contest_id}")
async def get_contest_detail(handle: str, contest_id: int, user=Depends(verify_token)):
    """Detail view for a single contest."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection failed")
        
    user_res = supabase.table("users").select("id").eq("cf_handle", handle).execute()
    if not user_res.data:
        raise HTTPException(status_code=404, detail="User not found")
    user_id = user_res.data[0]["id"]
    
    if user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this data")
    
    problems_res = supabase.table("user_problem_status").select("*").eq("user_id", user_id).eq("contest_id", contest_id).order("problem_index").execute()
    
    contest_res = supabase.table("contests").select("*").eq("contest_id", contest_id).execute()
    contest_name = contest_res.data[0]["name"] if contest_res.data else f"Contest {contest_id}"
    
    return {
        "handle": handle, 
        "contest_id": contest_id, 
        "name": contest_name,
        "problems": problems_res.data
    }
