import asyncio
import httpx

async def get_cf_data():
    async with httpx.AsyncClient() as client:
        # Get rating history
        res1 = await client.get("https://codeforces.com/api/user.rating?handle=adarsh7203")
        rating_data = res1.json().get("result", [])
        print(f"Codeforces reports {len(rating_data)} rated contests for adarsh7203.")
        
        # Get submissions
        res2 = await client.get("https://codeforces.com/api/user.status?handle=adarsh7203&from=1&count=10000")
        subs = res2.json().get("result", [])
        ok_subs = [s for s in subs if s.get("verdict") == "OK"]
        contestant_subs = [s for s in ok_subs if s.get("author", {}).get("participantType") == "CONTESTANT"]
        practice_subs = [s for s in ok_subs if s.get("author", {}).get("participantType") == "PRACTICE"]
        
        print(f"Codeforces reports {len(subs)} total submissions for adarsh7203.")
        print(f"Codeforces reports {len(ok_subs)} successful submissions.")
        print(f"Solved in-contest: {len(contestant_subs)}")
        print(f"Upsolved (Practice): {len(practice_subs)}")

if __name__ == "__main__":
    asyncio.run(get_cf_data())
