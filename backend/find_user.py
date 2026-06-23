import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from app.db.supabase_client import supabase, fetch_all

async def find_user():
    user_res = supabase.table("users").select("*").execute()
    for u in user_res.data:
        probs = fetch_all(supabase.table("user_problem_status").select("*").eq("user_id", u["id"]))
        upsolved = len([p for p in probs if p["status"] == "upsolved"])
        solved = len([p for p in probs if p["status"] == "solved"])
        contests = len(set([p["contest_id"] for p in probs]))
        print(f"User: {u['cf_handle']} | Contests: {contests} | Upsolved: {upsolved} | Solved: {solved}")

if __name__ == "__main__":
    asyncio.run(find_user())
