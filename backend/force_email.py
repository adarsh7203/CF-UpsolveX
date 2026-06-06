import asyncio
from app.db.supabase_client import supabase
from app.services.email_service import send_reminder_email
from app.services.contest_detail import format_contest_history

def force_test_email():
    print("Fetching user data...")
    handle = "adarsh7203"
    
    users_res = supabase.table("users").select("*").eq("cf_handle", handle).execute()
    if not users_res.data:
        print("User not found")
        return
        
    user = users_res.data[0]
    email = user.get("email")
    if not email:
        print("No email found for user!")
        return
        
    print(f"Target email: {email}")
    
    # Get all problems for the user
    problems_res = supabase.table("user_problem_status").select("*, contests(*)").eq("user_id", user["id"]).execute()
    if not problems_res.data:
        print("No problem data found")
        return
        
    # Format contest history
    contests_data = format_contest_history(problems_res.data)
    if not contests_data:
        print("No formatted contest data")
        return
        
    # Pick the most recent contest
    c_data = contests_data[0]  # Assuming they are sorted newest first
    
    cid = c_data["contest_id"]
    solved = c_data["solved"] + c_data["upsolved"]
    total = c_data["total_problems"]
    missed = total - solved
    completion_percent = c_data["completion_percentage"]
    
    # Gather upsolve queue for this contest
    upsolve_queue = [p for p in c_data["problems"] if p["status"] in ["wrong", "not_attempted"]]
    upsolve_queue.sort(key=lambda x: x["index"])
    
    dashboard_link = f"http://localhost:5173/contests/{cid}"
    
    print(f"Sending test email for contest: {c_data['name']}...")
    result = send_reminder_email(
        user_email=email,
        contest_name=c_data["name"],
        completion_percent=completion_percent,
        solved=solved,
        total=total,
        missed=missed,
        upsolve_queue=upsolve_queue,
        dashboard_link=dashboard_link
    )
    
    print("Email trigger result:", result)

if __name__ == "__main__":
    force_test_email()
