from pydantic import BaseModel, Field
from typing import Any, Union

class AnalyzeInput(BaseModel):
    video_route: str  
    exercise: str
    video_id: Union[str, int]

class JobOut(BaseModel):
    job_id: str
    status: str

class AnalysisOut(BaseModel):
    id: str
    job_id: str
    exercise: str
    reps: int | None
    score: float | None
    details: dict[str, Any] | None