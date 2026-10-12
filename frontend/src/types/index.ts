export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

export interface PatientProfile {
  date_of_birth?: string;
  gender?: string;
  blood_group?: string;
  emergency_contact?: string;
  known_allergies?: string;
  chronic_conditions?: string;
}

export interface MedicalDocument {
  id: string;
  filename: string;
  original_filename: string;
  file_type: string;
  file_size: number;
  category: string;
  document_date?: string;
  facility_name?: string;
  doctor_name?: string;
  status: 'uploaded' | 'processing' | 'completed' | 'failed';
  ocr_confidence?: number;
  ocr_text?: string;
  created_at: string;
  updated_at: string;
}

export interface TimelineEvent {
  id: string;
  document_id?: string;
  document_name?: string;
  event_date: string;
  event_type: string;
  title: string;
  description?: string;
  facility_or_doctor?: string;
  source_page: number;
  source_snippet?: string;
  verification_status: 'unverified' | 'verified' | 'flagged';
  created_at: string;
}

export interface MedicationBriefItem {
  id: string;
  medicine_name: string;
  dosage?: string;
  frequency?: string;
  status: string;
  prescribed_date?: string;
  source_document_id?: string;
  source_document_name?: string;
  source_page: number;
  source_snippet?: string;
  verification_status: string;
}

export interface LabResultBriefItem {
  id: string;
  test_name: string;
  result_value: string;
  numeric_value?: number;
  unit?: string;
  reference_range?: string;
  is_abnormal: boolean;
  test_date?: string;
  source_document_id?: string;
  source_document_name?: string;
  source_page: number;
  source_snippet?: string;
}

export interface DoctorBriefing {
  generated_at: string;
  patient_info: {
    name: string;
    dob: string;
    gender: string;
    blood_group: string;
    emergency_contact: string;
  };
  clinical_narrative: string;
  documented_allergies: string[];
  chronic_conditions: string[];
  active_medications: MedicationBriefItem[];
  historical_or_unverified_medications: MedicationBriefItem[];
  recent_lab_results: LabResultBriefItem[];
  major_hospital_or_clinic_visits: Array<{
    id: string;
    title: string;
    date: string;
    type: string;
    facility_or_doctor: string;
    description?: string;
    source_document_id?: string;
    source_document_name?: string;
    source_page: number;
  }>;
  conflicting_or_uncertain_records: Array<{
    id: string;
    field: string;
    reason: string;
    detected_value?: string;
    document_name?: string;
    document_id: string;
  }>;
  questions_for_clinician: string[];
  evidence_coverage: {
    total_documents_analyzed: number;
    total_verified_facts: number;
    total_unverified_items: number;
    has_recent_labs: boolean;
    has_discharge_summary: boolean;
  };
  hindi_explanation?: string;
  english_patient_explanation?: string;
  clinical_contradictions?: Array<{
    id: string;
    title: string;
    severity: string;
    finding_a: string;
    finding_b: string;
    clinical_impact: string;
    source_doc_a: string;
    source_doc_b: string;
  }>;
  reliability_scorecard?: {
    source_grounding_rate: string;
    average_ocr_confidence: number;
    verified_facts_ratio: string;
    hallucination_risk: string;
    contradictions_detected: number;
    evidence_linked_claims: number;
  };
}

export interface UncertaintyItem {
  id: string;
  document_id: string;
  document_name?: string;
  entity_type: string;
  field_name: string;
  detected_value?: string;
  reason: string;
  suggested_options?: string[];
  resolved: boolean;
  resolved_value?: string;
  created_at: string;
}

export interface ShareToken {
  id: string;
  token: string;
  title: string;
  doctor_name_or_purpose?: string;
  expires_at: string;
  is_revoked: boolean;
  share_url: string;
  include_briefing: boolean;
  allowed_documents_count: number;
  created_at: string;
}

export interface DashboardStats {
  total_documents: number;
  processed_documents: number;
  verified_records_count: number;
  records_requiring_review: number;
  total_timeline_events: number;
  active_medications: number;
  abnormal_lab_results: number;
  recent_uploads: MedicalDocument[];
  recent_events: TimelineEvent[];
}
