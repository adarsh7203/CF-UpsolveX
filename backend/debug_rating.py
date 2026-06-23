
import asyncio
import httpx

async def debug_rating():
    async with httpx.AsyncClient() as client:
        res = await client.get("https://codeforces.com/api/user.rating?handle=adarsh7203")
        data = res.json()
        ratings = data.get("result", [])
        
        print(f"Total Rated Contests: {len(ratings)}")

if __name__ == "__main__":
    asyncio.run(debug_rating())
