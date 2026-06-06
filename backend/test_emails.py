import asyncio
import os
import sys

from app.scheduler.email_trigger import check_and_send_emails

def main():
    check_and_send_emails()

if __name__ == "__main__":
    main()
