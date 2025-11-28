import os
from fastapi import APIRouter, Request
from app.services.storage import public_video_url

router = APIRouter(prefix="/webhooks", tags=["webhooks"])

@router.post("/supabase/storage")
async def on_storage_event(req: Request):
    event = await req.json()
    bucket = event.get("record", {}).get("bucket_id")
    path = event.get("record", {}).get("name")
    if bucket == os.getenv("VIDEOS_BUCKET") and path:
        url = public_video_url(path)
    return {"ok": True}
