from fastapi import FastAPI
from app.routes import analyze, jobs, webhooks

app = FastAPI(title="FitAI Backend")

app.include_router(analyze.router)
app.include_router(jobs.router)
app.include_router(webhooks.router)

@app.get("/")
def root():
    return {"service": "fitai-backend", "status": "ok"}
