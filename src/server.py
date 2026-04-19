import os

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from src.agent import generate_daily_carry_plan


PROJECT_ROOT = os.getcwd()
PUBLIC_DIR = os.path.join(PROJECT_ROOT, "public")
HOST = os.getenv("HOST", "127.0.0.1")
PORT = int(os.getenv("PORT", "3000"))

app = FastAPI(title="Motter Agent API")


@app.get("/")
def index():
    index_path = os.path.join(PUBLIC_DIR, "index.html")
    return FileResponse(index_path)


@app.post("/api/generate_daily_carry_plan")
def generate_daily_carry_plan_api(payload: dict | None = None):
    try:
        return generate_daily_carry_plan(payload or {})
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


app.mount("/", StaticFiles(directory=PUBLIC_DIR, html=False), name="static")
