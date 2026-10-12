from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.all_models import (
    User,
    UncertaintyRecord,
    VerificationCorrection,
    MedicalDocument
)
from app.schemas.all_schemas import (
    UncertaintyOut,
    CorrectionRequest,
    VerificationActionRequest
)
from app.services.auth_service import get_current_user
from app.services.verification_service import verification_service

router = APIRouter(prefix="/api/verification", tags=["Verification"])

@router.get("/uncertainties", response_model=List[UncertaintyOut])
def get_uncertainties(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    uncertainties = db.query(UncertaintyRecord).filter(
        UncertaintyRecord.user_id == current_user.id,
        UncertaintyRecord.resolved == False
    ).order_by(UncertaintyRecord.created_at.desc()).all()

    doc_map = {d.id: d.original_filename for d in db.query(MedicalDocument).filter(MedicalDocument.user_id == current_user.id).all()}

    results = []
    for u in uncertainties:
        results.append({
            "id": u.id,
            "document_id": u.document_id,
            "document_name": doc_map.get(u.document_id, "Document"),
            "entity_type": u.entity_type,
            "field_name": u.field_name,
            "detected_value": u.detected_value,
            "reason": u.reason,
            "suggested_options": u.suggested_options,
            "resolved": u.resolved,
            "resolved_value": u.resolved_value,
            "created_at": u.created_at
        })
    return results

@router.post("/resolve/{uncertainty_id}")
def resolve_uncertainty(
    uncertainty_id: str,
    resolved_value: str = Body(..., embed=True),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return verification_service.resolve_uncertainty(uncertainty_id, resolved_value, current_user, db)

@router.post("/correct")
def correct_record(
    req: CorrectionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return verification_service.correct_record(req, current_user, db)

@router.post("/status")
def update_status(
    req: VerificationActionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return verification_service.update_verification_status(req, current_user, db)

@router.get("/history")
def get_correction_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(VerificationCorrection).filter(
        VerificationCorrection.user_id == current_user.id
    ).order_by(VerificationCorrection.corrected_at.desc()).all()
