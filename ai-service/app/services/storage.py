import os
from urllib.parse import quote

PUBLIC_BASE = os.getenv("PUBLIC_STORAGE_BASE")
BUCKET = os.getenv("VIDEOS_BUCKET", "videos")

def public_video_url(path: str) -> str:
    return f"{PUBLIC_BASE}/{BUCKET}/{quote(path)}"
