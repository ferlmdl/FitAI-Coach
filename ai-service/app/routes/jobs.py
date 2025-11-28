from fastapi import APIRouter, Depends
from sqlalchemy import text
from app.models import AnalysisOut
from app.services.db import get_db
from app.deps import get_current_user

router = APIRouter(prefix="/jobs", tags=["jobs"])

@router.get("/{job_id}")
def get_job(job_id: str, user=Depends(get_current_user), db=Depends(get_db)):
    row = db.execute(
        text("SELECT id,status,input_video_url FROM jobs WHERE id=:id AND user_id=:uid"),
        {"id": job_id, "uid": user["id"]},
    ).mappings().first()
    if not row:
        return {"error": "not_found"}
    return dict(row)

@router.get("/{job_id}/analysis", response_model=AnalysisOut | dict)
def get_analysis(job_id: str, user=Depends(get_current_user), db=Depends(get_db)):
    row = db.execute(
        text("SELECT * FROM analyses a JOIN jobs j ON j.id=a.job_id WHERE a.job_id=:id AND j.user_id=:uid"),
        {"id": job_id, "uid": user["id"]},
    ).mappings().first()
    if not row:
        return {"status": "pending"}
    return dict(row)
