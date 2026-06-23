import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from app.db.supabase_client import supabase, fetch_all
from app.services.completion_service import filter_problems_by_index, calculate_kpis

async def test_dashboard():
    user_id = "00616725-1ec8-4cee-b8cf-f020a5d594e8"
    all_problems = fetch_all(supabase.table("user_problem_status").select("*").eq("user_id", user_id))
    
    # Simulate new dashboard.py
    problems_data = [p for p in all_problems if p.get("is_virtual") != True]
    filtered_problems = filter_problems_by_index(problems_data, "Z")
    kpis = calculate_kpis(filtered_problems)
    
    print(kpis)

if __name__ == "__main__":
    asyncio.run(test_dashboard())
