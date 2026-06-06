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

from app.services.processor import sync_user_data

@router.put("/{handle}")
async def update_settings(handle: str, settings: UserBase, background_tasks: BackgroundTasks):
    """Update user settings (handle, email, preferences)."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection failed")
        
    # Check if user exists
    user_check = supabase.table("users").select("*").eq("cf_handle", handle).execute()
    if not user_check.data:
        raise HTTPException(status_code=404, detail="User not found")
        
    old_user = user_check.data[0]
    old_handle = old_user.get("cf_handle")
    user_id = old_user.get("id")
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
    
    # Check if a sync is needed
    needs_sync = False
    if old_handle != new_handle:
        needs_sync = True
    if old_user.get("min_notify_index") != settings.min_notify_index:
        needs_sync = True
    if old_user.get("include_virtual") != settings.include_virtual:
        needs_sync = True
        
    if needs_sync:
        # Fire off a background task to rebuild the user's data
        background_tasks.add_task(sync_user_data, user_id, new_handle)
        
    return {"message": "Settings updated successfully", "settings": response.data[0]}
