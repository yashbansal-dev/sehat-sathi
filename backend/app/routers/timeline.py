from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.all_models import (
    User,
    MedicalTimelineEvent,
    MedicalDocument,
    MedicationRecord,
    LabResultRecord,
    DiagnosisRecord,
    UncertaintyRecord
)
from app.schemas.all_schemas import TimelineEventOut
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/api/timeline", tags=["Timeline"])

@router.get("", response_model=List[TimelineEventOut])
def get_timeline(
    event_type: Optional[str] = Query(None, description="Visit, Prescription, Lab Test, Discharge, Hospitalization, etc."),
    verification_status: Optional[str] = Query(None, description="verified, unverified, flagged"),
    search: Optional[str] = Query(None, description="Search term in title or description"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(MedicalTimelineEvent).filter(MedicalTimelineEvent.user_id == current_user.id)

    if event_type and event_type != "All":
        query = query.filter(MedicalTimelineEvent.event_type == event_type)

    if verification_status and verification_status != "All":
        query = query.filter(MedicalTimelineEvent.verification_status == verification_status)

    if search:
        s = f"%{search}%"
        query = query.filter(
            (MedicalTimelineEvent.title.ilike(s)) |
            (MedicalTimelineEvent.description.ilike(s)) |
            (MedicalTimelineEvent.facility_or_doctor.ilike(s))
        )

    events = query.order_by(MedicalTimelineEvent.event_date.desc()).all()

    # Preload document names for source reference display
    doc_map = {d.id: d.original_filename for d in db.query(MedicalDocument).filter(MedicalDocument.user_id == current_user.id).all()}

    results = []
    for ev in events:
        ev_dict = {
            "id": ev.id,
            "document_id": ev.document_id,
            "event_date": ev.event_date,
            "event_type": ev.event_type,
            "title": ev.title,
            "description": ev.description,
            "facility_or_doctor": ev.facility_or_doctor,
            "source_page": ev.source_page,
            "source_snippet": ev.source_snippet,
            "verification_status": ev.verification_status,
            "created_at": ev.created_at,
            "document_name": doc_map.get(ev.document_id, "Source Document") if ev.document_id else None
        }
        results.append(ev_dict)

    return results


@router.get("/stats")
def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Real database-backed stats for the Patient Dashboard.
    """
    total_docs = db.query(MedicalDocument).filter(MedicalDocument.user_id == current_user.id).count()
    completed_docs = db.query(MedicalDocument).filter(
        MedicalDocument.user_id == current_user.id,
        MedicalDocument.status == "completed"
    ).count()

    total_events = db.query(MedicalTimelineEvent).filter(MedicalTimelineEvent.user_id == current_user.id).count()
    
    verified_meds = db.query(MedicationRecord).filter(
        MedicationRecord.user_id == current_user.id,
        MedicationRecord.verification_status == "verified"
    ).count()
    verified_labs = db.query(LabResultRecord).filter(
        LabResultRecord.user_id == current_user.id,
        LabResultRecord.verification_status == "verified"
    ).count()
    verified_records_count = verified_meds + verified_labs

    active_meds = db.query(MedicationRecord).filter(
        MedicationRecord.user_id == current_user.id,
        MedicationRecord.is_current == True
    ).count()

    abnormal_labs = db.query(LabResultRecord).filter(
        LabResultRecord.user_id == current_user.id,
        LabResultRecord.is_abnormal == True
    ).count()

    unresolved_uncertainties = db.query(UncertaintyRecord).filter(
        UncertaintyRecord.user_id == current_user.id,
        UncertaintyRecord.resolved == False
    ).count()

    recent_uploads = db.query(MedicalDocument).filter(
        MedicalDocument.user_id == current_user.id
    ).order_by(MedicalDocument.created_at.desc()).limit(4).all()

    recent_events = db.query(MedicalTimelineEvent).filter(
        MedicalTimelineEvent.user_id == current_user.id
    ).order_by(MedicalTimelineEvent.event_date.desc()).limit(4).all()

    return {
        "total_documents": total_docs,
        "processed_documents": completed_docs,
        "verified_records_count": verified_records_count,
        "records_requiring_review": unresolved_uncertainties,
        "total_timeline_events": total_events,
        "active_medications": active_meds,
        "abnormal_lab_results": abnormal_labs,
        "recent_uploads": recent_uploads,
        "recent_events": recent_events
    }


@router.get("/lab-trends")
def get_lab_trends(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns structured timeseries of key biomarkers (HbA1c, Glucose, Blood Pressure, Cholesterol)
    for interactive Recharts data visualization.
    """
    labs = db.query(LabResultRecord).filter(
        LabResultRecord.user_id == current_user.id,
        LabResultRecord.numeric_value.isnot(None)
    ).order_by(LabResultRecord.test_date.asc()).all()

    trends: dict[str, list] = {}
    for l in labs:
        if l.test_name not in trends:
            trends[l.test_name] = []
        trends[l.test_name].append({
            "date": l.test_date or "Recorded",
            "value": l.numeric_value,
            "unit": l.unit,
            "is_abnormal": l.is_abnormal,
            "reference_range": l.reference_range
        })

    return trends
