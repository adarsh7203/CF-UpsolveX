from cachetools import TTLCache
from app.db.supabase_client import supabase, fetch_all

# Cache storing user_id -> list of problems (max 100 users, 10 mins TTL)
user_problems_cache = TTLCache(maxsize=100, ttl=600)

def get_cached_user_problems(user_id: str):
    """
    Returns the cached problem status list for a user.
    If not cached or expired, fetches from Supabase and caches it.
    """
    if not supabase:
        return []

    if user_id in user_problems_cache:
        print(f"Cache HIT for user {user_id}")
        return user_problems_cache[user_id]
        
    print(f"Cache MISS for user {user_id}. Fetching from DB...")
    
    # Fetch all records with contest info
    problems_data = fetch_all(
        supabase.table("user_problem_status")
        .select("*, contests(*)")
        .eq("user_id", user_id)
    )
    
    user_problems_cache[user_id] = problems_data
    return problems_data

def invalidate_user_cache(user_id: str):
    """Removes the user from the cache, forcing a fresh DB pull next time."""
    if user_id in user_problems_cache:
        del user_problems_cache[user_id]
        print(f"Invalidated cache for user {user_id}")
