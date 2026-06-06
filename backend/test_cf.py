import asyncio
import httpx

async def main():
    async with httpx.AsyncClient() as client:
        r = await client.get('https://codeforces.com/api/problemset.problems')
        if r.status_code == 200:
            data = r.json()['result']
            problems = data['problems']
            print(f"Total problems: {len(problems)}")
            # Group by contest
            contests = {}
            for p in problems:
                cid = p.get('contestId')
                if cid:
                    contests[cid] = contests.get(cid, 0) + 1
            print(f"Total contests with problems: {len(contests)}")
        else:
            print("Error fetching")

if __name__ == "__main__":
    asyncio.run(main())
