import urllib.request
import re

def scrape_subs():
    url = "https://codeforces.com/submissions/adarsh7203"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            html = response.read().decode()
            
            # Find submission rows
            matches = re.findall(r'data-submission-id="(\d+)"', html)
            print(f"Codeforces submissions page shows {len(matches)} submissions on page 1.")
            
            # Find pagination
            pages = re.findall(r'pageIndex="(\d+)"', html)
            if pages:
                print(f"Max page index found: {max(map(int, pages))}")
            else:
                print("No pagination found. Only 1 page of submissions.")
    except Exception as e:
        print(f"Error: {e}")

scrape_subs()
