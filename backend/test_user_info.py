import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from app.services.codeforces import get_user_info

async def check():
    info = await get_user_info("adarsh7203")
    print(info)

if __name__ == "__main__":
    asyncio.run(check())
