from fastapi import APIRouter, HTTPException, Depends
from app.db.supabase_client import supabase
from app.services.analytics_service import generate_analytics_data
from app.services.auth_middleware import verify_token

router = APIRouter()

@router.get("/{handle}")
async def get_analytics(handle: str, user=Depends(verify_token)):
    """All graph data including completion trend."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection failed")
        
    user_res = supabase.table("users").select("id").eq("cf_handle", handle).execute()
    if not user_res.data:
        raise HTTPException(status_code=404, detail="User not found")
    user_id = user_res.data[0]["id"]
    
    # Optional: verify that the token owner is requesting their own data
    if user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this data")
    
    problems_res = supabase.table("user_problem_status").select("*, contests(name, start_time)").eq("user_id", user_id).execute()
    
    from app.services.completion_service import filter_problems_by_index
    user_settings = supabase.table("users").select("min_notify_index").eq("id", user_id).execute()
    min_notify_index = user_settings.data[0].get("min_notify_index", "Z").upper() if user_settings.data else "Z"
    
    filtered_problems = filter_problems_by_index(problems_res.data, min_notify_index)
    
    analytics_data = generate_analytics_data(filtered_problems)
    
    return {
        "handle": handle,
        "analytics": analytics_data
    }
