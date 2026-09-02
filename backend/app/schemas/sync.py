from pydantic import BaseModel
from typing import List, Dict, Any
from datetime import datetime

class SyncMutationItem(BaseModel):
    id: str
    entity_type: str # wardrobe_item, wear_event, outfit, profile, preference
    entity_id: str
    mutation_type: str # INSERT, UPDATE, DELETE
    payload: Dict[str, Any]
    client_timestamp: datetime

class SyncBatchRequest(BaseModel):
    mutations: List[SyncMutationItem]
    last_synced_version: int = 0

class SyncBatchResponse(BaseModel):
    applied_count: int
    failed_count: int
    conflict_count: int
    server_sync_version: int
    synced_entity_ids: List[str]
