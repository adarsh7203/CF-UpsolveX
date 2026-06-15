import datetime
import math
from typing import Optional

def calculate_priority_score(
    contest_start_time: datetime.datetime,
    problem_rating: Optional[int],
    failed_attempts: int,
    user_rating: Optional[int] = None,
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
        
    days_since_contest = max(0, (now - contest_start_time).days)
    
    # RecencyScore: exp(-DaysSinceContest / 30)
    recency_score = math.exp(-days_since_contest / 30.0)
    
    # DifficultyScore: bell curve around user rating
    actual_rating = problem_rating if problem_rating else 800
    u_rating = user_rating if user_rating else 1500
    delta = abs(actual_rating - u_rating)
    sigma = 300.0
    difficulty_score = math.exp(-(delta ** 2) / (2 * (sigma ** 2)))
    
    # AttemptScore - more attempts means known weak spot
    attempt_score = min(1.0, 0.25 * failed_attempts)
    
    raw_score = (w1 * recency_score) + (w2 * difficulty_score) + (w3 * attempt_score)
    # Scale to 1-10 to match UI logic (score > 5 is HIGH priority)
    return round(raw_score * 10, 2)
