import urllib.request
import re

def scrape_profile():
    url = "https://codeforces.com/profile/adarsh7203"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            html = response.read().decode()
            
            # Find solved count
            match = re.search(r'(\d+)[\s\n]*problems', html)
            if match:
                print(f"Codeforces profile shows {match.group(1)} solved problems.")
            else:
                print("Could not find solved count.")
    except Exception as e:
        print(f"Error: {e}")

scrape_profile()
