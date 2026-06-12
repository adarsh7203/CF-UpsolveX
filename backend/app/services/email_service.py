import os
import requests
from typing import List, Dict, Any
from dotenv import load_dotenv
from jinja2 import Environment, FileSystemLoader

load_dotenv()

BREVO_API_KEY = os.getenv("BREVO_API_KEY", "")
EMAIL_ADDRESS = os.getenv("EMAIL_ADDRESS", "cfupsolvex@gmail.com")

# Setup Jinja2 environment
template_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "templates")
env = Environment(loader=FileSystemLoader(template_dir))

def send_reminder_email(user_email: str, contest_name: str, completion_percent: float, solved: int, total: int, missed: int, upsolve_queue: List[Dict[str, Any]], dashboard_link: str):
    """Sends the active nudge email via Brevo's HTTP API with a beautiful HTML template."""
    
    # 1. Plain text fallback
    queue_text = ""
    for i, p in enumerate(upsolve_queue[:5]):
        rating = p.get("problem_rating", "Unrated")
        attempts = p.get("failed_attempts", 0)
        attempt_str = f"{attempts} failed attempt{'s' if attempts != 1 else ''}"
        if attempts == 0:
            attempt_str = "not attempted"
        queue_text += f"{i+1}. Problem {p.get('problem_index')} ({rating} rating) -- {attempt_str}\n"

    plain_text_body = f"""Hey,

You participated in {contest_name}.
Solved: {solved} / {total} | Missed: {missed} problems
Contest Completion: {completion_percent}% -- you can still reach 100%!

Upsolve Queue (by priority):
{queue_text}
Start now: {dashboard_link}

Track. Upsolve. Improve.
"""

    # 2. HTML Template Rendering
    try:
        template = env.get_template("reminder_email.html")
        html_body = template.render(
            contest_name=contest_name,
            solved=solved,
            total=total,
            missed=missed,
            upsolve_queue=upsolve_queue,
            dashboard_link=dashboard_link
        )
    except Exception as e:
        print(f"Template rendering failed: {e}")
        html_body = "" # Fallback to just plain text
    
    if not BREVO_API_KEY:
        print("BREVO_API_KEY not set. Simulating email payload (check server logs for HTML content)")
        return {"status": "simulated", "body": plain_text_body, "has_html": bool(html_body)}

    # 3. Construct payload for Brevo API
    url = "https://api.brevo.com/v3/smtp/email"
    headers = {
        "accept": "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json"
    }
    
    payload = {
        "sender": {"name": "CF UpsolveX", "email": EMAIL_ADDRESS},
        "to": [{"email": user_email}],
        "subject": "CF UpsolveX -- Don't Skip Your Missed Problems",
        "textContent": plain_text_body
    }
    
    if html_body:
        payload["htmlContent"] = html_body

    # 4. Send via HTTP API
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        response.raise_for_status() # Raise exception for 4xx or 5xx codes
        return {"status": "success", "message": f"Email sent to {user_email} via Brevo"}
    except requests.exceptions.RequestException as e:
        print(f"Failed to send email via Brevo API: {e}")
        if e.response is not None:
            print(f"Response data: {e.response.text}")
        return None
