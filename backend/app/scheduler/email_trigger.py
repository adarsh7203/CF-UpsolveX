from apscheduler.schedulers.background import BackgroundScheduler
from app.db.supabase_client import supabase
from app.services.email_service import send_reminder_email
from app.services.contest_detail import format_contest_history
import requests

def get_finished_contest_ids():
    """Fetch all contest IDs whose system testing is complete (phase = FINISHED)."""
    try:
        response = requests.get(
            "https://codeforces.com/api/contest.list",
            params={"lang": "en"},
            timeout=15
        )
        if response.status_code == 200:
            data = response.json()
            if data.get("status") == "OK":
                return set(
                    c["id"] for c in data.get("result", [])
                    if c.get("phase") == "FINISHED"
                )
    except Exception as e:
        print(f"Failed to fetch contest list for phase check: {e}")
    return None  # None = API failure (distinct from empty set)

def check_and_send_emails():
    """Scheduled job to trigger emails for newly completed contests."""
    print("Checking for pending emails...")
    if not supabase:
        return
    
    # Fetch finished contest IDs to ensure system testing is complete
    finished_contests = get_finished_contest_ids()
    if finished_contests is None:
        print("Could not verify contest phases from CF API. Skipping email cycle to avoid wrong data.")
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
            
            actually_notified = []
            
            for cid in all_new_contests:
                # PHASE CHECK: Only send email if contest system testing is complete
                if cid not in finished_contests:
                    print(f"Contest {cid} not yet FINISHED (system testing in progress). Skipping email.")
                    continue
                    
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
                    
                    dashboard_link = f"https://cfupsolvex.netlify.app/contests/{cid}"
                    
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
                    
                    actually_notified.append(cid)
            
            # Only update last_notified_contest_id for contests we actually sent emails for
            # This ensures contests skipped due to system testing are retried next cycle
            if actually_notified:
                max_cid = max(actually_notified)
                supabase.table("users").update({"last_notified_contest_id": max_cid}).eq("id", user["id"]).execute()
