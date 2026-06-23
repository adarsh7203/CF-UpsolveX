import asyncio
import httpx
from datetime import datetime

async def debug():
    async with httpx.AsyncClient() as client:
        res = await client.get("https://codeforces.com/api/user.status?handle=adarsh7203&from=1&count=10000")
        data = res.json()
        subs = data.get("result", [])
        
        solved = 0
        upsolved = 0
        total_ok = 0
        
        for sub in subs:
            if sub.get("verdict") == "OK":
                total_ok += 1
                ptype = sub.get("author", {}).get("participantType")
                if ptype in ["CONTESTANT", "OUT_OF_COMPETITION", "VIRTUAL"]:
                    solved += 1
                elif ptype == "PRACTICE":
                    upsolved += 1
                    
        print(f"Total Subs: {len(subs)}")
        print(f"Total OK: {total_ok}")
        print(f"Solved (Contest/Virtual): {solved}")
        print(f"Upsolved (Practice): {upsolved}")

if __name__ == "__main__":
    asyncio.run(debug())
