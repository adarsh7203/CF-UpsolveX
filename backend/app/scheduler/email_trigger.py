from apscheduler.schedulers.background import BackgroundScheduler
from app.db.supabase_client import supabase
from app.services.email_service import send_reminder_email

def check_and_send_emails():
    """Scheduled job to trigger emails for newly completed contests."""
    print("Checking for pending emails...")
    if not supabase:
        return
        
    users_res = supabase.table("users").select("*").eq("email_enabled", True).execute()
    for user in users_res.data:
        last_notified = user.get("last_notified_contest_id", 0)
        
        # Check if there are newer contests in user_problem_status
        problems_res = supabase.table("user_problem_status").select("contest_id").eq("user_id", user["id"]).gt("contest_id", last_notified).execute()
        
        if problems_res.data:
            unique_new_contests = set(p["contest_id"] for p in problems_res.data)
            
            for cid in unique_new_contests:
                print(f"Would send email for user {user['cf_handle']}, contest {cid}")
                # Get stats and queue, then send_reminder_email()
                # Update last_notified_contest_id
                
                # supabase.table("users").update({"last_notified_contest_id": cid}).eq("id", user["id"]).execute()
