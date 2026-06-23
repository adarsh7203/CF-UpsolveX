import asyncio
import httpx

async def get_cf_data():
    async with httpx.AsyncClient() as client:
        res2 = await client.get("https://codeforces.com/api/user.status?handle=adarsh7203&from=1&count=500")
        subs = res2.json()
        print(f"Status: {subs.get('status')}")
        result = subs.get('result', [])
        print(f"Length of result (count=500): {len(result)}")
        
if __name__ == "__main__":
    asyncio.run(get_cf_data())
