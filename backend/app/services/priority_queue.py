import datetime
from typing import Optional

def calculate_priority_score(
    contest_start_time: datetime.datetime,
    problem_rating: Optional[int],
    failed_attempts: int,
    w1: float = 0.50,
    w2: float = 0.30,
    w3: float = 0.20
) -> float:
    """
    Calculates priority score for upsolving.
    Priority = w1 * RecencyScore + w2 * DifficultyScore + w3 * AttemptScore
    """
    now = datetime.datetime.now(datetime.timezone.utc)
    # Ensure contest_start_time is timezone aware
    if contest_start_time.tzinfo is None:
        contest_start_time = contest_start_time.replace(tzinfo=datetime.timezone.utc)
        
    days_since_contest = max(1, (now - contest_start_time).days)
    
    # RecencyScore - inverse of days since contest
    recency_score = 1.0 / days_since_contest
    
    # DifficultyScore - normalized Codeforces rating (max rating ~3500)
    actual_rating = problem_rating if problem_rating else 800
    difficulty_score = min(actual_rating / 3500.0, 1.0)
    
    # AttemptScore - more attempts means known weak spot
    # Cap at 10 attempts to normalize
    attempt_score = min(failed_attempts / 10.0, 1.0)
    
    return (w1 * recency_score) + (w2 * difficulty_score) + (w3 * attempt_score)
