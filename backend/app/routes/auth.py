from fastapi import APIRouter, HTTPException
from app.db.supabase_client import supabase
from app.models.schemas import UserSignup, UserLogin

router = APIRouter()

@router.post("/signup")
async def signup(user: UserSignup):
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection failed")
        
    # Check if CF handle already exists in our table
    existing = supabase.table("users").select("id").eq("cf_handle", user.cf_handle).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="User with this handle already exists")
        
    try:
        auth_response = supabase.auth.sign_up({
            "email": user.email,
            "password": user.password
        })
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
        
    if not auth_response.user:
        raise HTTPException(status_code=400, detail="Signup failed")
        
    new_user = {
        "id": auth_response.user.id,
        "cf_handle": user.cf_handle,
        "email": user.email,
        "email_enabled": True,
        "weekly_digest": True,
        "min_notify_index": "C",
        "include_virtual": False
    }
    
    try:
        supabase.table("users").insert(new_user).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create user profile: {str(e)}")
        
    return {"message": "Signup successful. Please verify your email.", "user": auth_response.user}

@router.post("/login")
async def login(user: UserLogin):
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection failed")
        
    try:
        auth_response = supabase.auth.sign_in_with_password({
            "email": user.email,
            "password": user.password
        })
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid email or password")
        
    return {"session": auth_response.session}
