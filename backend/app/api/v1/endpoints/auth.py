from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid
from datetime import datetime
from app.models.database import get_db
from app.models.user import User, Profile, Preference
from app.schemas.auth import UserCreate, UserLogin, Token, UserResponse
from app.core.security import get_password_hash, verify_password, create_access_token, get_current_user_id

router = APIRouter()

@router.post("/register", response_model=Token)
async def register(data: UserCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="User with this email already exists")
    
    user_id = str(uuid.uuid4())
    user = User(
        id=user_id,
        email=data.email,
        hashed_password=get_password_hash(data.password)
    )
    profile = Profile(
        id=str(uuid.uuid4()),
        user_id=user_id,
        display_name=data.display_name or data.email.split("@")[0]
    )
    preference = Preference(
        id=str(uuid.uuid4()),
        user_id=user_id,
        style_preferences=["Casual", "Minimal"]
    )
    
    db.add(user)
    db.add(profile)
    db.add(preference)
    await db.commit()
    
    token = create_access_token(user_id)
    return Token(access_token=token, token_type="bearer", user_id=user_id, email=user.email)

@router.post("/login", response_model=Token)
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalars().first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_access_token(user.id)
    return Token(access_token=token, token_type="bearer", user_id=user.id, email=user.email)

@router.get("/me", response_model=UserResponse)
async def get_me(user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user:
        # Create default mock user if in dev/offline mode
        user = User(id=user_id, email=f"{user_id}@omnipresence.ai")
        db.add(user)
        await db.commit()
    return user
