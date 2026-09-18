import os
import asyncio
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from backend.app.core.config import settings
from backend.app.api.v1.api import api_router
from backend.app.db.supabase_client import get_supabase
from backend.app.services.sla_scheduler import SLAScheduler

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)

app = FastAPI(
    title="CityPulse Prime Backend Engine",
    description="AI-Driven Municipal Governance & Algorithmic Issue Triage Platform",
    version="2.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Enable CORS for React Vite Dev Server & external clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(api_router, prefix=settings.API_V1_STR)

# Directories
os.makedirs("uploaded_images", exist_ok=True)
os.makedirs("backend/test_images", exist_ok=True)

app.mount("/static/test_images", StaticFiles(directory="backend/test_images"), name="test_images")
app.mount("/uploaded_images", StaticFiles(directory="uploaded_images"), name="uploaded_images")

# Serve Built React Frontend if dist exists
dist_dir = os.path.join("frontend", "dist")
if os.path.exists(dist_dir):
    app.mount("/assets", StaticFiles(directory=os.path.join(dist_dir, "assets")), name="assets")


@app.on_event("startup")
async def startup_event():
    """
    Launches SLA background scheduler loop on application boot.
    """
    scheduler = SLAScheduler.get_instance()
    asyncio.create_task(scheduler.start_background_cron())
    logging.info("CityPulse Prime SLA Background Engine Initialized.")


@app.get("/health", tags=["General"])
def health():
    return {
        "status": "healthy",
        "platform": "CityPulse Prime Engine v2.0",
        "database": "connected (active in-memory state engine + direct DB fallback)"
    }


@app.get("/{full_path:path}", tags=["UI"])
def serve_react_app(full_path: str = ""):
    if full_path.startswith("api") or full_path.startswith("docs") or full_path.startswith("redoc"):
        return {"status": "not found"}

    dist_index = os.path.join("frontend", "dist", "index.html")
    if os.path.exists(dist_index):
        return FileResponse(dist_index)

    return {
        "name": "CityPulse Prime Engine",
        "version": "2.0.0",
        "docs": "/docs",
        "message": "Frontend operational. Access Vite dev server at http://localhost:5173"
    }