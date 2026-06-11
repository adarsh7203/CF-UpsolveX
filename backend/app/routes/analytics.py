from fastapi import APIRouter, HTTPException, Depends
from app.db.supabase_client import supabase
from app.services.analytics_service import generate_analytics_data
from app.services.auth_middleware import verify_token

router = APIRouter()

@router.get("/{handle}")
async def get_analytics(handle: str, max_index: str = None, division: str = "all", user=Depends(verify_token)):
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
    
    if max_index:
        active_index = max_index.upper()
    else:
        user_settings = supabase.table("users").select("min_notify_index").eq("id", user_id).execute()
        active_index = user_settings.data[0].get("min_notify_index", "Z").upper() if user_settings.data else "Z"
        
    print(f"DEBUG: get_analytics called with handle={handle}, max_index={max_index}, active_index={active_index}, division={division}")
    print(f"DEBUG: Before filtering, problems count: {len(problems_res.data)}")
        
    filtered_problems = filter_problems_by_index(problems_res.data, active_index)
    print(f"DEBUG: After index filter ({active_index}), count: {len(filtered_problems)}")
    
    # Apply division filtering
    if division and division != "all":
        div_filtered = []
        for p in filtered_problems:
            cname = (p.get("contests") or {}).get("name", "").lower()
            if not cname:
                continue
            
            match = False
            if division == "div1":
                match = "div. 1" in cname and "div. 2" not in cname
            elif division == "div2":
                match = "div. 2" in cname and "div. 1" not in cname
            elif division == "div1+2":
                match = "div. 1 + div. 2" in cname or ("div. 1" in cname and "div. 2" in cname)
            elif division == "div3":
                match = "div. 3" in cname
            elif division == "div4":
                match = "div. 4" in cname
            elif division == "edu":
                match = "educational" in cname
                
            if match:
                div_filtered.append(p)
        filtered_problems = div_filtered
    
    analytics_data = generate_analytics_data(filtered_problems)
    
    return {
        "handle": handle,
        "analytics": analytics_data
    }
