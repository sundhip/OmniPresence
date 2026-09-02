from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid
from app.models.database import get_db
from app.models.user import Profile, Preference
from app.schemas.profile import ProfileUpdate, ProfileResponse, PreferenceUpdate, PreferenceResponse
from app.core.security import get_current_user_id

router = APIRouter()

@router.get("", response_model=ProfileResponse)
async def get_profile(user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Profile).where(Profile.user_id == user_id))
    profile = result.scalars().first()
    if not profile:
        profile = Profile(id=str(uuid.uuid4()), user_id=user_id, display_name="OmniPresence User")
        db.add(profile)
        await db.commit()
        await db.refresh(profile)
    return profile

@router.put("", response_model=ProfileResponse)
async def update_profile(data: ProfileUpdate, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Profile).where(Profile.user_id == user_id))
    profile = result.scalars().first()
    if not profile:
        profile = Profile(id=str(uuid.uuid4()), user_id=user_id, display_name="OmniPresence User")
        db.add(profile)
    
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(profile, key, value)
    profile.sync_version += 1
    await db.commit()
    await db.refresh(profile)
    return profile

@router.get("/preferences", response_model=PreferenceResponse)
async def get_preferences(user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Preference).where(Preference.user_id == user_id))
    pref = result.scalars().first()
    if not pref:
        pref = Preference(id=str(uuid.uuid4()), user_id=user_id)
        db.add(pref)
        await db.commit()
        await db.refresh(pref)
    return pref

@router.put("/preferences", response_model=PreferenceResponse)
async def update_preferences(data: PreferenceUpdate, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Preference).where(Preference.user_id == user_id))
    pref = result.scalars().first()
    if not pref:
        pref = Preference(id=str(uuid.uuid4()), user_id=user_id)
        db.add(pref)
        
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(pref, key, value)
    pref.sync_version += 1
    await db.commit()
    await db.refresh(pref)
    return pref
