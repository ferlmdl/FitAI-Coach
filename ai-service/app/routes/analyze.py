import uuid, os
from fastapi import APIRouter, Depends
from sqlalchemy import text
from app.models import AnalyzeInput, JobOut
from app.services.db import get_db
from app.deps import get_current_user
import redis, rq

router = APIRouter(prefix="/analyze", tags=["analyze"])
q = rq.Queue("fitai", connection=redis.from_url(os.getenv("REDIS_URL")))

@router.post("/", response_model=JobOut)
def create_job(payload: AnalyzeInput, user=Depends(get_current_user), db=Depends(get_db)):
    job_id = str(uuid.uuid4())
    
    db.execute(
        text("INSERT INTO jobs(id,user_id,status,input_video_url) VALUES (:id,:uid,'queued',:url)"),
        {"id": job_id, "uid": user["id"], "url": payload.video_route}, 
    )
    db.commit()
    
    q.enqueue(
        "app.tasks.run_analysis", 
        job_id, 
        payload.video_route, 
        payload.exercise,
        payload.video_id
    )
    
    return JobOut(job_id=job_id, status="queued")