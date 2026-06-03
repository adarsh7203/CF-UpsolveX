from app.services.codeforces import get_user_rating, get_user_status
from app.db.supabase_client import supabase
from datetime import datetime

async def sync_user_data(user_id: str, cf_handle: str):
    """
    Sync Codeforces data for a user.
    Finds participated contests, determines problem statuses (solved, wrong, upsolved),
    and upserts them into the user_problem_status table.
    """
    if not supabase:
        return {"status": "error", "message": "Database not connected"}
        
    rating_history = await get_user_rating(cf_handle)
    submissions = await get_user_status(cf_handle)
    
    # 1. Determine participated contests
    # Signal 1: Rating updates
    participated_contest_ids = set([r["contestId"] for r in rating_history])
    
    # Signal 2: Fallback to CONTESTANT submissions
    for sub in submissions:
        if sub.get("author", {}).get("participantType") == "CONTESTANT":
            cid = sub.get("contestId")
            if cid:
                participated_contest_ids.add(cid)
                
    if not participated_contest_ids:
        return {"status": "success", "message": "No participated contests found"}
        
    # 2. Process problems from participated contests
    problem_status_map = {} # key: (contest_id, problem_index), value: dict
    
    # Process oldest to newest
    for sub in reversed(submissions):
        cid = sub.get("contestId")
        if cid not in participated_contest_ids:
            continue
            
        prob = sub.get("problem", {})
        idx = prob.get("index")
        if not idx:
            continue
            
        key = (cid, idx)
        verdict = sub.get("verdict")
        participant_type = sub.get("author", {}).get("participantType")
        
        if key not in problem_status_map:
            problem_status_map[key] = {
                "contest_id": cid,
                "problem_index": idx,
                "problem_rating": prob.get("rating"), # can be None
                "problem_url": f"https://codeforces.com/contest/{cid}/problem/{idx}",
                "status": "not_attempted",
                "failed_attempts": 0,
                "solved_at": None
            }
            
        current = problem_status_map[key]
        
        # If already solved, skip further updates to status
        if current["status"] in ["solved", "upsolved"]:
            continue
            
        if verdict == "OK":
            if participant_type in ["CONTESTANT", "OUT_OF_COMPETITION"]:
                current["status"] = "solved"
            else:
                current["status"] = "upsolved"
            current["solved_at"] = datetime.fromtimestamp(sub.get("creationTimeSeconds", 0)).isoformat()
        elif verdict != "TESTING":
            current["failed_attempts"] += 1
            if current["status"] == "not_attempted":
                current["status"] = "wrong"
                
    # 3. Upsert to Supabase
    upsert_data = []
    for (cid, idx), data in problem_status_map.items():
        # Ensure we add the contest to 'contests' table first so FK doesn't fail
        # In a full implementation, we'd sync contests first. For MVP, we insert dummy contest data if missing.
        try:
            supabase.table("contests").upsert({
                "contest_id": cid,
                "name": f"Codeforces Contest {cid}",
                "start_time": datetime.now().isoformat(), # Placeholder
                "end_time": datetime.now().isoformat(),   # Placeholder
                "total_problems": 5
            }, on_conflict="contest_id").execute()
        except Exception:
            pass # Ignore if it already exists
            
        upsert_data.append({
            "user_id": user_id,
            "contest_id": cid,
            "problem_index": idx,
            "problem_rating": data["problem_rating"],
            "problem_url": data["problem_url"],
            "status": data["status"],
            "failed_attempts": data["failed_attempts"],
            "solved_at": data["solved_at"]
        })
        
    if upsert_data:
        try:
            # Batch upsert is faster, max 1000 per request usually
            for i in range(0, len(upsert_data), 1000):
                supabase.table("user_problem_status").upsert(
                    upsert_data[i:i+1000], 
                    on_conflict="user_id,contest_id,problem_index"
                ).execute()
        except Exception as e:
            return {"status": "error", "message": str(e)}
            
    return {"status": "success", "processed_problems": len(upsert_data)}
