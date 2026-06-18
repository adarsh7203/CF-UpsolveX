from apscheduler.schedulers.background import BackgroundScheduler
from app.db.supabase_client import supabase
from app.services.email_service import send_reminder_email
from app.services.contest_detail import format_contest_history

def check_and_send_emails():
    """Scheduled job to trigger emails for newly completed contests."""
    print("Checking for pending emails...")
    if not supabase:
        return
        
    users_res = supabase.table("users").select("*").eq("email_enabled", True).execute()
    for user in users_res.data:
        if not user.get("email"):
            continue
            
        last_notified = user.get("last_notified_contest_id", 0)
        
        # Check if there are newer contests in user_problem_status
        problems_res = supabase.table("user_problem_status").select("*, contests(*)").eq("user_id", user["id"]).gt("contest_id", last_notified).execute()
        
        if problems_res.data:
            all_new_contests = sorted(list(set(p["contest_id"] for p in problems_res.data)))
            
            # Find contests where the user actually participated
            participated_contests = set()
            for p in problems_res.data:
                if p.get("is_virtual") is not None:
                    participated_contests.add(p["contest_id"])
            
            # Format the data using the same logic as the dashboard
            contests_data = format_contest_history(problems_res.data)
            
            for cid in all_new_contests:
                if cid in participated_contests:
                    print(f"Sending email for user {user['cf_handle']}, contest {cid}")
                    
                    # Find the specific contest data
                    c_data = next((c for c in contests_data if c["contest_id"] == cid), None)
                    if not c_data:
                        continue
                        
                    solved = c_data["solved"] + c_data["upsolved"]
                    total = c_data["total_problems"]
                    missed = total - solved
                    completion_percent = c_data["completion_percentage"]
                    
                    # Gather upsolve queue for this contest
                    upsolve_queue = [p for p in c_data["problems"] if p["status"] in ["wrong", "not_attempted"]]
                    
                    # Sort upsolve queue by index
                    upsolve_queue.sort(key=lambda x: x["index"])
                    
                    dashboard_link = f"http://localhost:5173/contests/{cid}"
                    
                    send_reminder_email(
                        user_email=user["email"],
                        contest_name=c_data["name"],
                        completion_percent=completion_percent,
                        solved=solved,
                        total=total,
                        missed=missed,
                        upsolve_queue=upsolve_queue,
                        dashboard_link=dashboard_link
                    )
            
            # Update last_notified_contest_id once to the maximum processed contest
            max_cid = max(all_new_contests)
            supabase.table("users").update({"last_notified_contest_id": max_cid}).eq("id", user["id"]).execute()
