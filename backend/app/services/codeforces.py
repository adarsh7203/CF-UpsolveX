import httpx
import time
from typing import List, Dict, Any
from cachetools import TTLCache

CF_API_BASE = "https://codeforces.com/api"

# Bounded caches with auto-expiry to prevent unbounded memory growth
_global_cache = TTLCache(maxsize=5, ttl=3600)    # all_contests, all_problems (1 hour TTL)
_user_cache = TTLCache(maxsize=50, ttl=120)       # per-user submissions (2 min TTL)

async def get_user_rating(handle: str) -> List[Dict[str, Any]]:
    """Fetch rating history for a user (Signal 1 for participation)."""
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(f"{CF_API_BASE}/user.rating", params={"handle": handle, "lang": "en"})
        if response.status_code != 200:
            return []
        data = response.json()
        if data.get("status") == "OK":
            return data.get("result", [])
        return []

async def get_user_info(handle: str) -> Dict[str, Any]:
    """Fetch user info (rating, rank)."""
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(f"{CF_API_BASE}/user.info", params={"handles": handle, "lang": "en"})
        if response.status_code != 200:
            return {}
        data = response.json()
        if data.get("status") == "OK" and data.get("result"):
            return data.get("result")[0]
        return {}

async def get_user_status(handle: str, count: int = 10000) -> List[Dict[str, Any]]:
    """Fetch user submissions (Signal 2 and for checking solved/wrong/upsolved)."""
    cache_key = f"user_status_{handle}_{count}"
    if cache_key in _user_cache:
        return _user_cache[cache_key]
        
    async with httpx.AsyncClient(timeout=60.0) as client:
        # count=10000 to get a large history, can be optimized later
        response = await client.get(f"{CF_API_BASE}/user.status", params={"handle": handle, "from": 1, "count": count, "lang": "en"})
        if response.status_code != 200:
            return []
        data = response.json()
        if data.get("status") == "OK":
            res = data.get("result", [])
            _user_cache[cache_key] = res
            return res
async def verify_user_handle(handle: str, verification_problem: str = "4A") -> bool:
    """Verifies handle ownership by checking for a recent Compilation Error on a specific problem."""
    # Parse verification_problem (e.g. "4A" -> contest_id=4, index="A")
    import re
    match = re.match(r"^(\d+)([A-Z]\d*)$", verification_problem)
    if not match:
        return False
        
    req_contest_id = int(match.group(1))
    req_index = match.group(2)
    
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{CF_API_BASE}/user.status", params={"handle": handle, "from": 1, "count": 5, "lang": "en"})
        if response.status_code != 200:
            return False
            
        data = response.json()
        if data.get("status") != "OK":
            return False
            
        submissions = data.get("result", [])
        current_time = int(time.time())
        
        for sub in submissions:
            # Check if submission is within last 10 minutes (600 seconds)
            if current_time - sub.get("creationTimeSeconds", 0) > 600:
                continue
                
            problem = sub.get("problem", {})
            if problem.get("contestId") == req_contest_id and problem.get("index") == req_index:
                if sub.get("verdict") == "COMPILATION_ERROR":
                    return True
                    
        return False

async def get_all_contests() -> List[Dict[str, Any]]:
    """Fetch all contests to get names and times."""
    cache_key = "all_contests"
    if cache_key in _global_cache:
        return _global_cache[cache_key]
        
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.get(f"{CF_API_BASE}/contest.list", params={"lang": "en"})
        if response.status_code != 200:
            return []
        data = response.json()
        if data.get("status") == "OK":
            res = data.get("result", [])
            _global_cache[cache_key] = res
            return res
        return []

async def get_all_problems() -> List[Dict[str, Any]]:
    """Fetch all problems from the Codeforces problemset."""
    cache_key = "all_problems"
    if cache_key in _global_cache:
        return _global_cache[cache_key]
        
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.get(f"{CF_API_BASE}/problemset.problems", params={"lang": "en"})
        if response.status_code != 200:
            return []
        data = response.json()
        if data.get("status") == "OK" and "problems" in data.get("result", {}):
            res = data.get("result")["problems"]
            _global_cache[cache_key] = res
            return res
        return []
