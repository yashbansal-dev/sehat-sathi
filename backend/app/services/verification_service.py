import uuid
import datetime
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.all_models import (
    User,
    UncertaintyRecord,
    VerificationCorrection,
    AuditEvent,
    MedicationRecord,
    LabResultRecord,
    DiagnosisRecord,
    MedicalDocument
)
from app.schemas.all_schemas import CorrectionRequest, VerificationActionRequest

class VerificationService:
    @staticmethod
    def get_user_uncertainties(user_id: str, db: Session):
        return db.query(UncertaintyRecord).filter(
            UncertaintyRecord.user_id == user_id,
            UncertaintyRecord.resolved == False
        ).all()

    @staticmethod
    def resolve_uncertainty(uncertainty_id: str, resolved_value: str, user: User, db: Session):
        record = db.query(UncertaintyRecord).filter(
            UncertaintyRecord.id == uncertainty_id,
            UncertaintyRecord.user_id == user.id
        ).first()

        if not record:
            raise HTTPException(status_code=404, detail="Uncertainty record not found")

        old_val = record.detected_value
        record.resolved = True
        record.resolved_value = resolved_value

        # Audit correction
        corr = VerificationCorrection(
            id=str(uuid.uuid4()),
            user_id=user.id,
            entity_type=record.entity_type,
            entity_id=record.id,
            field_name=record.field_name,
            old_value=old_val,
            new_value=resolved_value,
            reason=f"Resolved uncertainty: {record.reason}",
            corrected_by=user.full_name,
            corrected_at=datetime.datetime.utcnow()
        )
        db.add(corr)

        # Audit event
        audit = AuditEvent(
            id=str(uuid.uuid4()),
            user_id=user.id,
            action="resolve_uncertainty",
            entity_type="uncertainty",
            entity_id=record.id,
            details={"field": record.field_name, "resolved_value": resolved_value}
        )
        db.add(audit)
        db.commit()
        return record

    @staticmethod
    def correct_record(request: CorrectionRequest, user: User, db: Session):
        entity = None
        old_val = None

        if request.entity_type == "medication":
            entity = db.query(MedicationRecord).filter(
                MedicationRecord.id == request.entity_id,
                MedicationRecord.user_id == user.id
            ).first()
            if entity and hasattr(entity, request.field_name):
                old_val = str(getattr(entity, request.field_name))
                setattr(entity, request.field_name, request.new_value)
                entity.verification_status = "verified"

        elif request.entity_type == "lab_result":
            entity = db.query(LabResultRecord).filter(
                LabResultRecord.id == request.entity_id,
                LabResultRecord.user_id == user.id
            ).first()
            if entity and hasattr(entity, request.field_name):
                old_val = str(getattr(entity, request.field_name))
                setattr(entity, request.field_name, request.new_value)
                entity.verification_status = "verified"

        elif request.entity_type == "diagnosis":
            entity = db.query(DiagnosisRecord).filter(
                DiagnosisRecord.id == request.entity_id,
                DiagnosisRecord.user_id == user.id
            ).first()
            if entity and hasattr(entity, request.field_name):
                old_val = str(getattr(entity, request.field_name))
                setattr(entity, request.field_name, request.new_value)
                entity.verification_status = "verified"

        elif request.entity_type == "document":
            entity = db.query(MedicalDocument).filter(
                MedicalDocument.id == request.entity_id,
                MedicalDocument.user_id == user.id
            ).first()
            if entity and hasattr(entity, request.field_name):
                old_val = str(getattr(entity, request.field_name))
                setattr(entity, request.field_name, request.new_value)

        if not entity:
            raise HTTPException(status_code=404, detail="Entity record not found for correction")

        corr = VerificationCorrection(
            id=str(uuid.uuid4()),
            user_id=user.id,
            entity_type=request.entity_type,
            entity_id=request.entity_id,
            field_name=request.field_name,
            old_value=old_val,
            new_value=request.new_value,
            reason=request.reason,
            corrected_by=user.full_name,
            corrected_at=datetime.datetime.utcnow()
        )
        db.add(corr)

        audit = AuditEvent(
            id=str(uuid.uuid4()),
            user_id=user.id,
            action="correct_record",
            entity_type=request.entity_type,
            entity_id=request.entity_id,
            details={"field": request.field_name, "old": old_val, "new": request.new_value}
        )
        db.add(audit)
        db.commit()

        return {"status": "success", "correction_id": corr.id, "entity_id": request.entity_id}

    @staticmethod
    def update_verification_status(req: VerificationActionRequest, user: User, db: Session):
        model_map = {
            "medication": MedicationRecord,
            "lab_result": LabResultRecord,
            "diagnosis": DiagnosisRecord
        }
        model = model_map.get(req.entity_type)
        if not model:
            raise HTTPException(status_code=400, detail="Invalid entity type")

        record = db.query(model).filter(model.id == req.entity_id, model.user_id == user.id).first()
        if not record:
            raise HTTPException(status_code=404, detail="Record not found")

        record.verification_status = req.status
        db.commit()
        return {"status": "updated", "new_verification_status": req.status}

verification_service = VerificationService()
