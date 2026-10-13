import os
import datetime
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.all_models import (
    User,
    DoctorShareToken,
    MedicalDocument
)
from app.schemas.all_schemas import (
    CreateShareTokenRequest,
    ShareTokenOut,
    DoctorSharedDataOut
)
from app.services.auth_service import get_current_user
from app.services.sharing_service import sharing_service
from app.services.storage_service import storage_service

router = APIRouter(prefix="/api/sharing", tags=["Sharing"])

@router.post("/tokens", response_model=ShareTokenOut)
def create_share_token(
    req: CreateShareTokenRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    token_obj = sharing_service.create_share_token(req, current_user, db)
    return {
        "id": token_obj.id,
        "token": token_obj.token,
        "title": token_obj.title,
        "doctor_name_or_purpose": token_obj.doctor_name_or_purpose,
        "expires_at": token_obj.expires_at,
        "is_revoked": token_obj.is_revoked,
        "share_url": f"/doctor-portal/{token_obj.token}",
        "include_briefing": token_obj.include_briefing,
        "allowed_documents_count": len(token_obj.allowed_document_ids) if token_obj.allowed_document_ids else 0,
        "created_at": token_obj.created_at
    }

@router.get("/tokens", response_model=List[ShareTokenOut])
def list_share_tokens(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tokens = sharing_service.list_user_tokens(current_user, db)
    results = []
    for t in tokens:
        results.append({
            "id": t.id,
            "token": t.token,
            "title": t.title,
            "doctor_name_or_purpose": t.doctor_name_or_purpose,
            "expires_at": t.expires_at,
            "is_revoked": t.is_revoked,
            "share_url": f"/doctor-portal/{t.token}",
            "include_briefing": t.include_briefing,
            "allowed_documents_count": len(t.allowed_document_ids) if t.allowed_document_ids else 0,
            "created_at": t.created_at
        })
    return results

@router.post("/tokens/{token_id}/revoke")
def revoke_share_token(
    token_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    success = sharing_service.revoke_share_token(token_id, current_user, db)
    return {"status": "revoked", "token_id": token_id}

@router.get("/doctor-view/{token_str}", response_model=DoctorSharedDataOut)
def doctor_view_portal(
    token_str: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Publicly reachable endpoint for authorized clinicians bearing a valid time-limited token.
    Enforces authorization, audit logs access, and isolates data.
    """
    return sharing_service.validate_and_access_shared_data(token_str, request, db)

@router.get("/doctor-file/{token_str}/{doc_id}")
def doctor_view_document_file(
    token_str: str,
    doc_id: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Allows the authorized clinician to view the source document linked to a finding.
    Validates token validity and document permission before serving.
    """
    token_obj = db.query(DoctorShareToken).filter(DoctorShareToken.token == token_str).first()
    if not token_obj:
        raise HTTPException(status_code=404, detail="Invalid or non-existent share link")
    if token_obj.is_revoked:
        raise HTTPException(status_code=410, detail="This shared doctor access link has been revoked by the patient")
    if token_obj.expires_at < datetime.datetime.utcnow():
        raise HTTPException(status_code=410, detail="This shared doctor access link has expired")

    if token_obj.allowed_document_ids and doc_id not in token_obj.allowed_document_ids:
        raise HTTPException(status_code=403, detail="Document not included in this patient share authorization")

    # Record access audit for doctor viewing source document
    try:
        import uuid
        from app.models.all_models import DoctorAccessAudit
        client_ip = request.client.host if request.client else "unknown"
        user_agent = request.headers.get("user-agent", "unknown")
        doc_audit = DoctorAccessAudit(
            id=str(uuid.uuid4()),
            share_token_id=token_obj.id,
            accessed_at=datetime.datetime.utcnow(),
            ip_address=client_ip,
            user_agent=user_agent,
            action="view_document",
            resource_id=doc_id
        )
        db.add(doc_audit)
        db.commit()
    except Exception as e:
        db.rollback()

    doc = db.query(MedicalDocument).filter(
        MedicalDocument.id == doc_id,
        MedicalDocument.user_id == token_obj.user_id
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Medical document not found")

    path = storage_service.get_secure_file_path(doc.storage_path)
    if os.path.exists(path):
        ext = os.path.splitext(doc.filename)[1].lower() if hasattr(doc, 'filename') else ".pdf"
        media_type = "application/pdf" if ext == ".pdf" else ("image/png" if ext == ".png" else "image/jpeg")
        return FileResponse(
            path,
            media_type=media_type,
            content_disposition_type="inline",
            filename=doc.original_filename
        )

    # Fallback for synthetic / sample seed documents
    candidates = [
        os.path.join(os.getcwd(), "sample_medical_documents"),
        os.path.join(os.path.dirname(os.getcwd()), "sample_medical_documents"),
        os.path.join(os.getcwd(), "storage", "synthetic"),
    ]
    for c in candidates:
        if os.path.exists(c):
            # check exact match or any sample pdf
            match_file = os.path.join(c, doc.original_filename or "")
            if os.path.exists(match_file):
                return FileResponse(match_file, media_type="application/pdf", content_disposition_type="inline", filename=doc.original_filename)
            available = [f for f in os.listdir(c) if f.endswith(".pdf")]
            if available:
                fallback_file = os.path.join(c, available[0])
                return FileResponse(fallback_file, media_type="application/pdf", content_disposition_type="inline", filename=available[0])

    raise HTTPException(status_code=404, detail="Document file not found")
