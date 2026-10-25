from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import create_tables
from .routers import auth, fdrs, documents, institutions, analytics, notifications, audit
from .config import settings
import os

app = FastAPI(
    title="AICTE FDR Management Portal",
    description="Intelligent FDR Scrutiny and Case Prioritization System - SIH26265",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

@app.on_event("startup")
def startup():
    create_tables()
    print("AICTE FDR Portal backend started.")
    print("API docs: http://localhost:8000/docs")

app.include_router(auth.router)
app.include_router(fdrs.router)
app.include_router(documents.router)
app.include_router(institutions.router)
app.include_router(analytics.router)
app.include_router(notifications.router)
app.include_router(audit.router)

@app.get("/")
def root():
    return {"message": "AICTE FDR Management Portal API", "version": "1.0.0", "status": "running"}

@app.get("/health")
def health():
    return {"status": "healthy"}
