import asyncio
import sys
import os

# Add the project root to sys.path so 'app' can be found
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.processor import sync_user_data

async def main():
    print("Syncing data for adarsh7203...")
    res = await sync_user_data('3048e5e8-386a-4781-8995-371d7876f23f', 'adarsh7203')
    print("Result:", res)

if __name__ == "__main__":
    asyncio.run(main())
