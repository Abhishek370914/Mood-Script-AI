from fastapi import FastAPI, APIRouter, Header, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import httpx


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# =====================
# Models
# =====================

class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class StatusCheckCreate(BaseModel):
    client_name: str


class UserPublic(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    created_at: Optional[datetime] = None


class AuthExchangeRequest(BaseModel):
    session_id: str


class AuthExchangeResponse(BaseModel):
    user: UserPublic
    session_token: str

# =====================
# Helpers
# =====================

async def get_current_user(authorization: Optional[str]) -> UserPublic:
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization")

    token: Optional[str] = None
    if authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1].strip()

    if not token:
        raise HTTPException(status_code=401, detail="Invalid authorization")

    session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Unauthorized")

    expires_at = session.get("expires_at")
    if not expires_at:
        raise HTTPException(status_code=401, detail="Unauthorized")

    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if expires_at <= datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")

    user_doc = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Unauthorized")

    return UserPublic(**user_doc)


async def fetch_emergent_session_data(session_id: str) -> dict:
    url = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"
    async with httpx.AsyncClient(timeout=20.0) as client_http:
        resp = await client_http.get(url, headers={"X-Session-ID": session_id})
        resp.raise_for_status()
        return resp.json()


# =====================
# Routes
# =====================

@api_router.get("/")
async def root():
    return {"message": "MoodScript API"}


@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj


@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]


@api_router.post("/auth/exchange", response_model=AuthExchangeResponse)
async def auth_exchange(payload: AuthExchangeRequest):
    try:
        session_data = await fetch_emergent_session_data(payload.session_id)
    except httpx.HTTPError:
        raise HTTPException(status_code=401, detail="Invalid session")

    email = session_data.get("email")
    name = session_data.get("name")
    picture = session_data.get("picture")
    session_token = session_data.get("session_token")

    if not email or not session_token or not name:
        raise HTTPException(status_code=401, detail="Invalid session")

    # Find or create user
    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        user_doc = existing
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user_doc = {
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "created_at": datetime.now(timezone.utc),
        }
        await db.users.insert_one({**user_doc})

    # Upsert session token with 7-day expiry
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.update_one(
        {"session_token": session_token},
        {
            "$set": {
                "user_id": user_id,
                "session_token": session_token,
                "expires_at": expires_at,
                "created_at": datetime.now(timezone.utc),
            }
        },
        upsert=True,
    )

    return AuthExchangeResponse(user=UserPublic(**user_doc), session_token=session_token)


@api_router.get("/auth/me", response_model=UserPublic)
async def auth_me(authorization: Optional[str] = Header(default=None)):
    return await get_current_user(authorization)


@api_router.post("/auth/logout")
async def auth_logout(authorization: Optional[str] = Header(default=None)):
    if not authorization or not authorization.lower().startswith("bearer "):
        return {"ok": True}

    token = authorization.split(" ", 1)[1].strip()
    if token:
        await db.user_sessions.delete_many({"session_token": token})

    return {"ok": True}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
