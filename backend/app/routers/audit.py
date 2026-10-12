from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.all_models import User, AuditEvent
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/api/audit", tags=["Audit Log"])

@router.get("")
def get_audit_trail(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns audit trail of security and modification events for the authenticated patient.
    """
    events = db.query(AuditEvent).filter(
        AuditEvent.user_id == current_user.id
    ).order_by(AuditEvent.timestamp.desc()).limit(50).all()
    return events
