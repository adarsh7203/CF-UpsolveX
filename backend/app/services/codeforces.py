import httpx
from typing import List, Dict, Any

CF_API_BASE = "https://codeforces.com/api"

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
    async with httpx.AsyncClient() as client:
        # count=10000 to get a large history, can be optimized later
        response = await client.get(f"{CF_API_BASE}/user.status", params={"handle": handle, "from": 1, "count": count, "lang": "en"})
        if response.status_code != 200:
            return []
        data = response.json()
        if data.get("status") == "OK":
            return data.get("result", [])
        return []

async def get_all_contests() -> List[Dict[str, Any]]:
    """Fetch all contests to get names and times."""
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{CF_API_BASE}/contest.list", params={"lang": "en"})
        if response.status_code != 200:
            return []
        data = response.json()
        if data.get("status") == "OK":
            return data.get("result", [])
        return []

async def get_all_problems() -> List[Dict[str, Any]]:
    """Fetch all problems from the Codeforces problemset."""
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{CF_API_BASE}/problemset.problems", params={"lang": "en"})
        if response.status_code != 200:
            return []
        data = response.json()
        if data.get("status") == "OK" and "problems" in data.get("result", {}):
            return data.get("result")["problems"]
        return []
