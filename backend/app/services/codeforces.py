import httpx
import time
from typing import List, Dict, Any

CF_API_BASE = "https://codeforces.com/api"

_cache = {}

def get_cached(key: str, ttl_seconds: int = 300):
    if key in _cache:
        entry = _cache[key]
        if time.time() - entry["time"] < ttl_seconds:
            return entry["data"]
    return None

def set_cached(key: str, data: Any):
    _cache[key] = {"time": time.time(), "data": data}

async def get_user_rating(handle: str) -> List[Dict[str, Any]]:
    """Fetch rating history for a user (Signal 1 for participation)."""
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{CF_API_BASE}/user.rating", params={"handle": handle, "lang": "en"})
        if response.status_code != 200:
            return []
        data = response.json()
        if data.get("status") == "OK":
            return data.get("result", [])
        return []

async def get_user_info(handle: str) -> Dict[str, Any]:
    """Fetch user info (rating, rank)."""
    async with httpx.AsyncClient() as client:
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
    cached_data = get_cached(cache_key, ttl_seconds=120)
    if cached_data is not None:
        return cached_data
        
    async with httpx.AsyncClient(timeout=60.0) as client:
        # count=10000 to get a large history, can be optimized later
        response = await client.get(f"{CF_API_BASE}/user.status", params={"handle": handle, "from": 1, "count": count, "lang": "en"})
        if response.status_code != 200:
            return []
        data = response.json()
        if data.get("status") == "OK":
            res = data.get("result", [])
            set_cached(cache_key, res)
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
    cached_data = get_cached(cache_key, ttl_seconds=3600)
    if cached_data is not None:
        return cached_data
        
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{CF_API_BASE}/contest.list", params={"lang": "en"})
        if response.status_code != 200:
            return []
        data = response.json()
        if data.get("status") == "OK":
            res = data.get("result", [])
            set_cached(cache_key, res)
            return res
        return []

async def get_all_problems() -> List[Dict[str, Any]]:
    """Fetch all problems from the Codeforces problemset."""
    cache_key = "all_problems"
    cached_data = get_cached(cache_key, ttl_seconds=3600)
    if cached_data is not None:
        return cached_data
        
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{CF_API_BASE}/problemset.problems", params={"lang": "en"})
        if response.status_code != 200:
            return []
        data = response.json()
        if data.get("status") == "OK" and "problems" in data.get("result", {}):
            res = data.get("result")["problems"]
            set_cached(cache_key, res)
            return res
        return []
