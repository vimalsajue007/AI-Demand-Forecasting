import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.db.database import create_tables
from app.api.routes import auth, datasets, forecasts, dashboard, reports
from app.core.config import settings
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    create_tables()
    yield
    # Shutdown (nothing to do)


app = FastAPI(
    title="AI Demand Forecasting API",
    description="Advanced AI-powered demand forecasting platform",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(datasets.router)
app.include_router(forecasts.router)
app.include_router(dashboard.router)
app.include_router(reports.router)

# Serve uploaded files
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")


@app.get("/")
def root():
    return {"message": "AI Demand Forecasting API", "version": "1.0.0", "status": "running"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
