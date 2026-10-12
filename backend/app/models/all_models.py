import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=True)
    firebase_uid = Column(String, unique=True, index=True, nullable=True)
    full_name = Column(String, nullable=False)
    role = Column(String, default="patient")  # patient, doctor, admin
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    profile = relationship("PatientProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    documents = relationship("MedicalDocument", back_populates="user", cascade="all, delete-orphan")
    timeline_events = relationship("MedicalTimelineEvent", back_populates="user", cascade="all, delete-orphan")
    medications = relationship("MedicationRecord", back_populates="user", cascade="all, delete-orphan")
    lab_results = relationship("LabResultRecord", back_populates="user", cascade="all, delete-orphan")
    diagnoses = relationship("DiagnosisRecord", back_populates="user", cascade="all, delete-orphan")
    uncertainties = relationship("UncertaintyRecord", back_populates="user", cascade="all, delete-orphan")
    share_tokens = relationship("DoctorShareToken", back_populates="user", cascade="all, delete-orphan")
    audit_events = relationship("AuditEvent", back_populates="user", cascade="all, delete-orphan")


class PatientProfile(Base):
    __tablename__ = "patient_profiles"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), unique=True, nullable=False)
    date_of_birth = Column(String, nullable=True)
    gender = Column(String, nullable=True)
    blood_group = Column(String, nullable=True)
    emergency_contact = Column(String, nullable=True)
    known_allergies = Column(Text, nullable=True)  # JSON or comma-separated
    chronic_conditions = Column(Text, nullable=True)
    
    user = relationship("User", back_populates="profile")


class MedicalDocument(Base):
    __tablename__ = "medical_documents"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    filename = Column(String, nullable=False)
    original_filename = Column(String, nullable=False)
    file_type = Column(String, nullable=False)  # pdf, png, jpg
    file_size = Column(Integer, nullable=False)
    storage_path = Column(String, nullable=False)
    category = Column(String, default="Other")  # Prescription, Lab Report, Discharge Summary, Doctor Notes, Other
    document_date = Column(String, nullable=True)
    facility_name = Column(String, nullable=True)
    doctor_name = Column(String, nullable=True)
    status = Column(String, default="uploaded")  # uploaded, processing, completed, failed
    ocr_text = Column(Text, nullable=True)
    ocr_confidence = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="documents")
    processing_jobs = relationship("DocumentProcessingJob", back_populates="document", cascade="all, delete-orphan")
    timeline_events = relationship("MedicalTimelineEvent", back_populates="document", cascade="all, delete-orphan")
    medications = relationship("MedicationRecord", back_populates="document", cascade="all, delete-orphan")
    lab_results = relationship("LabResultRecord", back_populates="document", cascade="all, delete-orphan")
    diagnoses = relationship("DiagnosisRecord", back_populates="document", cascade="all, delete-orphan")
    uncertainties = relationship("UncertaintyRecord", back_populates="document", cascade="all, delete-orphan")


class DocumentProcessingJob(Base):
    __tablename__ = "document_processing_jobs"

    id = Column(String, primary_key=True, index=True)
    document_id = Column(String, ForeignKey("medical_documents.id"), nullable=False, index=True)
    status = Column(String, default="pending")  # pending, ocr_done, ai_extracting, completed, failed
    stage_message = Column(String, nullable=True)
    error_message = Column(Text, nullable=True)
    started_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    document = relationship("MedicalDocument", back_populates="processing_jobs")


class MedicalTimelineEvent(Base):
    __tablename__ = "medical_timeline_events"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    document_id = Column(String, ForeignKey("medical_documents.id"), nullable=True, index=True)
    event_date = Column(String, nullable=False, index=True)  # YYYY-MM-DD or approx
    event_type = Column(String, nullable=False)  # Visit, Prescription, Lab Test, Discharge, Diagnosis, Other
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    facility_or_doctor = Column(String, nullable=True)
    source_page = Column(Integer, default=1)
    source_snippet = Column(Text, nullable=True)
    verification_status = Column(String, default="unverified")  # unverified, verified, flagged
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="timeline_events")
    document = relationship("MedicalDocument", back_populates="timeline_events")


class MedicationRecord(Base):
    __tablename__ = "medication_records"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    document_id = Column(String, ForeignKey("medical_documents.id"), nullable=True, index=True)
    medicine_name = Column(String, nullable=False, index=True)
    dosage = Column(String, nullable=True)  # e.g., 500mg
    frequency = Column(String, nullable=True)  # e.g., Twice daily after meals
    duration = Column(String, nullable=True)  # e.g., 14 days
    is_current = Column(Boolean, default=False)
    status = Column(String, default="unverified")  # active, historical, unverified
    prescribed_date = Column(String, nullable=True)
    indication = Column(String, nullable=True)
    source_page = Column(Integer, default=1)
    source_snippet = Column(Text, nullable=True)
    verification_status = Column(String, default="unverified")

    user = relationship("User", back_populates="medications")
    document = relationship("MedicalDocument", back_populates="medications")


class LabResultRecord(Base):
    __tablename__ = "lab_result_records"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    document_id = Column(String, ForeignKey("medical_documents.id"), nullable=True, index=True)
    test_name = Column(String, nullable=False, index=True)  # e.g., HbA1c, Fasting Blood Glucose, Serum Creatinine
    result_value = Column(String, nullable=False)  # e.g., "7.4" or "Positive"
    numeric_value = Column(Float, nullable=True)  # for Recharts trend plotting
    unit = Column(String, nullable=True)  # %, mg/dL
    reference_range = Column(String, nullable=True)  # e.g., 4.0 - 5.6
    is_abnormal = Column(Boolean, default=False)
    test_date = Column(String, nullable=True, index=True)
    source_page = Column(Integer, default=1)
    source_snippet = Column(Text, nullable=True)
    verification_status = Column(String, default="unverified")

    user = relationship("User", back_populates="lab_results")
    document = relationship("MedicalDocument", back_populates="lab_results")


class DiagnosisRecord(Base):
    __tablename__ = "diagnosis_records"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    document_id = Column(String, ForeignKey("medical_documents.id"), nullable=True, index=True)
    condition_name = Column(String, nullable=False, index=True)  # e.g., Essential Hypertension, Type 2 Diabetes
    diagnosed_date = Column(String, nullable=True)
    is_chronic = Column(Boolean, default=False)
    status = Column(String, default="active")  # active, resolved, provisional
    source_page = Column(Integer, default=1)
    source_snippet = Column(Text, nullable=True)
    verification_status = Column(String, default="unverified")

    user = relationship("User", back_populates="diagnoses")
    document = relationship("MedicalDocument", back_populates="diagnoses")


class UncertaintyRecord(Base):
    __tablename__ = "uncertainty_records"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    document_id = Column(String, ForeignKey("medical_documents.id"), nullable=False, index=True)
    entity_type = Column(String, nullable=False)  # medication, lab_result, diagnosis, document_date
    field_name = Column(String, nullable=False)  # dosage, medicine_name, date, etc.
    detected_value = Column(String, nullable=True)
    reason = Column(String, nullable=False)  # "Low OCR confidence", "Conflicting date with visit", etc.
    suggested_options = Column(JSON, nullable=True)  # ["500mg", "650mg"]
    resolved = Column(Boolean, default=False)
    resolved_value = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="uncertainties")
    document = relationship("MedicalDocument", back_populates="uncertainties")


class DoctorShareToken(Base):
    __tablename__ = "doctor_share_tokens"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    token = Column(String, unique=True, index=True, nullable=False)
    title = Column(String, nullable=False)  # e.g., "Consultation with Dr. Verma"
    doctor_name_or_purpose = Column(String, nullable=True)
    expires_at = Column(DateTime, nullable=False)
    is_revoked = Column(Boolean, default=False)
    allowed_document_ids = Column(JSON, nullable=True)  # null = all documents, or list of ids
    include_briefing = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="share_tokens")
    access_audits = relationship("DoctorAccessAudit", back_populates="share_token", cascade="all, delete-orphan")


class DoctorAccessAudit(Base):
    __tablename__ = "doctor_access_audits"

    id = Column(String, primary_key=True, index=True)
    share_token_id = Column(String, ForeignKey("doctor_share_tokens.id"), nullable=False, index=True)
    accessed_at = Column(DateTime, default=datetime.datetime.utcnow)
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    action = Column(String, nullable=False)  # view_briefing, view_timeline, view_document
    resource_id = Column(String, nullable=True)

    share_token = relationship("DoctorShareToken", back_populates="access_audits")


class VerificationCorrection(Base):
    __tablename__ = "verification_corrections"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    entity_type = Column(String, nullable=False)  # medication, lab_result, diagnosis, event, document
    entity_id = Column(String, nullable=False, index=True)
    field_name = Column(String, nullable=False)
    old_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    reason = Column(String, nullable=True)
    corrected_by = Column(String, nullable=False)
    corrected_at = Column(DateTime, default=datetime.datetime.utcnow)


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    action = Column(String, nullable=False)  # upload, delete, verify, correct, share_create, share_revoke, view
    entity_type = Column(String, nullable=True)
    entity_id = Column(String, nullable=True)
    details = Column(JSON, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="audit_events")
