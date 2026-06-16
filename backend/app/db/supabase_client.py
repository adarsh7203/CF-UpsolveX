import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv(override=True)

# We will expect SUPABASE_URL and SUPABASE_KEY to be set in a .env file
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

def get_supabase_client() -> Client:
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise ValueError("Supabase credentials not found in environment variables.")
    return create_client(SUPABASE_URL, SUPABASE_KEY)

# A global instance for easy import if needed
try:
    supabase = get_supabase_client()
except Exception:
    supabase = None  # Handle gracefully if env vars aren't set yet

def fetch_all(query_builder) -> list:
    """Helper to paginate through all rows, bypassing PostgREST 1000 row limits."""
    all_data = []
    offset = 0
    limit = 1000
    while True:
        res = query_builder.range(offset, offset + limit - 1).execute()
        all_data.extend(res.data)
        if len(res.data) < limit:
            break
        offset += limit
    return all_data
