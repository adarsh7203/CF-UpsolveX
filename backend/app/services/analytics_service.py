from typing import List, Dict, Any
from datetime import datetime

def generate_analytics_data(problems: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Generates all graph and chart data from raw problem statuses."""
    
    # 1. Completion Ratio (Pie Chart)
    solved = len([p for p in problems if p.get("status") == "solved"])
    upsolved = len([p for p in problems if p.get("status") == "upsolved"])
    pending = len([p for p in problems if p.get("status") in ["wrong", "not_attempted"]])
    
    completion_ratio = {
        "solved": solved,
        "upsolved": upsolved,
        "pending": pending
    }
    
    contests_map = {}
    upsolve_timeline = {} # For Upsolve Progress (Line Chart)
    
    for p in problems:
        # Grouping by Contest
        cid = p.get("contest_id")
        if cid not in contests_map:
            start_time = p.get("contests", {}).get("start_time") if p.get("contests") else None
            name = p.get("contests", {}).get("name", f"Contest {cid}") if p.get("contests") else f"Contest {cid}"
            contests_map[cid] = {"name": name, "solved": 0, "upsolved": 0, "total": 0, "start_time": start_time}
            
        contests_map[cid]["total"] += 1
        status = p.get("status")
        if status == "solved":
            contests_map[cid]["solved"] += 1
        elif status == "upsolved":
            contests_map[cid]["upsolved"] += 1
            
            # Grouping by Date for Upsolve Progress
            solved_at = p.get("solved_at")
            if solved_at:
                try:
                    date_str = datetime.fromisoformat(solved_at.replace("Z", "+00:00")).strftime("%Y-%m-%d")
                    upsolve_timeline[date_str] = upsolve_timeline.get(date_str, 0) + 1
                except:
                    pass
            
    # 2. Contest Completion Trend (Line Chart) & 3. Contest Performance (Bar Chart)
    contest_trend_data = []
    contest_performance_data = []
    
    for cid, data in contests_map.items():
        percent = 0
        if data["total"] > 0:
            percent = round(((data["solved"] + data["upsolved"]) / data["total"]) * 100, 2)
            
        contest_trend_data.append({
            "contest_id": cid,
            "name": data["name"],
            "completion_percentage": percent,
            "start_time": data["start_time"]
        })
        
        contest_performance_data.append({
            "contest_id": cid,
            "name": data["name"],
            "solved": data["solved"],
            "upsolved": data["upsolved"],
            "total": data["total"],
            "start_time": data["start_time"]
        })
        
    # Sort chronologically
    contest_trend_data.sort(key=lambda x: x["start_time"] or "")
    contest_performance_data.sort(key=lambda x: x["start_time"] or "")
    
    # 4. Upsolve Progress (Line Chart)
    upsolve_progress_data = [{"date": k, "count": v} for k, v in upsolve_timeline.items()]
    upsolve_progress_data.sort(key=lambda x: x["date"])
    
    return {
        "completion_ratio": completion_ratio,
        "completion_trend": contest_trend_data,
        "contest_performance": contest_performance_data,
        "upsolve_progress": upsolve_progress_data
    }
