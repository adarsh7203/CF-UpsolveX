import smtplib
import os
from email.mime.text import MIMEText

def test_email():
    email = "cfupsolvex@gmail.com"
    password = "wykpctrtkrlunfky"
    target = "adarshgupta7203@gmail.com"  # Using user's email based on earlier context

    msg = MIMEText("This is a test email from CF UpsolveX.")
    msg['Subject'] = "Test Email"
    msg['From'] = email
    msg['To'] = target

    try:
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.set_debuglevel(1)
        server.starttls()
        server.login(email, password)
        server.send_message(msg)
        server.quit()
        print("Success! Email sent.")
    except Exception as e:
        print(f"Failed to send: {e}")

if __name__ == "__main__":
    test_email()
