from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from app.db.supabase_client import supabase
from app.services.analytics_service import generate_analytics_data
from app.services.auth_middleware import verify_token

router = APIRouter()

@router.get("/{handle}")
def get_analytics(handle: str, max_index: Optional[str] = None, division: Optional[str] = "all", user=Depends(verify_token)):
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
    
    from app.db.supabase_client import fetch_all
    problems_data = fetch_all(supabase.table("user_problem_status").select("*, contests(name, start_time)").eq("user_id", user_id).in_("is_virtual", [True, False]))
    
    from app.services.completion_service import filter_problems_by_index
    
    if max_index:
        active_index = max_index.upper()
    else:
        user_settings = supabase.table("users").select("min_notify_index").eq("id", user_id).execute()
        active_index = user_settings.data[0].get("min_notify_index", "Z").upper() if user_settings.data else "Z"
        
    print(f"DEBUG: get_analytics called with handle={handle}, max_index={max_index}, active_index={active_index}, division={division}")
    print(f"DEBUG: Before filtering, problems count: {len(problems_data)}")
        
    filtered_problems = filter_problems_by_index(problems_data, active_index)
    print(f"DEBUG: After index filter ({active_index}), count: {len(filtered_problems)}")
    
    # Apply division filtering
    if division and division != "all":
        div_filtered = []
        divisions = [d.strip() for d in division.split(",")]
        for p in filtered_problems:
            cname = (p.get("contests") or {}).get("name", "").lower()
            if not cname:
                continue
            
            match = False
            for div in divisions:
                if div == "div1":
                    if "div. 1" in cname and "div. 2" not in cname: match = True
                elif div == "div2":
                    if "div. 2" in cname and "div. 1" not in cname: match = True
                elif div == "div1+2":
                    if "div. 1 + div. 2" in cname or ("div. 1" in cname and "div. 2" in cname): match = True
                elif div == "div3":
                    if "div. 3" in cname: match = True
                elif div == "div4":
                    if "div. 4" in cname: match = True
                elif div == "edu":
                    if "educational" in cname: match = True
                    
            if match:
                div_filtered.append(p)
        filtered_problems = div_filtered
    
    analytics_data = generate_analytics_data(filtered_problems)
    
    return {
        "handle": handle,
        "analytics": analytics_data
    }
