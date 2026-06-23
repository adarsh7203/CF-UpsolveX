import requests

res = requests.get("https://codeforces.com/api/user.status?handle=adarsh7203")
data = res.json()
participant_types = {}
for sub in data.get("result", []):
    ptype = sub.get("author", {}).get("participantType")
    participant_types[ptype] = participant_types.get(ptype, 0) + 1

print(participant_types)
