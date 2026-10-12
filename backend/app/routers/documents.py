import os
import uuid
import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.all_models import (
    User,
    MedicalDocument,
    DocumentProcessingJob,
    MedicalTimelineEvent,
    MedicationRecord,
    LabResultRecord,
    DiagnosisRecord,
    UncertaintyRecord,
    AuditEvent
)
from app.schemas.all_schemas import DocumentOut, DocumentProcessingStatusOut
from app.services.auth_service import get_current_user
from app.services.storage_service import storage_service
from app.services.ocr_service import ocr_service
from app.services.ai_extraction_service import ai_extraction_service

router = APIRouter(prefix="/api/documents", tags=["Documents"])

async def process_document_pipeline(document_id: str, db_session_factory):
    """
    Background worker pipeline for OCR text extraction & AI structured entity parsing.
    """
    db: Session = db_session_factory()
    try:
        doc = db.query(MedicalDocument).filter(MedicalDocument.id == document_id).first()
        if not doc:
            return

        job = db.query(DocumentProcessingJob).filter(DocumentProcessingJob.document_id == document_id).first()
        if not job:
            job = DocumentProcessingJob(id=str(uuid.uuid4()), document_id=document_id)
            db.add(job)

        job.status = "ocr_processing"
        job.stage_message = "Extracting text with PyMuPDF / OCR engine..."
        db.commit()

        # Step 1: Run OCR
        ocr_result = ocr_service.extract_text(doc.storage_path, doc.file_type)
        doc.ocr_text = ocr_result.get("full_text", "")
        doc.ocr_confidence = ocr_result.get("confidence", 0.85)
        
        job.status = "ai_extracting"
        job.stage_message = "Analyzing clinical findings and structuring medical records..."
        db.commit()

        # Step 2: Run AI Structured Extraction
        extracted = await ai_extraction_service.extract_medical_information(
            ocr_result,
            doc.original_filename,
            doc.category
        )

        doc.document_date = extracted.document_date
        doc.facility_name = extracted.facility_name
        doc.doctor_name = extracted.doctor_name
        doc.status = "completed"

        # Step 3: Save Medical Timeline Events
        for ev in extracted.events:
            ev_record = MedicalTimelineEvent(
                id=str(uuid.uuid4()),
                user_id=doc.user_id,
                document_id=doc.id,
                event_date=ev.event_date or doc.document_date or datetime.date.today().isoformat(),
                event_type=ev.event_type,
                title=ev.title,
                description=ev.description,
                facility_or_doctor=ev.facility_or_doctor or doc.facility_name or doc.doctor_name,
                source_page=ev.source_page,
                source_snippet=ev.source_snippet,
                verification_status="unverified"
            )
            db.add(ev_record)

        # Step 4: Save Medications
        for med in extracted.medications:
            m_record = MedicationRecord(
                id=str(uuid.uuid4()),
                user_id=doc.user_id,
                document_id=doc.id,
                medicine_name=med.medicine_name,
                dosage=med.dosage,
                frequency=med.frequency,
                duration=med.duration,
                is_current=med.is_current,
                status=med.status,
                prescribed_date=med.prescribed_date or doc.document_date,
                indication=med.indication,
                source_page=med.source_page,
                source_snippet=med.source_snippet,
                verification_status="unverified"
            )
            db.add(m_record)

        # Step 5: Save Lab Results
        for lab in extracted.lab_results:
            l_record = LabResultRecord(
                id=str(uuid.uuid4()),
                user_id=doc.user_id,
                document_id=doc.id,
                test_name=lab.test_name,
                result_value=lab.result_value,
                numeric_value=lab.numeric_value,
                unit=lab.unit,
                reference_range=lab.reference_range,
                is_abnormal=lab.is_abnormal,
                test_date=lab.test_date or doc.document_date,
                source_page=lab.source_page,
                source_snippet=lab.source_snippet,
                verification_status="unverified"
            )
            db.add(l_record)

        # Step 6: Save Diagnoses
        for diag in extracted.diagnoses_recorded:
            d_record = DiagnosisRecord(
                id=str(uuid.uuid4()),
                user_id=doc.user_id,
                document_id=doc.id,
                condition_name=diag.condition_name,
                diagnosed_date=diag.diagnosed_date or doc.document_date,
                is_chronic=diag.is_chronic,
                status=diag.status,
                source_page=diag.source_page,
                source_snippet=diag.source_snippet,
                verification_status="unverified"
            )
            db.add(d_record)

        # Step 7: Save Flagged Uncertainties
        for unc in extracted.uncertainties:
            u_record = UncertaintyRecord(
                id=str(uuid.uuid4()),
                user_id=doc.user_id,
                document_id=doc.id,
                entity_type=unc.entity_type,
                field_name=unc.field_name,
                detected_value=unc.detected_value,
                reason=unc.reason,
                suggested_options=unc.suggested_options,
                resolved=False
            )
            db.add(u_record)

        job.status = "completed"
        job.stage_message = "Extraction complete and synchronized with health timeline."
        job.completed_at = datetime.datetime.utcnow()

        db.commit()

    except Exception as e:
        db.rollback()
        doc = db.query(MedicalDocument).filter(MedicalDocument.id == document_id).first()
        if doc:
            doc.status = "failed"
        job = db.query(DocumentProcessingJob).filter(DocumentProcessingJob.document_id == document_id).first()
        if job:
            job.status = "failed"
            job.error_message = str(e)
        db.commit()
    finally:
        db.close()


@router.post("/upload")
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    category: str = Form("Other"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    stored_name, path, size = await storage_service.save_uploaded_file(file, current_user.id)
    doc_id = str(uuid.uuid4())

    doc = MedicalDocument(
        id=doc_id,
        user_id=current_user.id,
        filename=stored_name,
        original_filename=file.filename or "uploaded_document",
        file_type=file.content_type or "application/octet-stream",
        file_size=size,
        storage_path=path,
        category=category,
        status="processing",
        created_at=datetime.datetime.utcnow()
    )
    db.add(doc)

    job = DocumentProcessingJob(
        id=str(uuid.uuid4()),
        document_id=doc_id,
        status="pending",
        stage_message="Queued for text extraction and AI parsing"
    )
    db.add(job)

    # Audit upload
    audit = AuditEvent(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        action="upload_document",
        entity_type="document",
        entity_id=doc_id,
        details={"filename": file.filename, "size": size, "category": category}
    )
    db.add(audit)
    db.commit()
    db.refresh(doc)

    # Trigger processing pipeline
    from app.database import SessionLocal
    background_tasks.add_task(process_document_pipeline, doc_id, SessionLocal)

    return {
        "status": "success",
        "document_id": doc.id,
        "filename": doc.original_filename,
        "category": doc.category,
        "message": "File received securely. Medical extraction started."
    }


@router.get("", response_model=List[DocumentOut])
def list_documents(
    category: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(MedicalDocument).filter(MedicalDocument.user_id == current_user.id)
    if category and category != "All":
        query = query.filter(MedicalDocument.category == category)
    return query.order_by(MedicalDocument.created_at.desc()).all()


@router.get("/{document_id}")
def get_document_details(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(MedicalDocument).filter(
        MedicalDocument.id == document_id,
        MedicalDocument.user_id == current_user.id
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    job = db.query(DocumentProcessingJob).filter(DocumentProcessingJob.document_id == doc.id).first()
    meds = db.query(MedicationRecord).filter(MedicationRecord.document_id == doc.id).all()
    labs = db.query(LabResultRecord).filter(LabResultRecord.document_id == doc.id).all()
    diags = db.query(DiagnosisRecord).filter(DiagnosisRecord.document_id == doc.id).all()
    events = db.query(MedicalTimelineEvent).filter(MedicalTimelineEvent.document_id == doc.id).all()
    uncertainties = db.query(UncertaintyRecord).filter(UncertaintyRecord.document_id == doc.id).all()

    return {
        "document": doc,
        "processing_job": job,
        "extracted_medications": meds,
        "extracted_lab_results": labs,
        "extracted_diagnoses": diags,
        "extracted_events": events,
        "uncertainties": uncertainties
    }


@router.get("/{document_id}/file")
def get_document_file(
    document_id: str,
    token: Optional[str] = None,
    current_user: Optional[User] = Depends(lambda: None),
    db: Session = Depends(get_db)
):
    """Serve private document file with authorization validation and inline PDF rendering"""
    # Authenticate via Bearer header or ?token= query parameter (for iframes)
    user = None
    if token:
        try:
            from app.services.auth_service import decode_access_token
            payload = decode_access_token(token)
            user_id = payload.get("sub")
            if user_id:
                user = db.query(User).filter(User.id == user_id).first()
        except Exception:
            pass

    if not user:
        # Try from dependency / authorization header
        from fastapi import Request
        raise HTTPException(status_code=401, detail="Authentication token required to view document")

    doc = db.query(MedicalDocument).filter(
        MedicalDocument.id == document_id,
        MedicalDocument.user_id == user.id
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    path = storage_service.get_secure_file_path(doc.storage_path)
    
    # Determine media type and inline disposition
    ext = os.path.splitext(doc.filename)[1].lower()
    media_type = "application/pdf" if ext == ".pdf" else ("image/png" if ext == ".png" else "image/jpeg")
    
    return FileResponse(
        path,
        media_type=media_type,
        content_disposition_type="inline",
        filename=doc.original_filename
    )


@router.post("/{document_id}/retry")
def retry_document_processing(
    document_id: str,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(MedicalDocument).filter(
        MedicalDocument.id == document_id,
        MedicalDocument.user_id == current_user.id
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    doc.status = "processing"
    db.commit()

    from app.database import SessionLocal
    background_tasks.add_task(process_document_pipeline, doc.id, SessionLocal)
    return {"status": "retry_scheduled", "document_id": doc.id}


@router.delete("/{document_id}")
def delete_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(MedicalDocument).filter(
        MedicalDocument.id == document_id,
        MedicalDocument.user_id == current_user.id
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Clean file from disk if exists
    try:
        if os.path.exists(doc.storage_path):
            os.remove(doc.storage_path)
    except Exception:
        pass

    db.delete(doc)
    
    audit = AuditEvent(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        action="delete_document",
        entity_type="document",
        entity_id=document_id,
        details={"filename": doc.original_filename}
    )
    db.add(audit)
    db.commit()

    return {"status": "deleted", "document_id": document_id}
