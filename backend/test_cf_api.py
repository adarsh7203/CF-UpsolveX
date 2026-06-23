import urllib.request
import json

def get_subs():
    url = "https://codeforces.com/api/user.status?handle=adarsh7203&from=1&count=5"
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        print(data['result'][0])

get_subs()
