from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Any, Dict
from datetime import datetime

# --- Auth Schemas ---
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: Optional[str] = "patient"
    firebase_token: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: Optional[str] = None
    firebase_token: Optional[str] = None

class FirebaseLoginRequest(BaseModel):
    firebase_uid: str
    email: EmailStr
    full_name: Optional[str] = None
    role: Optional[str] = "patient"

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

class PatientProfileUpdate(BaseModel):
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    emergency_contact: Optional[str] = None
    known_allergies: Optional[str] = None
    chronic_conditions: Optional[str] = None

class PatientProfileOut(BaseModel):
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    emergency_contact: Optional[str] = None
    known_allergies: Optional[str] = None
    chronic_conditions: Optional[str] = None

    class Config:
        from_attributes = True

class UserOut(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    profile: Optional[PatientProfileOut] = None

    class Config:
        from_attributes = True


# --- Document Schemas ---
class DocumentOut(BaseModel):
    id: str
    filename: str
    original_filename: str
    file_type: str
    file_size: int
    category: str
    document_date: Optional[str] = None
    facility_name: Optional[str] = None
    doctor_name: Optional[str] = None
    status: str
    ocr_confidence: Optional[float] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class DocumentProcessingStatusOut(BaseModel):
    document_id: str
    status: str
    stage_message: Optional[str] = None
    ocr_confidence: Optional[float] = None
    error_message: Optional[str] = None


# --- Extracted Entities Schemas ---
class ExtractedMedication(BaseModel):
    medicine_name: str
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    duration: Optional[str] = None
    is_current: bool = False
    status: str = "unverified"
    prescribed_date: Optional[str] = None
    indication: Optional[str] = None
    source_page: int = 1
    source_snippet: Optional[str] = None
    confidence: float = 0.9

class ExtractedLabResult(BaseModel):
    test_name: str
    result_value: str
    numeric_value: Optional[float] = None
    unit: Optional[str] = None
    reference_range: Optional[str] = None
    is_abnormal: bool = False
    test_date: Optional[str] = None
    source_page: int = 1
    source_snippet: Optional[str] = None
    confidence: float = 0.9

class ExtractedDiagnosis(BaseModel):
    condition_name: str
    diagnosed_date: Optional[str] = None
    is_chronic: bool = False
    status: str = "active"
    source_page: int = 1
    source_snippet: Optional[str] = None
    confidence: float = 0.9

class ExtractedEvent(BaseModel):
    title: str
    event_date: Optional[str] = None
    event_type: str
    description: Optional[str] = None
    facility_or_doctor: Optional[str] = None
    source_page: int = 1
    source_snippet: Optional[str] = None

class ExtractedUncertainty(BaseModel):
    entity_type: str
    field_name: str
    detected_value: Optional[str] = None
    reason: str
    suggested_options: Optional[List[str]] = None

class ExtractionPayload(BaseModel):
    document_type: str
    document_date: Optional[str] = None
    facility_name: Optional[str] = None
    doctor_name: Optional[str] = None
    events: List[ExtractedEvent] = []
    medications: List[ExtractedMedication] = []
    lab_results: List[ExtractedLabResult] = []
    diagnoses_recorded: List[ExtractedDiagnosis] = []
    uncertainties: List[ExtractedUncertainty] = []
    source_references: List[str] = []


# --- Timeline Schemas ---
class TimelineEventOut(BaseModel):
    id: str
    document_id: Optional[str] = None
    event_date: str
    event_type: str
    title: str
    description: Optional[str] = None
    facility_or_doctor: Optional[str] = None
    source_page: int = 1
    source_snippet: Optional[str] = None
    verification_status: str
    created_at: datetime
    document_name: Optional[str] = None

    class Config:
        from_attributes = True


# --- Two-Minute Doctor Brief Schemas ---
class MedicationBriefItem(BaseModel):
    id: str
    medicine_name: str
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    status: str
    prescribed_date: Optional[str] = None
    source_document_id: Optional[str] = None
    source_document_name: Optional[str] = None
    source_page: int = 1
    source_snippet: Optional[str] = None
    verification_status: str

class LabResultBriefItem(BaseModel):
    id: str
    test_name: str
    result_value: str
    numeric_value: Optional[float] = None
    unit: Optional[str] = None
    reference_range: Optional[str] = None
    is_abnormal: bool
    test_date: Optional[str] = None
    source_document_id: Optional[str] = None
    source_document_name: Optional[str] = None
    source_page: int = 1
    source_snippet: Optional[str] = None

class DiagnosisBriefItem(BaseModel):
    id: str
    condition_name: str
    diagnosed_date: Optional[str] = None
    is_chronic: bool
    status: str
    source_document_id: Optional[str] = None
    source_document_name: Optional[str] = None
    source_page: int = 1
    verification_status: str

class DoctorBriefingOut(BaseModel):
    generated_at: str
    patient_info: Dict[str, Any]
    clinical_narrative: str
    documented_allergies: List[str]
    chronic_conditions: List[str]
    active_medications: List[MedicationBriefItem]
    historical_or_unverified_medications: List[MedicationBriefItem]
    recent_lab_results: List[LabResultBriefItem]
    major_hospital_or_clinic_visits: List[Dict[str, Any]]
    conflicting_or_uncertain_records: List[Dict[str, Any]]
    questions_for_clinician: List[str]
    evidence_coverage: Dict[str, Any]
    hindi_explanation: Optional[str] = None
    english_patient_explanation: Optional[str] = None
    clinical_contradictions: List[Dict[str, Any]] = []
    reliability_scorecard: Dict[str, Any] = {}


# --- Verification & Corrections ---
class UncertaintyOut(BaseModel):
    id: str
    document_id: str
    document_name: Optional[str] = None
    entity_type: str
    field_name: str
    detected_value: Optional[str] = None
    reason: str
    suggested_options: Optional[List[str]] = None
    resolved: bool
    resolved_value: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class CorrectionRequest(BaseModel):
    entity_type: str
    entity_id: str
    field_name: str
    new_value: str
    reason: Optional[str] = "Manual user verification"

class VerificationActionRequest(BaseModel):
    entity_type: str
    entity_id: str
    status: str  # verified, flagged, unverified


# --- Sharing Schemas ---
class CreateShareTokenRequest(BaseModel):
    title: str
    doctor_name_or_purpose: Optional[str] = None
    duration_hours: int = 24  # default 24h
    allowed_document_ids: Optional[List[str]] = None
    include_briefing: bool = True

class ShareTokenOut(BaseModel):
    id: str
    token: str
    title: str
    doctor_name_or_purpose: Optional[str] = None
    expires_at: datetime
    is_revoked: bool
    share_url: str
    include_briefing: bool
    allowed_documents_count: int
    created_at: datetime

    class Config:
        from_attributes = True

class DoctorSharedDataOut(BaseModel):
    token_valid: bool
    expires_at: datetime
    doctor_name_or_purpose: Optional[str] = None
    patient_name: str
    briefing: Optional[DoctorBriefingOut] = None
    timeline: List[TimelineEventOut] = []
    documents: List[DocumentOut] = []
