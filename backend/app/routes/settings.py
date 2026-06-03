from fastapi import APIRouter, HTTPException, BackgroundTasks
from app.models.schemas import UserBase
from app.db.supabase_client import supabase

router = APIRouter()

@router.get("/{handle}")
async def get_settings(handle: str):
    """Retrieve user settings."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection failed")
        
    response = supabase.table("users").select("*").eq("cf_handle", handle).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="User not found")
        
    return {"handle": handle, "settings": response.data[0]}

@router.put("/{handle}")
async def update_settings(handle: str, settings: UserBase, background_tasks: BackgroundTasks):
    """Update user settings (handle, email, preferences)."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection failed")
        
    # Check if user exists
    user_check = supabase.table("users").select("id, cf_handle").eq("cf_handle", handle).execute()
    if not user_check.data:
        raise HTTPException(status_code=404, detail="User not found")
        
    old_handle = user_check.data[0].get("cf_handle")
    new_handle = settings.cf_handle
    
    update_data = {
        "cf_handle": new_handle,
        "email": settings.email,
        "email_enabled": settings.email_enabled,
        "weekly_digest": settings.weekly_digest,
        "min_notify_index": settings.min_notify_index,
        "include_virtual": settings.include_virtual
    }
    
    response = supabase.table("users").update(update_data).eq("cf_handle", handle).execute()
    
    if old_handle != new_handle:
        # TODO: Handle Change Behaviour - trigger full data re-sync
        # "Changing a CF handle triggers a full data re-sync: all contest and problem 
        # records for the old handle are archived, and fresh data is fetched."
        pass
        
    return {"message": "Settings updated successfully", "settings": response.data[0]}
