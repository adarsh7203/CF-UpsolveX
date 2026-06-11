import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Dict, Any
from dotenv import load_dotenv
from jinja2 import Environment, FileSystemLoader

load_dotenv()

EMAIL_ADDRESS = os.getenv("EMAIL_ADDRESS", "")
EMAIL_APP_PASSWORD = os.getenv("EMAIL_APP_PASSWORD", "")

# Setup Jinja2 environment
template_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "templates")
env = Environment(loader=FileSystemLoader(template_dir))

def send_reminder_email(user_email: str, contest_name: str, completion_percent: float, solved: int, total: int, missed: int, upsolve_queue: List[Dict[str, Any]], dashboard_link: str):
    """Sends the active nudge email via Gmail SMTP with a beautiful HTML template."""
    
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
    
    if not EMAIL_ADDRESS or not EMAIL_APP_PASSWORD:
        print("EMAIL_ADDRESS or EMAIL_APP_PASSWORD not set. Simulating email payload (check server logs for HTML content)")
        return {"status": "simulated", "body": plain_text_body, "has_html": bool(html_body)}

    # 3. Construct the email message
    msg = MIMEMultipart('alternative')
    msg['Subject'] = "CF UpsolveX -- Don't Skip Your Missed Problems"
    msg['From'] = f"CF UpsolveX <{EMAIL_ADDRESS}>"
    msg['To'] = user_email

    # Attach plain text
    part1 = MIMEText(plain_text_body, 'plain')
    msg.attach(part1)

    # Attach HTML if available
    if html_body:
        part2 = MIMEText(html_body, 'html')
        msg.attach(part2)

    # 4. Send the email via Gmail SMTP
    try:
        # Create secure connection with server and send email
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(EMAIL_ADDRESS, EMAIL_APP_PASSWORD)
        server.send_message(msg)
        server.quit()
        return {"status": "success", "message": f"Email sent to {user_email}"}
    except Exception as e:
        print(f"Failed to send email via SMTP: {e}")
        return None
