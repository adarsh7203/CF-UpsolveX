import asyncio
import os
from dotenv import load_dotenv

load_dotenv("c:/Users/adars/OneDrive/Desktop/CF UpsolveX/backend/.env")

from supabase import create_client

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

supabase = create_client(url, key)

try:
    res = supabase.table("users").select("id, min_notify_index, rating").eq("cf_handle", "adarsh7203").execute()
    print("Success:", res.data)
except Exception as e:
    print("Error:", e)
