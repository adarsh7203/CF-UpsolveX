import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from app.db.supabase_client import supabase, fetch_all

async def main():
    user_res = supabase.table("users").select("id").eq("cf_handle", "adarsh7203").execute()
    if not user_res.data:
        print("User not found!")
        return
    user_id = user_res.data[0]["id"]
    
    # Fetch all problems for this user
    all_probs = fetch_all(supabase.table("user_problem_status").select("contest_id, is_virtual").eq("user_id", user_id))
    
    counts = {"True": 0, "False": 0, "None": 0}
    cids = {"True": set(), "False": set(), "None": set()}
    
    for p in all_probs:
        val = p.get("is_virtual")
        v_str = str(val)
        if v_str in counts:
            counts[v_str] += 1
            cids[v_str].add(p.get("contest_id"))
            
    print(f"Problem Counts: {counts}")
    print(f"Contest Counts: True: {len(cids['True'])}, False: {len(cids['False'])}, None: {len(cids['None'])}")

if __name__ == "__main__":
    asyncio.run(main())
