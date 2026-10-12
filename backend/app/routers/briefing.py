from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.all_models import User
from app.schemas.all_schemas import DoctorBriefingOut
from app.services.auth_service import get_current_user
from app.services.briefing_service import briefing_service

router = APIRouter(prefix="/api/briefing", tags=["Two-Minute Doctor Brief"])

@router.get("", response_model=DoctorBriefingOut)
def get_doctor_briefing(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generates the Two-Minute Doctor Brief with source document traceability,
    active vs historical medication partitioning, and clinician clinical questions.
    """
    return briefing_service.generate_briefing(current_user, db)
