import uuid
import secrets
import datetime
from fastapi import HTTPException, Request
from sqlalchemy.orm import Session
from app.models.all_models import (
    User,
    DoctorShareToken,
    DoctorAccessAudit,
    AuditEvent,
    MedicalDocument,
    MedicalTimelineEvent
)
from app.schemas.all_schemas import CreateShareTokenRequest
from app.services.briefing_service import briefing_service

class SharingService:
    @staticmethod
    def create_share_token(req: CreateShareTokenRequest, user: User, db: Session) -> DoctorShareToken:
        token_str = secrets.token_urlsafe(32)
        token_id = str(uuid.uuid4())
        expires_at = datetime.datetime.utcnow() + datetime.timedelta(hours=req.duration_hours)

        share_token = DoctorShareToken(
            id=token_id,
            user_id=user.id,
            token=token_str,
            title=req.title,
            doctor_name_or_purpose=req.doctor_name_or_purpose,
            expires_at=expires_at,
            is_revoked=False,
            allowed_document_ids=req.allowed_document_ids,
            include_briefing=req.include_briefing,
            created_at=datetime.datetime.utcnow()
        )
        db.add(share_token)

        audit = AuditEvent(
            id=str(uuid.uuid4()),
            user_id=user.id,
            action="create_doctor_share",
            entity_type="share_token",
            entity_id=token_id,
            details={"title": req.title, "expires_at": expires_at.isoformat()}
        )
        db.add(audit)
        db.commit()
        db.refresh(share_token)
        return share_token

    @staticmethod
    def revoke_share_token(token_id: str, user: User, db: Session) -> bool:
        token_obj = db.query(DoctorShareToken).filter(
            DoctorShareToken.id == token_id,
            DoctorShareToken.user_id == user.id
        ).first()

        if not token_obj:
            raise HTTPException(status_code=404, detail="Share token not found")

        token_obj.is_revoked = True
        
        audit = AuditEvent(
            id=str(uuid.uuid4()),
            user_id=user.id,
            action="revoke_doctor_share",
            entity_type="share_token",
            entity_id=token_obj.id,
            details={"revoked_at": datetime.datetime.utcnow().isoformat()}
        )
        db.add(audit)
        db.commit()
        return True

    @staticmethod
    def list_user_tokens(user: User, db: Session):
        return db.query(DoctorShareToken).filter(DoctorShareToken.user_id == user.id).order_by(DoctorShareToken.created_at.desc()).all()

    @staticmethod
    def validate_and_access_shared_data(token_str: str, request: Request, db: Session):
        """
        Validates token, checks expiry & revocation, records audit access, and returns allowed data.
        """
        share_token = db.query(DoctorShareToken).filter(DoctorShareToken.token == token_str).first()
        if not share_token:
            raise HTTPException(status_code=404, detail="Invalid or non-existent share link")

        if share_token.is_revoked:
            raise HTTPException(status_code=410, detail="This shared doctor access link has been revoked by the patient")

        if share_token.expires_at < datetime.datetime.utcnow():
            raise HTTPException(status_code=410, detail="This shared doctor access link has expired")

        # Record Doctor Access Audit
        client_ip = request.client.host if request.client else "unknown"
        user_agent = request.headers.get("user-agent", "unknown")

        audit = DoctorAccessAudit(
            id=str(uuid.uuid4()),
            share_token_id=share_token.id,
            accessed_at=datetime.datetime.utcnow(),
            ip_address=client_ip,
            user_agent=user_agent,
            action="view_portal"
        )
        db.add(audit)
        db.commit()

        # Load permitted patient data
        user = db.query(User).filter(User.id == share_token.user_id).first()
        
        briefing = None
        if share_token.include_briefing:
            briefing = briefing_service.generate_briefing(user, db)

        # Timeline events
        timeline_query = db.query(MedicalTimelineEvent).filter(MedicalTimelineEvent.user_id == user.id)
        if share_token.allowed_document_ids:
            timeline_query = timeline_query.filter(MedicalTimelineEvent.document_id.in_(share_token.allowed_document_ids))
        timeline = timeline_query.order_by(MedicalTimelineEvent.event_date.desc()).all()

        # Documents
        doc_query = db.query(MedicalDocument).filter(MedicalDocument.user_id == user.id)
        if share_token.allowed_document_ids:
            doc_query = doc_query.filter(MedicalDocument.id.in_(share_token.allowed_document_ids))
        docs = doc_query.order_by(MedicalDocument.created_at.desc()).all()

        return {
            "token_valid": True,
            "expires_at": share_token.expires_at,
            "doctor_name_or_purpose": share_token.doctor_name_or_purpose,
            "patient_name": user.full_name,
            "briefing": briefing,
            "timeline": timeline,
            "documents": docs
        }

sharing_service = SharingService()
