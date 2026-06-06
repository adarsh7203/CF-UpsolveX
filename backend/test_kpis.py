import asyncio
import os
import sys

from app.services.codeforces import get_user_status
from app.db.supabase_client import supabase
from app.services.completion_service import calculate_kpis

async def main():
    handle = "adarsh7203"
    
    # Get from DB
    user_res = supabase.table("users").select("id").eq("cf_handle", handle).execute()
    if not user_res.data:
        print("User not found in DB")
        return
        
    user_id = user_res.data[0]["id"]
    problems_res = supabase.table("user_problem_status").select("*").eq("user_id", user_id).execute()
    db_problems = problems_res.data
    kpis = calculate_kpis(db_problems)
    print("=== DB KPIs ===")
    print(kpis)
    print(f"Total problems in DB: {len(db_problems)}")
    
    # Get from CF
    submissions = await get_user_status(handle)
    print(f"\nTotal submissions from CF: {len(submissions)}")
    
    solved_set = set()
    for sub in submissions:
        if sub.get("verdict") == "OK":
            prob = sub.get("problem", {})
            if "contestId" in prob and "index" in prob:
                solved_set.add(f'{prob["contestId"]}{prob["index"]}')
                
    print(f"Total unique solved problems on CF: {len(solved_set)}")

if __name__ == "__main__":
    asyncio.run(main())
