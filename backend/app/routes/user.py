from fastapi import APIRouter, HTTPException
from app.db.supabase_client import supabase
from app.models.schemas import UserCreate

router = APIRouter()

@router.get("/{handle}")
async def get_user(handle: str):
    """Fetch user record."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection failed")
        
    response = supabase.table("users").select("*").eq("cf_handle", handle).execute()
    if response.data:
        return response.data[0]
        
    raise HTTPException(status_code=404, detail="User not found")

@router.post("/")
async def create_user(user: UserCreate):
    """Register a new user."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection failed")
        
    existing = supabase.table("users").select("id").eq("cf_handle", user.cf_handle).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="User with this handle already exists")
        
    new_user = {
        "cf_handle": user.cf_handle,
        "email": user.email,
        "email_enabled": user.email_enabled,
        "weekly_digest": user.weekly_digest,
        "min_notify_index": user.min_notify_index,
        "include_virtual": user.include_virtual
    }
    
    response = supabase.table("users").insert(new_user).execute()
    return response.data[0]

@router.post("/{handle}/refresh")
async def refresh_user_data(handle: str):
    """Trigger a sync with Codeforces to pull latest problems and statuses."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection failed")
        
    # Get user id
    user_res = supabase.table("users").select("id").eq("cf_handle", handle).execute()
    if not user_res.data:
        raise HTTPException(status_code=404, detail="User not found")
        
    user_id = user_res.data[0]["id"]
    
    # Run the processor
    from app.services.processor import sync_user_data
    result = await sync_user_data(user_id, handle)
    
    if result.get("status") == "error":
        raise HTTPException(status_code=500, detail=result.get("message"))
        
    return result
