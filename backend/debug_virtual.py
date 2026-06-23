import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from app.db.supabase_client import supabase, fetch_all

async def debug_virtual():
    user_res = supabase.table("users").select("id").eq("cf_handle", "adarsh7203").execute()
    user_id = user_res.data[0]["id"]
    
    probs = fetch_all(supabase.table("user_problem_status").select("*").eq("user_id", user_id))
    
    upsolved = [p for p in probs if p["status"] == "upsolved"]
    print(f"Upsolved problems:")
    for u in upsolved:
        print(f"{u['contest_id']}{u['problem_index']} - is_virtual: {u['is_virtual']}")

if __name__ == "__main__":
    asyncio.run(debug_virtual())
