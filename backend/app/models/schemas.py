from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum

class ProblemStatus(str, Enum):
    solved = "solved"
    wrong = "wrong"
    not_attempted = "not_attempted"
    upsolved = "upsolved"

class UserSignup(BaseModel):
    email: EmailStr
    password: str
    cf_handle: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserBase(BaseModel):
    cf_handle: str
    email: EmailStr
    email_enabled: bool = True
    weekly_digest: bool = True
    min_notify_index: str = "C"
    include_virtual: bool = False

class UserCreate(UserBase):
    pass

class UserResponse(UserBase):
    id: str
    last_notified_contest_id: Optional[int] = None
    created_at: datetime

class ContestBase(BaseModel):
    contest_id: int
    name: str
    start_time: datetime
    end_time: datetime
    total_problems: int

class UserProblemStatusBase(BaseModel):
    user_id: str
    contest_id: int
    problem_index: str
    problem_rating: Optional[int] = None
    problem_url: str
    status: ProblemStatus
    failed_attempts: int = 0
    solved_at: Optional[datetime] = None

class KPIMetrics(BaseModel):
    pending_upsolves: int
    completed_upsolves: int
    current_streak: int
    total_contests: int
    total_upsolved: int
    completion_rate: float
