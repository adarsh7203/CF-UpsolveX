from fastapi import APIRouter, HTTPException, Depends
from app.db.supabase_client import supabase
from app.services.completion_service import calculate_kpis
from app.services.auth_middleware import verify_token

router = APIRouter()

@router.get("/{handle}")
async def get_dashboard(handle: str, user=Depends(verify_token)):
    """KPI card metrics."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection failed")
        
    user_res = supabase.table("users").select("id, min_notify_index").eq("cf_handle", handle).execute()
    if not user_res.data:
        raise HTTPException(status_code=404, detail="User not found")
    user_id = user_res.data[0]["id"]
    min_notify_index = user_res.data[0].get("min_notify_index", "Z").upper()
    
    # Optional: verify that the token owner is requesting their own data
    if user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this data")
    
    # Get all problem statuses for this user
    from app.db.supabase_client import fetch_all
    problems_data = fetch_all(supabase.table("user_problem_status").select("*").eq("user_id", user_id).in_("is_virtual", [True, False]))
    
    from app.services.completion_service import filter_problems_by_index
    filtered_problems = filter_problems_by_index(problems_data, min_notify_index)
    
    kpis = calculate_kpis(filtered_problems)
    
    return {"handle": handle, "kpis": kpis}
