export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'patient' | 'doctor' | 'admin';
  created_at?: string;
  profile?: PatientProfile;
}

export interface PatientProfile {
  id?: string;
  user_id?: string;
  date_of_birth?: string;
  gender?: string;
  blood_group?: string;
  emergency_contact?: string;
  known_allergies?: string;
  chronic_conditions?: string;
}

export interface MedicalDocument {
  id: string;
  user_id: string;
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
}

export interface MedicalTimelineEvent {
  id: string;
  user_id: string;
  document_id?: string;
  event_date: string;
  event_type: string;
  title: string;
  description?: string;
  facility_or_doctor?: string;
  source_page?: number;
  source_snippet?: string;
  verification_status: 'unverified' | 'verified' | 'flagged';
  created_at: string;
}

export interface LabResultRecord {
  id: string;
  test_name: string;
  result_value: string;
  numeric_value?: number;
  unit?: string;
  reference_range?: string;
  is_abnormal?: boolean;
  test_date?: string;
  source_snippet?: string;
}

export interface MedicationRecord {
  id: string;
  medicine_name: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  is_current?: boolean;
  status?: string;
  prescribed_date?: string;
  indication?: string;
  source_snippet?: string;
}

export interface UncertaintyRecord {
  id: string;
  document_id: string;
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

export interface ClinicalBriefing {
  patient_info: {
    name: string;
    age?: number | string;
    gender?: string;
    blood_group?: string;
    allergies: string[];
    chronic_conditions: string[];
  };
  critical_alerts: string[];
  active_medications: MedicationRecord[];
  recent_lab_results: LabResultRecord[];
  clinical_trajectory_summary: string;
  provenance_citations: any[];
}
