from apscheduler.schedulers.background import BackgroundScheduler
from app.services.processor import sync_user_data
from app.db.supabase_client import supabase
import asyncio

def sync_all_users():
    """Scheduled job to check for new contests and update problem statuses for all users."""
    print("Running scheduled Codeforces sync...")
    if not supabase:
        print("Database not connected. Skipping sync.")
        return
        
    users_res = supabase.table("users").select("id, cf_handle").execute()
    users = users_res.data
    
    # We use a new event loop here because apscheduler might run this in a thread without one
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    
    for user in users:
        print(f"Syncing user: {user['cf_handle']}")
        try:
            res = loop.run_until_complete(sync_user_data(user["id"], user["cf_handle"]))
            print(f"Sync result for {user['cf_handle']}: {res}")
        except Exception as e:
            print(f"Error syncing {user['cf_handle']}: {e}")
            
    loop.close()
