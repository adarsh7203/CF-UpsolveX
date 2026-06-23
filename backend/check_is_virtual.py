import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from app.db.supabase_client import supabase

async def main():
    user_res = supabase.table("users").select("id").eq("cf_handle", "adarsh7203").execute()
    user_id = user_res.data[0]["id"]
    
    # Check problems with is_virtual = True
    problems_res = supabase.table("problem_status").select("*").eq("user_id", user_id).eq("is_virtual", True).execute()
    print(f"Found {len(problems_res.data)} problems with is_virtual = True")

if __name__ == "__main__":
    asyncio.run(main())
