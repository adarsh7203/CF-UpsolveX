from typing import List, Dict, Any

def format_contest_history(problems: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Groups problem statuses by contest to format the detailed contest view."""
    contests_map = {}
    
    for p in problems:
        cid = p.get("contest_id")
        if cid not in contests_map:
            start_time = p.get("contests", {}).get("start_time") if p.get("contests") else None
            name = p.get("contests", {}).get("name", f"Contest {cid}") if p.get("contests") else f"Contest {cid}"
            
            contests_map[cid] = {
                "contest_id": cid,
                "name": name,
                "start_time": start_time,
                "solved": 0,
                "upsolved": 0,
                "total_problems": 0,
                "problems": []
            }
            
        c_map = contests_map[cid]
        c_map["total_problems"] += 1
        
        status = p.get("status")
        if status == "solved":
            c_map["solved"] += 1
        elif status == "upsolved":
            c_map["upsolved"] += 1
            
        if p.get("is_virtual"):
            c_map["is_virtual"] = True
            
        c_map["problems"].append({
            "index": p.get("problem_index"),
            "rating": p.get("problem_rating"),
            "status": status,
            "failed_attempts": p.get("failed_attempts"),
            "solved_at": p.get("solved_at"),
            "url": p.get("problem_url")
        })
        
    # Calculate percentages and return list
    result = []
    for cid, data in contests_map.items():
        percent = 0
        if data["total_problems"] > 0:
            percent = round(((data["solved"] + data["upsolved"]) / data["total_problems"]) * 100, 2)
        data["completion_percentage"] = percent
        
        # A contest is missed if it's not virtual and they have any not_attempted or wrong problems
        has_unsolved = any(p["status"] in ["not_attempted", "wrong"] for p in data["problems"])
        data["is_missed"] = not data.get("is_virtual", False) and has_unsolved
        
        # Ensure is_virtual defaults to False if not set
        if "is_virtual" not in data:
            data["is_virtual"] = False
        
        # Sort problems by index (A, B, C...)
        data["problems"].sort(key=lambda x: x["index"])
        result.append(data)
        
    # Sort contests newest first
    result.sort(key=lambda x: x["start_time"] or "", reverse=True)
    return result
