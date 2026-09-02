from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.database import get_db
from app.schemas.sync import SyncBatchRequest, SyncBatchResponse
from app.services.sync_service import sync_service
from app.core.security import get_current_user_id

router = APIRouter()

@router.post("/batch", response_model=SyncBatchResponse)
async def sync_batch(
    request: SyncBatchRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    return await sync_service.process_batch(db, user_id, request)
