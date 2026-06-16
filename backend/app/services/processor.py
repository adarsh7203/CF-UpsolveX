from app.services.codeforces import get_user_rating, get_user_status, get_user_info, get_all_contests, get_all_problems
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
        
    # Get user settings
    user_res = supabase.table("users").select("min_notify_index", "include_virtual", "last_notified_contest_id").eq("id", user_id).execute()
    user_settings = user_res.data[0] if user_res.data else {}
    min_notify_index = user_settings.get("min_notify_index", "Z").upper()
    include_virtual = user_settings.get("include_virtual", False)
    last_notified = user_settings.get("last_notified_contest_id") or 0
        
    rating_history = await get_user_rating(cf_handle)
    submissions = await get_user_status(cf_handle)
    user_info = await get_user_info(cf_handle)
    all_problems = await get_all_problems()
    
    # Update user's current rating and rank in the database
    if user_info:
        try:
            supabase.table("users").update({
                "rating": user_info.get("rating"),
                "rank": user_info.get("rank")
            }).eq("id", user_id).execute()
        except Exception as e:
            print(f"Failed to update user rating/rank: {e}")
            pass
    
    # 1. Determine participated contests
    participated_contest_ids = set([r["contestId"] for r in rating_history])
    
    for sub in submissions:
        p_type = sub.get("author", {}).get("participantType")
        if p_type == "CONTESTANT" or (include_virtual and p_type in ["VIRTUAL", "OUT_OF_COMPETITION"]):
            cid = sub.get("contestId")
            if cid:
                participated_contest_ids.add(cid)
                
    if not participated_contest_ids:
        return {"status": "success", "message": "No participated contests found"}
        
    # 2. Pre-populate problem_status_map with ALL eligible problems from participated contests
    problem_status_map = {}
    contest_problem_counts = {}
    
    for prob in all_problems:
        cid = prob.get("contestId")
        if cid in participated_contest_ids:
            idx = prob.get("index", "")
            # Extract the letter part of the index (e.g., 'D1' -> 'D')
            letter = ''.join([c for c in idx if c.isalpha()]).upper()
            if letter:
                key = (cid, idx)
                problem_status_map[key] = {
                    "contest_id": cid,
                    "problem_index": idx,
                    "problem_rating": prob.get("rating"),
                    "problem_url": f"https://codeforces.com/contest/{cid}/problem/{idx}",
                    "status": "not_attempted",
                    "failed_attempts": 0,
                    "solved_at": None
                }
                contest_problem_counts[cid] = contest_problem_counts.get(cid, 0) + 1
    
    # 3. Process submissions to update statuses
    # Process oldest to newest
    for sub in reversed(submissions):
        cid = sub.get("contestId")
        if cid not in participated_contest_ids:
            continue
            
        prob = sub.get("problem", {})
        idx = prob.get("index")
        key = (cid, idx)
        
        # We only care about problems that passed the min_notify_index filter
        if key not in problem_status_map:
            continue
            
        verdict = sub.get("verdict")
        participant_type = sub.get("author", {}).get("participantType")
        
        current = problem_status_map[key]
        
        if current["status"] in ["solved", "upsolved"]:
            continue
            
        if verdict == "OK":
            if participant_type in ["CONTESTANT", "OUT_OF_COMPETITION", "VIRTUAL"]:
                current["status"] = "solved"
            else:
                current["status"] = "upsolved"
            current["solved_at"] = datetime.fromtimestamp(sub.get("creationTimeSeconds", 0)).isoformat()
        elif verdict != "TESTING":
            current["failed_attempts"] += 1
            if current["status"] == "not_attempted":
                current["status"] = "wrong"
                
    # 3. Upsert Contests to Supabase
    unique_cids = list(set([cid for (cid, _) in problem_status_map.keys()]))
    all_contests = await get_all_contests()
    contest_info = {c["id"]: c for c in all_contests}
    
    contest_upsert_data = []
    from datetime import timezone
    for cid in unique_cids:
        c_data = contest_info.get(cid)
        if c_data:
            c_name = c_data.get("name", f"Codeforces Contest {cid}")
            s_time = c_data.get("startTimeSeconds", 0)
            duration = c_data.get("durationSeconds", 7200)
        else:
            c_name = f"Codeforces Contest {cid}"
            sub_times = [s.get("creationTimeSeconds", 0) for s in submissions if s.get("contestId") == cid]
            s_time = min(sub_times) if sub_times else 0
            duration = 7200
            
        contest_upsert_data.append({
            "contest_id": cid,
            "name": c_name,
            "start_time": datetime.fromtimestamp(s_time, tz=timezone.utc).isoformat() if s_time else None,
            "end_time": datetime.fromtimestamp(s_time + duration, tz=timezone.utc).isoformat() if s_time else None,
            "total_problems": contest_problem_counts.get(cid, 5)
        })
        
    if contest_upsert_data:
        try:
            supabase.table("contests").upsert(
                contest_upsert_data,
                on_conflict="contest_id"
            ).execute()
        except Exception as e:
            print(f"Failed to upsert contests: {e}")

    # 4. Upsert Problem Status to Supabase
    upsert_data = []
    for (cid, idx), data in problem_status_map.items():
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
            
    # 5. Prevent email spam on first sync
    if last_notified == 0 and participated_contest_ids:
        max_cid = max(participated_contest_ids)
        try:
            supabase.table("users").update({"last_notified_contest_id": max_cid}).eq("id", user_id).execute()
        except Exception as e:
            print(f"Failed to set initial last_notified_contest_id: {e}")
            
    return {"status": "success", "processed_problems": len(upsert_data)}
