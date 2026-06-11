import asyncio
import os
import sys

# Add the current directory to python path so it can import app
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.supabase_client import supabase
from app.services.processor import sync_user_data

async def run_manual_sync():
    print("Fetching users...")
    user_res = supabase.table("users").select("*").execute()
    users = user_res.data
    
    for u in users:
        print(f"Syncing user: {u['cf_handle']}")
        res = await sync_user_data(u['id'], u['cf_handle'])
        print(f"Result for {u['cf_handle']}: {res}")
        
    print("Sync complete!")

if __name__ == "__main__":
    asyncio.run(run_manual_sync())
