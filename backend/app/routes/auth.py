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
        
    # Verify Handle Ownership
    from app.services.codeforces import verify_user_handle
    is_verified = await verify_user_handle(user.cf_handle, user.verification_problem)
    if not is_verified:
        raise HTTPException(
            status_code=400, 
            detail=f"VERIFICATION_FAILED: Please verify ownership by submitting any invalid code (Compilation Error) to problem {user.verification_problem} on Codeforces within the last 10 minutes, then click Signup again."
        )
        
    try:
        # Create user via admin API to avoid polluting the global client's JWT
        auth_response = supabase.auth.admin.create_user({
            "email": user.email,
            "password": user.password,
            "email_confirm": True
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
        "min_notify_index": "Z",
        "include_virtual": False
    }
    
    # Try to fetch initial CF info so the user has immediate data
    try:
        from app.services.codeforces import get_user_info
        cf_info = await get_user_info(user.cf_handle)
        if cf_info:
            new_user["cf_info"] = cf_info
            new_user["rating"] = cf_info.get("rating")
            new_user["rank"] = cf_info.get("rank")
    except Exception as e:
        print(f"Failed to fetch initial CF info: {e}")
    
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
