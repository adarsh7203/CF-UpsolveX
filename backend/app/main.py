from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from apscheduler.schedulers.background import BackgroundScheduler

# Import routers here once they are implemented
from app.routes import user, contest, upsolve, analytics, dashboard, notify, settings, auth, extension
from app.services.auth_middleware import verify_token
from app.scheduler.contest_checker import sync_all_users
from app.scheduler.email_trigger import check_and_send_emails

# Setup Scheduler
scheduler = BackgroundScheduler()
# Run sync every 1 hour
scheduler.add_job(sync_all_users, 'interval', minutes=30)
# Check for pending emails every 1 hour
scheduler.add_job(check_and_send_emails, 'interval', minutes=30)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    scheduler.start()
    yield
    # Shutdown
    scheduler.shutdown()

app = FastAPI(
    title="CF UpsolveX API",
    description="Backend API for CF UpsolveX - Track. Upsolve. Improve.",
    version="4.0.0",
    lifespan=lifespan
)

# CORS Middleware for Frontend Communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Public routes
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(extension.router, prefix="/api/extension", tags=["Extension"])

# Protected routes (Require JWT Session)
protected = [Depends(verify_token)]
app.include_router(user.router, prefix="/api/user", tags=["Users"], dependencies=protected)
app.include_router(contest.router, prefix="/api/contests", tags=["Contests"], dependencies=protected)
app.include_router(upsolve.router, prefix="/api/upsolve", tags=["Upsolve"], dependencies=protected)
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"], dependencies=protected)
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"], dependencies=protected)
app.include_router(notify.router, prefix="/api/notify", tags=["Notification"], dependencies=protected)
app.include_router(settings.router, prefix="/api/settings", tags=["Settings"], dependencies=protected)

@app.get("/")
def read_root():
    return {"message": "Welcome to CF UpsolveX API"}
