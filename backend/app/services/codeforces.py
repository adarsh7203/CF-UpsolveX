import httpx
from typing import List, Dict, Any

CF_API_BASE = "https://codeforces.com/api"

async def get_user_rating(handle: str) -> List[Dict[str, Any]]:
    """Fetch rating history for a user (Signal 1 for participation)."""
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{CF_API_BASE}/user.rating", params={"handle": handle})
        response.raise_for_status()
        data = response.json()
        if data.get("status") == "OK":
            return data.get("result", [])
        return []

async def get_user_status(handle: str, count: int = 10000) -> List[Dict[str, Any]]:
    """Fetch user submissions (Signal 2 and for checking solved/wrong/upsolved)."""
    async with httpx.AsyncClient() as client:
        # count=10000 to get a large history, can be optimized later
        response = await client.get(f"{CF_API_BASE}/user.status", params={"handle": handle, "from": 1, "count": count})
        response.raise_for_status()
        data = response.json()
        if data.get("status") == "OK":
            return data.get("result", [])
        return []
