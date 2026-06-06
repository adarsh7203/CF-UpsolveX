import asyncio
from app.services.processor import sync_user_data
from app.db.supabase_client import supabase

async def force_sync():
    handle = "adarsh7203"
    print(f"Fetching user ID for {handle}...")
    user_res = supabase.table("users").select("id").eq("cf_handle", handle).execute()
    if not user_res.data:
        print("User not found!")
        return
        
    user_id = user_res.data[0]["id"]
    print(f"Starting force sync for user_id: {user_id}...")
    
    # Run the processor
    result = await sync_user_data(user_id, handle)
    print("Sync Result:", result)

if __name__ == "__main__":
    asyncio.run(force_sync())
