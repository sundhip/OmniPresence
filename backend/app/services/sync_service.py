from typing import List, Dict, Any
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.sync import SyncMutation, ActionLog
from app.schemas.sync import SyncMutationItem, SyncBatchRequest, SyncBatchResponse

class SyncService:
    async def process_batch(self, db: AsyncSession, user_id: str, request: SyncBatchRequest) -> SyncBatchResponse:
        applied = 0
        failed = 0
        synced_ids = []
        
        for item in request.mutations:
            try:
                # Check if mutation was already processed (idempotency)
                existing = await db.execute(select(SyncMutation).where(SyncMutation.id == item.id))
                if existing.scalars().first():
                    applied += 1
                    synced_ids.append(item.entity_id)
                    continue

                mutation = SyncMutation(
                    id=item.id,
                    user_id=user_id,
                    entity_type=item.entity_type,
                    entity_id=item.entity_id,
                    mutation_type=item.mutation_type,
                    payload=item.payload,
                    client_timestamp=item.client_timestamp,
                    status="synced"
                )
                db.add(mutation)
                applied += 1
                synced_ids.append(item.entity_id)
            except Exception:
                failed += 1
                
        await db.commit()
        return SyncBatchResponse(
            applied_count=applied,
            failed_count=failed,
            conflict_count=0,
            server_sync_version=request.last_synced_version + 1,
            synced_entity_ids=synced_ids
        )

sync_service = SyncService()
