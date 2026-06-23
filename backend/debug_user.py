import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.supabase_client import supabase

async def debug_user():
    user_res = supabase.table("users").select("min_notify_index").eq("cf_handle", "adarsh7203").execute()
    print(user_res.data)

if __name__ == "__main__":
    asyncio.run(debug_user())
