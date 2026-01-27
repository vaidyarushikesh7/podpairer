from fastapi import FastAPI, APIRouter, HTTPException, Request, Header, Response
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
from emergentintegrations.llm.chat import LlmChat, UserMessage
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest
import bcrypt
import asyncio

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Pydantic Models
class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    role: Optional[str] = None
    profile_completed: bool = False
    subscription_tier: str = "free"
    swipes_today: int = 0
    swipes_reset_at: Optional[datetime] = None
    created_at: datetime

class UserSession(BaseModel):
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime

class Profile(BaseModel):
    user_id: str
    # Common fields
    niche: List[str]
    language: str
    country: str
    availability: str
    
    # Host-specific fields
    podcast_name: Optional[str] = None
    podcast_description: Optional[str] = None
    topics: Optional[List[str]] = None
    audience_size: Optional[str] = None
    preferred_guest_type: Optional[List[str]] = None
    recording_format: Optional[str] = None
    podcast_links: Optional[Dict[str, str]] = None
    
    # Guest-specific fields
    bio: Optional[str] = None
    expertise: Optional[List[str]] = None
    previous_appearances: Optional[List[str]] = None
    social_links: Optional[Dict[str, str]] = None
    remote_recording: Optional[bool] = None
    
    created_at: datetime
    updated_at: datetime

class Swipe(BaseModel):
    swipe_id: str
    swiper_id: str
    swiped_id: str
    direction: str  # "left" or "right"
    created_at: datetime

class Match(BaseModel):
    match_id: str
    user1_id: str
    user2_id: str
    created_at: datetime
    last_message_at: Optional[datetime] = None

class ChatMessage(BaseModel):
    message_id: str
    match_id: str
    sender_id: str
    content: str
    created_at: datetime

class PaymentTransaction(BaseModel):
    payment_id: str
    user_id: str
    session_id: str
    amount: float
    currency: str
    status: str
    payment_status: str
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

# Request/Response Models
class RoleSelectionRequest(BaseModel):
    role: str

class ProfileSetupRequest(BaseModel):
    niche: List[str]
    language: str
    country: str
    availability: str
    podcast_name: Optional[str] = None
    podcast_description: Optional[str] = None
    topics: Optional[List[str]] = None
    audience_size: Optional[str] = None
    preferred_guest_type: Optional[List[str]] = None
    recording_format: Optional[str] = None
    podcast_links: Optional[Dict[str, str]] = None
    bio: Optional[str] = None
    expertise: Optional[List[str]] = None
    previous_appearances: Optional[List[str]] = None
    social_links: Optional[Dict[str, str]] = None
    remote_recording: Optional[bool] = None

class SwipeRequest(BaseModel):
    target_id: str
    direction: str

class ChatMessageRequest(BaseModel):
    content: str

class CheckoutRequest(BaseModel):
    package_id: str
    origin_url: str

class AIGenerateRequest(BaseModel):
    match_id: str

# Helper Functions
async def get_user_from_token(authorization: Optional[str] = None, session_token: Optional[str] = None) -> User:
    """Get user from session token (cookie or header)"""
    token = session_token or (authorization.replace("Bearer ", "") if authorization else None)
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    session_doc = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session_doc:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    expires_at = session_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    user_doc = await db.users.find_one({"user_id": session_doc["user_id"]}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="User not found")
    
    if isinstance(user_doc.get('created_at'), str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    if isinstance(user_doc.get('swipes_reset_at'), str):
        user_doc['swipes_reset_at'] = datetime.fromisoformat(user_doc['swipes_reset_at'])
    
    return User(**user_doc)

async def reset_swipes_if_needed(user: User):
    """Reset swipes if 24 hours have passed"""
    if user.swipes_reset_at and user.swipes_reset_at.tzinfo is None:
        user.swipes_reset_at = user.swipes_reset_at.replace(tzinfo=timezone.utc)
    
    now = datetime.now(timezone.utc)
    if not user.swipes_reset_at or now >= user.swipes_reset_at:
        await db.users.update_one(
            {"user_id": user.user_id},
            {"$set": {
                "swipes_today": 0,
                "swipes_reset_at": (now + timedelta(days=1)).isoformat()
            }}
        )
        user.swipes_today = 0
        user.swipes_reset_at = now + timedelta(days=1)

# Auth Routes
@api_router.post("/auth/session")
async def create_session(request: Request):
    """Exchange session_id for user data and session_token"""
    session_id = request.headers.get("X-Session-ID")
    if not session_id:
        raise HTTPException(status_code=400, detail="X-Session-ID header required")
    
    # Call Emergent Auth API
    import aiohttp
    async with aiohttp.ClientSession() as session:
        async with session.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        ) as resp:
            if resp.status != 200:
                raise HTTPException(status_code=401, detail="Invalid session_id")
            data = await resp.json()
    
    # Check if user exists
    user_doc = await db.users.find_one({"email": data["email"]}, {"_id": 0})
    
    if user_doc:
        user_id = user_doc["user_id"]
        # Update user info
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": data["name"], "picture": data["picture"]}}
        )
    else:
        # Create new user
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id,
            "email": data["email"],
            "name": data["name"],
            "picture": data["picture"],
            "role": None,
            "profile_completed": False,
            "subscription_tier": "free",
            "swipes_today": 0,
            "swipes_reset_at": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    
    # Create session
    session_token = data["session_token"]
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return {**user_doc, "session_token": session_token}

@api_router.get("/auth/me")
async def get_current_user(request: Request, authorization: Optional[str] = Header(None)):
    """Get current user from session token"""
    session_token = request.cookies.get("session_token")
    user = await get_user_from_token(authorization, session_token)
    return user

@api_router.post("/auth/logout")
async def logout(request: Request, authorization: Optional[str] = Header(None)):
    """Logout user"""
    session_token = request.cookies.get("session_token")
    token = session_token or (authorization.replace("Bearer ", "") if authorization else None)
    
    if token:
        await db.user_sessions.delete_one({"session_token": token})
    
    return {"message": "Logged out successfully"}

# Role Selection
@api_router.post("/role")
async def select_role(role_req: RoleSelectionRequest, request: Request, authorization: Optional[str] = Header(None)):
    """Select user role (host or guest)"""
    session_token = request.cookies.get("session_token")
    user = await get_user_from_token(authorization, session_token)
    
    if role_req.role not in ["host", "guest"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$set": {"role": role_req.role}}
    )
    
    return {"message": "Role selected", "role": role_req.role}

# Profile Routes
@api_router.post("/profile")
async def setup_profile(profile_req: ProfileSetupRequest, request: Request, authorization: Optional[str] = Header(None)):
    """Setup or update user profile"""
    session_token = request.cookies.get("session_token")
    user = await get_user_from_token(authorization, session_token)
    
    # Check if profile exists
    existing_profile = await db.profiles.find_one({"user_id": user.user_id}, {"_id": 0})
    
    profile_data = profile_req.model_dump()
    profile_data["user_id"] = user.user_id
    
    if existing_profile:
        profile_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.profiles.update_one(
            {"user_id": user.user_id},
            {"$set": profile_data}
        )
    else:
        profile_data["created_at"] = datetime.now(timezone.utc).isoformat()
        profile_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.profiles.insert_one(profile_data)
    
    # Mark profile as completed
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$set": {"profile_completed": True}}
    )
    
    return {"message": "Profile saved successfully"}

@api_router.get("/profile")
async def get_profile(request: Request, authorization: Optional[str] = Header(None)):
    """Get current user profile"""
    session_token = request.cookies.get("session_token")
    user = await get_user_from_token(authorization, session_token)
    
    profile = await db.profiles.find_one({"user_id": user.user_id}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    return profile

# Discovery Routes
@api_router.get("/discover")
async def get_candidates(request: Request, authorization: Optional[str] = Header(None)):
    """Get candidates for swiping"""
    session_token = request.cookies.get("session_token")
    user = await get_user_from_token(authorization, session_token)
    
    if not user.profile_completed:
        raise HTTPException(status_code=400, detail="Complete your profile first")
    
    # Check swipe limit for free users
    await reset_swipes_if_needed(user)
    
    # Refresh user data
    user_doc = await db.users.find_one({"user_id": user.user_id}, {"_id": 0})
    user = User(**user_doc)
    
    if user.subscription_tier == "free" and user.swipes_today >= 20:
        raise HTTPException(status_code=429, detail="Daily swipe limit reached. Upgrade to Pro for unlimited swipes.")
    
    # Get already swiped users
    swiped = await db.swipes.find({"swiper_id": user.user_id}, {"_id": 0}).to_list(1000)
    swiped_ids = [s["swiped_id"] for s in swiped]
    
    # Get candidates (opposite role)
    target_role = "guest" if user.role == "host" else "host"
    
    # Build query
    query = {
        "user_id": {"$nin": [user.user_id] + swiped_ids},
        "role": target_role,
        "profile_completed": True
    }
    
    # Get candidates
    candidates_cursor = db.users.find(query, {"_id": 0}).limit(10)
    candidates = await candidates_cursor.to_list(10)
    
    # Get profiles for candidates
    result = []
    for candidate in candidates:
        profile = await db.profiles.find_one({"user_id": candidate["user_id"]}, {"_id": 0})
        if profile:
            result.append({
                "user": candidate,
                "profile": profile
            })
    
    return result

# Swipe Routes
@api_router.post("/swipe")
async def swipe(swipe_req: SwipeRequest, request: Request, authorization: Optional[str] = Header(None)):
    """Swipe on a candidate"""
    session_token = request.cookies.get("session_token")
    user = await get_user_from_token(authorization, session_token)
    
    # Check swipe limit
    await reset_swipes_if_needed(user)
    user_doc = await db.users.find_one({"user_id": user.user_id}, {"_id": 0})
    user = User(**user_doc)
    
    if user.subscription_tier == "free" and user.swipes_today >= 20:
        raise HTTPException(status_code=429, detail="Daily swipe limit reached")
    
    # Create swipe record
    swipe_id = f"swipe_{uuid.uuid4().hex[:12]}"
    await db.swipes.insert_one({
        "swipe_id": swipe_id,
        "swiper_id": user.user_id,
        "swiped_id": swipe_req.target_id,
        "direction": swipe_req.direction,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Increment swipe count
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$inc": {"swipes_today": 1}}
    )
    
    # Check for match (if this is a right swipe)
    matched = False
    match_id = None
    
    if swipe_req.direction == "right":
        # Check if target also swiped right on this user
        reverse_swipe = await db.swipes.find_one({
            "swiper_id": swipe_req.target_id,
            "swiped_id": user.user_id,
            "direction": "right"
        }, {"_id": 0})
        
        if reverse_swipe:
            # Create match
            match_id = f"match_{uuid.uuid4().hex[:12]}"
            await db.matches.insert_one({
                "match_id": match_id,
                "user1_id": user.user_id,
                "user2_id": swipe_req.target_id,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "last_message_at": None
            })
            matched = True
    
    return {
        "message": "Swipe recorded",
        "matched": matched,
        "match_id": match_id
    }

# Match Routes
@api_router.get("/matches")
async def get_matches(request: Request, authorization: Optional[str] = Header(None)):
    """Get all matches for current user"""
    session_token = request.cookies.get("session_token")
    user = await get_user_from_token(authorization, session_token)
    
    # Get matches
    matches_cursor = db.matches.find({
        "$or": [
            {"user1_id": user.user_id},
            {"user2_id": user.user_id}
        ]
    }, {"_id": 0}).sort("created_at", -1)
    
    matches = await matches_cursor.to_list(100)
    
    # Get user info for each match
    result = []
    for match in matches:
        other_user_id = match["user2_id"] if match["user1_id"] == user.user_id else match["user1_id"]
        other_user = await db.users.find_one({"user_id": other_user_id}, {"_id": 0})
        other_profile = await db.profiles.find_one({"user_id": other_user_id}, {"_id": 0})
        
        if other_user and other_profile:
            result.append({
                "match": match,
                "other_user": other_user,
                "other_profile": other_profile
            })
    
    return result

# Chat Routes
@api_router.get("/chat/{match_id}/messages")
async def get_chat_messages(match_id: str, request: Request, authorization: Optional[str] = Header(None)):
    """Get chat messages for a match"""
    session_token = request.cookies.get("session_token")
    user = await get_user_from_token(authorization, session_token)
    
    # Verify match exists and user is part of it
    match = await db.matches.find_one({"match_id": match_id}, {"_id": 0})
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    
    if user.user_id not in [match["user1_id"], match["user2_id"]]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get messages
    messages_cursor = db.chat_messages.find({"match_id": match_id}, {"_id": 0}).sort("created_at", 1)
    messages = await messages_cursor.to_list(1000)
    
    return messages

@api_router.post("/chat/{match_id}/messages")
async def send_message(match_id: str, msg_req: ChatMessageRequest, request: Request, authorization: Optional[str] = Header(None)):
    """Send a chat message"""
    session_token = request.cookies.get("session_token")
    user = await get_user_from_token(authorization, session_token)
    
    # Verify match
    match = await db.matches.find_one({"match_id": match_id}, {"_id": 0})
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    
    if user.user_id not in [match["user1_id"], match["user2_id"]]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Create message
    message_id = f"msg_{uuid.uuid4().hex[:12]}"
    message_data = {
        "message_id": message_id,
        "match_id": match_id,
        "sender_id": user.user_id,
        "content": msg_req.content,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.chat_messages.insert_one(message_data.copy())
    
    # Update last_message_at
    await db.matches.update_one(
        {"match_id": match_id},
        {"$set": {"last_message_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return message_data

# AI Routes
@api_router.post("/ai/generate-pitch")
async def generate_pitch(ai_req: AIGenerateRequest, request: Request, authorization: Optional[str] = Header(None)):
    """Generate AI pitch message for a match"""
    session_token = request.cookies.get("session_token")
    user = await get_user_from_token(authorization, session_token)
    
    # Get match
    match = await db.matches.find_one({"match_id": ai_req.match_id}, {"_id": 0})
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    
    if user.user_id not in [match["user1_id"], match["user2_id"]]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get other user's profile
    other_user_id = match["user2_id"] if match["user1_id"] == user.user_id else match["user1_id"]
    other_user = await db.users.find_one({"user_id": other_user_id}, {"_id": 0})
    other_profile = await db.profiles.find_one({"user_id": other_user_id}, {"_id": 0})
    my_profile = await db.profiles.find_one({"user_id": user.user_id}, {"_id": 0})
    
    # Generate pitch using AI
    api_key = os.environ.get('EMERGENT_LLM_KEY')
    session_id = f"pitch_{uuid.uuid4().hex[:8]}"
    
    if user.role == "host":
        prompt = f"""You are helping a podcast host reach out to a potential guest.
        
Host's podcast: {my_profile.get('podcast_name', 'Unknown')}
Podcast description: {my_profile.get('podcast_description', 'N/A')}
Topics: {', '.join(my_profile.get('topics', []))}

Guest's name: {other_user.get('name', 'Guest')}
Guest's expertise: {', '.join(other_profile.get('expertise', []))}
Guest's bio: {other_profile.get('bio', 'N/A')}

Write a friendly, professional pitch message (2-3 sentences) inviting this guest to be on the podcast. Be specific about why they'd be a great fit."""
    else:
        prompt = f"""You are helping a podcast guest reach out to a podcast host.
        
Guest's name: {user.name}
Guest's expertise: {', '.join(my_profile.get('expertise', []))}
Guest's bio: {my_profile.get('bio', 'N/A')}

Podcast name: {other_profile.get('podcast_name', 'Unknown')}
Podcast description: {other_profile.get('podcast_description', 'N/A')}
Podcast topics: {', '.join(other_profile.get('topics', []))}

Write a friendly, professional pitch message (2-3 sentences) expressing interest in being a guest on this podcast. Be specific about what value you could bring."""
    
    chat = LlmChat(
        api_key=api_key,
        session_id=session_id,
        system_message="You are a helpful assistant that writes professional, friendly podcast pitch messages."
    ).with_model("openai", "gpt-5.2")
    
    user_message = UserMessage(text=prompt)
    response = await chat.send_message(user_message)
    
    return {"pitch": response}

# Subscription Routes
PACKAGES = {
    "pro_monthly": 9.99,
    "pro_yearly": 89.99
}

@api_router.get("/subscription/status")
async def get_subscription_status(request: Request, authorization: Optional[str] = Header(None)):
    """Get subscription status"""
    session_token = request.cookies.get("session_token")
    user = await get_user_from_token(authorization, session_token)
    
    return {
        "tier": user.subscription_tier,
        "swipes_today": user.swipes_today,
        "swipes_reset_at": user.swipes_reset_at
    }

@api_router.post("/subscription/checkout")
async def create_checkout(checkout_req: CheckoutRequest, request: Request, authorization: Optional[str] = Header(None)):
    """Create Stripe checkout session"""
    session_token = request.cookies.get("session_token")
    user = await get_user_from_token(authorization, session_token)
    
    if checkout_req.package_id not in PACKAGES:
        raise HTTPException(status_code=400, detail="Invalid package")
    
    amount = PACKAGES[checkout_req.package_id]
    
    # Create URLs
    success_url = f"{checkout_req.origin_url}/settings?session_id={{{{CHECKOUT_SESSION_ID}}}}"
    cancel_url = f"{checkout_req.origin_url}/settings"
    
    # Initialize Stripe
    api_key = os.environ.get('STRIPE_API_KEY')
    webhook_url = f"{checkout_req.origin_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=webhook_url)
    
    # Create checkout session
    checkout_request = CheckoutSessionRequest(
        amount=amount,
        currency="usd",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "user_id": user.user_id,
            "package_id": checkout_req.package_id
        }
    )
    
    session = await stripe_checkout.create_checkout_session(checkout_request)
    
    # Store transaction
    payment_id = f"payment_{uuid.uuid4().hex[:12]}"
    await db.payment_transactions.insert_one({
        "payment_id": payment_id,
        "user_id": user.user_id,
        "session_id": session.session_id,
        "amount": amount,
        "currency": "usd",
        "status": "pending",
        "payment_status": "pending",
        "metadata": {"package_id": checkout_req.package_id},
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"url": session.url, "session_id": session.session_id}

@api_router.get("/subscription/checkout-status/{session_id}")
async def check_checkout_status(session_id: str, request: Request, authorization: Optional[str] = Header(None)):
    """Check checkout session status"""
    session_token = request.cookies.get("session_token")
    user = await get_user_from_token(authorization, session_token)
    
    # Get transaction
    transaction = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    if transaction["user_id"] != user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Check with Stripe
    api_key = os.environ.get('STRIPE_API_KEY')
    webhook_url = "https://placeholder.com/webhook"  # Not used for status check
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=webhook_url)
    
    status = await stripe_checkout.get_checkout_status(session_id)
    
    # Update transaction if paid and not already processed
    if status.payment_status == "paid" and transaction["payment_status"] != "paid":
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {
                "status": "completed",
                "payment_status": "paid",
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        # Upgrade user subscription
        await db.users.update_one(
            {"user_id": user.user_id},
            {"$set": {"subscription_tier": "pro"}}
        )
    
    return status

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhooks"""
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    api_key = os.environ.get('STRIPE_API_KEY')
    webhook_url = "https://placeholder.com/webhook"
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=webhook_url)
    
    try:
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        if webhook_response.payment_status == "paid":
            # Update transaction
            await db.payment_transactions.update_one(
                {"session_id": webhook_response.session_id},
                {"$set": {
                    "status": "completed",
                    "payment_status": "paid",
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
            
            # Get user_id from transaction
            transaction = await db.payment_transactions.find_one(
                {"session_id": webhook_response.session_id},
                {"_id": 0}
            )
            
            if transaction:
                await db.users.update_one(
                    {"user_id": transaction["user_id"]},
                    {"$set": {"subscription_tier": "pro"}}
                )
        
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Admin Routes
@api_router.get("/admin/users")
async def get_all_users(request: Request, authorization: Optional[str] = Header(None)):
    """Get all users (admin only)"""
    session_token = request.cookies.get("session_token")
    user = await get_user_from_token(authorization, session_token)
    
    # Simple admin check (in production, add proper admin role)
    users_cursor = db.users.find({}, {"_id": 0}).sort("created_at", -1)
    users = await users_cursor.to_list(1000)
    
    return users

@api_router.get("/admin/stats")
async def get_stats(request: Request, authorization: Optional[str] = Header(None)):
    """Get platform statistics"""
    session_token = request.cookies.get("session_token")
    user = await get_user_from_token(authorization, session_token)
    
    total_users = await db.users.count_documents({})
    total_hosts = await db.users.count_documents({"role": "host"})
    total_guests = await db.users.count_documents({"role": "guest"})
    total_matches = await db.matches.count_documents({})
    total_messages = await db.chat_messages.count_documents({})
    total_swipes = await db.swipes.count_documents({})
    pro_users = await db.users.count_documents({"subscription_tier": "pro"})
    
    return {
        "total_users": total_users,
        "total_hosts": total_hosts,
        "total_guests": total_guests,
        "total_matches": total_matches,
        "total_messages": total_messages,
        "total_swipes": total_swipes,
        "pro_users": pro_users
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()