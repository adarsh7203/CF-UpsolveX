import asyncio
import os
import sys

# Add the current directory to python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.supabase_client import supabase

async def debug_db():
    # 1. Get user id
    user_res = supabase.table("users").select("id").eq("cf_handle", "adarsh7203").execute()
    if not user_res.data:
        print("User adarsh7203 not found")
        return
    
    user_id = user_res.data[0]["id"]
    print(f"User ID: {user_id}")
    
    # 2. Get problems
    from app.db.supabase_client import fetch_all
    query = supabase.table("user_problem_status").select("*").eq("user_id", user_id)
    probs = fetch_all(query)
    
    print(f"Total problems in DB: {len(probs)}")
    
    solved = [p for p in probs if p["status"] == "solved"]
    upsolved = [p for p in probs if p["status"] == "upsolved"]
    wrong = [p for p in probs if p["status"] == "wrong"]
    not_attempted = [p for p in probs if p["status"] == "not_attempted"]
    
    print(f"Solved (DB): {len(solved)}")
    print(f"Upsolved (DB): {len(upsolved)}")
    print(f"Wrong (DB): {len(wrong)}")
    print(f"Not Attempted (DB): {len(not_attempted)}")

if __name__ == "__main__":
    asyncio.run(debug_db())
