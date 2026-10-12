import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base, SessionLocal
from app.routers import (
    auth_router,
    documents_router,
    timeline_router,
    briefing_router,
    verification_router,
    sharing_router,
    audit_router
)
from app.data.synthetic_samples import seed_synthetic_patient_data

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    description="Sehat Sathi AI — The Two-Minute Doctor Medical Intelligence Platform",
    version="1.0.0"
)

# CORS configuration for development & production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth_router)
app.include_router(documents_router)
app.include_router(timeline_router)
app.include_router(briefing_router)
app.include_router(verification_router)
app.include_router(sharing_router)
app.include_router(audit_router)

@app.on_event("startup")
def startup_event():
    # Seed synthetic patient demo data if empty
    db = SessionLocal()
    try:
        seed_synthetic_patient_data(db)
    except Exception as e:
        print(f"Startup seed notice: {e}")
    finally:
        db.close()

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "environment": settings.ENVIRONMENT,
        "database": "connected"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
