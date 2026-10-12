import { 
  User, 
  DashboardStats, 
  TimelineEvent, 
  MedicalDocument, 
  DoctorBriefing, 
  UncertaintyItem, 
  ShareToken,
  MedicationBriefItem
} from '../types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('sehat_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMsg = 'An error occurred';
    try {
      const errorData = await response.json();
      errorMsg = errorData.detail || errorData.message || JSON.stringify(errorData);
    } catch {
      errorMsg = response.statusText || `HTTP ${response.status}`;
    }
    throw new Error(errorMsg);
  }
  return response.json();
}

// Fallback Mock Data for Standalone Preview (e.g. Vercel deployment without local backend)
const MOCK_PATIENT_USER: User = {
  id: 'demo-patient-1',
  email: 'patient.demo@sehatsathi.ai',
  full_name: 'Rajesh Sharma',
  role: 'patient'
};

const MOCK_DOCTOR_USER: User = {
  id: 'demo-doctor-1',
  email: 'doctor.demo@sehatsathi.ai',
  full_name: 'Dr. Arvind Verma, MD',
  role: 'doctor'
};

const MOCK_DOCUMENTS: MedicalDocument[] = [
  {
    id: 'doc-1',
    filename: 'Dr_Verma_Cardiology_Oct2026.pdf',
    original_filename: 'Dr_Verma_Cardiology_FollowUp_Oct2026.pdf',
    file_type: 'pdf',
    file_size: 142800,
    category: 'Prescription',
    document_date: '2026-10-02',
    created_at: '2026-10-02T10:30:00Z',
    updated_at: '2026-10-02T10:30:00Z',
    status: 'completed',
    ocr_confidence: 0.94
  },
  {
    id: 'doc-2',
    filename: 'Fortis_Discharge_Summary_Sep2026.pdf',
    original_filename: 'Fortis_Discharge_Summary_Sep2026.pdf',
    file_type: 'pdf',
    file_size: 285400,
    category: 'Hospital Discharge',
    document_date: '2026-09-18',
    created_at: '2026-09-18T14:15:00Z',
    updated_at: '2026-09-18T14:15:00Z',
    status: 'completed',
    ocr_confidence: 0.98
  },
  {
    id: 'doc-3',
    filename: 'Apex_Lipid_Panel_Sep2026.pdf',
    original_filename: 'Apex_Diagnostics_Lipid_Metabolic_Sep2026.pdf',
    file_type: 'pdf',
    file_size: 198200,
    category: 'Lab Report',
    document_date: '2026-09-17',
    created_at: '2026-09-17T09:00:00Z',
    updated_at: '2026-09-17T09:00:00Z',
    status: 'completed',
    ocr_confidence: 0.99
  },
  {
    id: 'doc-4',
    filename: 'CityClinic_Rx_Nov2025.pdf',
    original_filename: 'CityClinic_Gastroenteritis_Rx_Nov2025.pdf',
    file_type: 'pdf',
    file_size: 112000,
    category: 'Prescription',
    document_date: '2025-11-12',
    created_at: '2025-11-12T16:45:00Z',
    updated_at: '2025-11-12T16:45:00Z',
    status: 'completed',
    ocr_confidence: 0.88
  }
];

const MOCK_TIMELINE: TimelineEvent[] = [
  {
    id: 'evt-1',
    event_date: '2026-10-02',
    event_type: 'Prescription',
    title: 'Cardiology Follow-Up & Antihypertensive Adjustment',
    facility_or_doctor: 'Dr. Arvind Verma, MD (Max Healthcare)',
    description: 'Telmisartan increased to 40mg daily. Atorvastatin 20mg maintained. BP 134/84.',
    source_page: 1,
    verification_status: 'verified',
    created_at: '2026-10-02T10:30:00Z'
  },
  {
    id: 'evt-2',
    event_date: '2026-09-18',
    event_type: 'Hospital Discharge',
    title: 'Discharge Summary: Hypertensive Urgency & Metabolic Workup',
    facility_or_doctor: 'Fortis Hospital Mohali',
    description: 'Discharged with Metformin 500mg BID and Telmisartan 40mg. Documented Penicillin allergy.',
    source_page: 1,
    verification_status: 'verified',
    created_at: '2026-09-18T14:15:00Z'
  },
  {
    id: 'evt-3',
    event_date: '2026-09-17',
    event_type: 'Lab Report',
    title: 'Comprehensive Metabolic Panel & Lipid Profile',
    facility_or_doctor: 'Apex Diagnostics & Pathology',
    description: 'HbA1c 7.8% (Elevated), Fasting Glucose 142 mg/dL, Total Cholesterol 218 mg/dL.',
    source_page: 1,
    verification_status: 'verified',
    created_at: '2026-09-17T09:00:00Z'
  },
  {
    id: 'evt-4',
    event_date: '2025-11-12',
    event_type: 'Prescription',
    title: 'Outpatient Clinic Rx: Acute Gastroenteritis',
    facility_or_doctor: 'City Care Clinic',
    description: 'Amoxicillin 500mg 5-day course (completed), ORS packets, Pantoprazole 40mg.',
    source_page: 1,
    verification_status: 'verified',
    created_at: '2025-11-12T16:45:00Z'
  }
];

const MOCK_STATS: DashboardStats = {
  total_documents: 4,
  processed_documents: 4,
  verified_records_count: 18,
  records_requiring_review: 1,
  total_timeline_events: 4,
  active_medications: 3,
  abnormal_lab_results: 3,
  recent_uploads: MOCK_DOCUMENTS,
  recent_events: MOCK_TIMELINE
};

const MOCK_ACTIVE_MEDS: MedicationBriefItem[] = [
  {
    id: 'm-1',
    medicine_name: 'Metformin',
    dosage: '500 mg',
    frequency: 'Twice daily after meals',
    status: 'active',
    prescribed_date: '2026-09-18',
    source_document_name: 'Fortis_Discharge_Summary_Sep2026.pdf',
    source_page: 1,
    source_snippet: 'Tab Metformin 500mg BID with food',
    verification_status: 'verified'
  },
  {
    id: 'm-2',
    medicine_name: 'Telmisartan',
    dosage: '40 mg',
    frequency: 'Once daily morning',
    status: 'active',
    prescribed_date: '2026-10-02',
    source_document_name: 'Dr_Verma_Cardiology_Oct2026.pdf',
    source_page: 1,
    source_snippet: 'Tab Telmisartan 40mg OD morning',
    verification_status: 'verified'
  },
  {
    id: 'm-3',
    medicine_name: 'Atorvastatin',
    dosage: '20 mg',
    frequency: 'Once daily bedtime',
    status: 'active',
    prescribed_date: '2026-10-02',
    source_document_name: 'Dr_Verma_Cardiology_Oct2026.pdf',
    source_page: 1,
    source_snippet: 'Tab Atorvastatin 20mg HS',
    verification_status: 'verified'
  }
];

const MOCK_HISTORICAL_MEDS: MedicationBriefItem[] = [
  {
    id: 'm-4',
    medicine_name: 'Amoxicillin',
    dosage: '500 mg',
    frequency: 'Completed 5 days (Nov 2025)',
    status: 'completed',
    prescribed_date: '2025-11-12',
    source_document_name: 'CityClinic_Rx_Nov2025.pdf',
    source_page: 1,
    source_snippet: 'Cap Amoxicillin 500mg TID x 5d',
    verification_status: 'verified'
  }
];

const MOCK_BRIEFING: DoctorBriefing = {
  generated_at: new Date().toISOString(),
  patient_info: {
    name: 'Rajesh Sharma',
    dob: '1974-05-14',
    gender: 'Male',
    blood_group: 'B+',
    emergency_contact: '+91 98765 43210'
  },
  clinical_narrative: '52-year-old male with a 6-year history of Type 2 Diabetes Mellitus, Essential Hypertension, and Dyslipidemia. Blood pressure is currently well-controlled (134/84 mmHg) on Telmisartan 40mg. Glycemic control is moderately elevated (HbA1c 7.8%). Documented severe allergy to Penicillin.',
  documented_allergies: ['Penicillin (Immediate hypersensitivity / anaphylaxis risk)'],
  chronic_conditions: ['Type 2 Diabetes Mellitus', 'Essential Hypertension', 'Dyslipidemia'],
  active_medications: MOCK_ACTIVE_MEDS,
  historical_or_unverified_medications: MOCK_HISTORICAL_MEDS,
  recent_lab_results: [
    {
      id: 'l-1',
      test_name: 'HbA1c (Glycated Hemoglobin)',
      result_value: '7.8 %',
      numeric_value: 7.8,
      unit: '%',
      reference_range: '< 5.7 %',
      is_abnormal: true,
      test_date: '2026-09-17',
      source_document_name: 'Apex_Lipid_Panel_Sep2026.pdf',
      source_page: 1,
      source_snippet: 'HbA1c: 7.8% (Target < 7.0%)'
    },
    {
      id: 'l-2',
      test_name: 'Fasting Blood Glucose',
      result_value: '142 mg/dL',
      numeric_value: 142,
      unit: 'mg/dL',
      reference_range: '70 - 100 mg/dL',
      is_abnormal: true,
      test_date: '2026-09-17',
      source_document_name: 'Apex_Lipid_Panel_Sep2026.pdf',
      source_page: 1,
      source_snippet: 'Fasting Plasma Glucose: 142 mg/dL'
    },
    {
      id: 'l-3',
      test_name: 'Total Cholesterol',
      result_value: '218 mg/dL',
      numeric_value: 218,
      unit: 'mg/dL',
      reference_range: '< 200 mg/dL',
      is_abnormal: true,
      test_date: '2026-09-17',
      source_document_name: 'Apex_Lipid_Panel_Sep2026.pdf',
      source_page: 1,
      source_snippet: 'Total Cholesterol: 218 mg/dL'
    }
  ],
  major_hospital_or_clinic_visits: [
    {
      id: 'v-1',
      title: 'Outpatient Cardiology Follow-Up',
      date: '2026-10-02',
      type: 'Prescription',
      facility_or_doctor: 'Dr. Arvind Verma, MD (Max Healthcare)',
      description: 'Antihypertensive optimization & lipid management.',
      source_page: 1
    }
  ],
  conflicting_or_uncertain_records: [
    {
      id: 'u-1',
      field: 'Pantoprazole duration',
      reason: 'Faded handwriting on prescription slip indicates 14 vs 30 days',
      detected_value: '~14 days?',
      document_name: 'CityClinic_Rx_Nov2025.pdf',
      document_id: 'doc-4'
    }
  ],
  questions_for_clinician: [
    'Patient has documented Penicillin allergy; confirm alternative coverage for dental/minor infections.',
    'HbA1c remains 7.8% despite Metformin 500mg BID; consider intensifying glycemic therapy.',
    'Verify Pantoprazole duration: handwritten slip indicates 14 vs 30 days.'
  ],
  evidence_coverage: {
    total_documents_analyzed: 4,
    total_verified_facts: 18,
    total_unverified_items: 1,
    has_recent_labs: true,
    has_discharge_summary: true
  }
};

const MOCK_UNCERTAINTIES: UncertaintyItem[] = [
  {
    id: 'u-1',
    document_id: 'doc-4',
    document_name: 'CityClinic_Gastroenteritis_Rx_Nov2025.pdf',
    entity_type: 'Medication',
    field_name: 'Duration',
    detected_value: '~14 days?',
    reason: 'Faded cursive handwriting on prescription slip for Pantoprazole',
    suggested_options: ['14 days', '30 days', 'PRN as needed'],
    resolved: false,
    created_at: '2026-10-02T10:30:00Z'
  }
];

export const api = {
  async login(email: string, password?: string, firebaseToken?: string) {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, firebase_token: firebaseToken }),
    });
    return handleResponse<{ access_token: string; user: User }>(res);
  },

  async firebaseLogin(firebaseUid: string, email: string, fullName?: string, role: string = 'patient') {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/firebase-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firebase_uid: firebaseUid,
          email,
          full_name: fullName,
          role
        }),
      });
      return await handleResponse<{ access_token: string; user: User }>(res);
    } catch {
      // Standalone fallback when backend is offline
      return {
        access_token: `firebase-session-${firebaseUid}`,
        user: {
          id: firebaseUid,
          email,
          full_name: fullName || email.split('@')[0],
          role: (role as any) || 'patient'
        }
      };
    }
  },

  async register(email: string, password: string, fullName: string, role: string = 'patient') {
    const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, full_name: fullName, role }),
    });
    return handleResponse<{ access_token: string; user: User }>(res);
  },

  async demoLogin() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/demo-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      return await handleResponse<{ access_token: string; user: User }>(res);
    } catch {
      return {
        access_token: 'demo-patient-token-preview',
        user: MOCK_PATIENT_USER
      };
    }
  },

  async demoDoctorLogin() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/demo-doctor-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      return await handleResponse<{ access_token: string; user: User }>(res);
    } catch {
      return {
        access_token: 'demo-doctor-token-preview',
        user: MOCK_DOCTOR_USER
      };
    }
  },

  async getMe() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: getAuthHeaders(),
      });
      return await handleResponse<User>(res);
    } catch {
      return MOCK_PATIENT_USER;
    }
  },

  // Dashboard & Timeline
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/timeline/stats`, {
        headers: getAuthHeaders(),
      });
      return await handleResponse<DashboardStats>(res);
    } catch {
      return MOCK_STATS;
    }
  },

  async getTimeline(category?: string, verificationStatus?: string, search?: string): Promise<TimelineEvent[]> {
    try {
      const params = new URLSearchParams();
      if (category && category !== 'All') params.append('event_type', category);
      if (verificationStatus && verificationStatus !== 'All') params.append('verification_status', verificationStatus);
      if (search) params.append('search', search);

      const res = await fetch(`${API_BASE_URL}/api/timeline?${params.toString()}`, {
        headers: getAuthHeaders(),
      });
      return await handleResponse<TimelineEvent[]>(res);
    } catch {
      return MOCK_TIMELINE;
    }
  },

  async getLabTrends(): Promise<Record<string, Array<{ date: string; value: number; unit?: string; is_abnormal: boolean; reference_range?: string }>>> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/timeline/lab-trends`, {
        headers: getAuthHeaders(),
      });
      return await handleResponse(res);
    } catch {
      return {
        HbA1c: [
          { date: '2025-11-12', value: 7.2, unit: '%', is_abnormal: true, reference_range: '< 5.7' },
          { date: '2026-04-10', value: 7.4, unit: '%', is_abnormal: true, reference_range: '< 5.7' },
          { date: '2026-09-17', value: 7.8, unit: '%', is_abnormal: true, reference_range: '< 5.7' }
        ]
      };
    }
  },

  // Documents
  async listDocuments(category?: string): Promise<MedicalDocument[]> {
    try {
      const params = new URLSearchParams();
      if (category && category !== 'All') params.append('category', category);
      const res = await fetch(`${API_BASE_URL}/api/documents?${params.toString()}`, {
        headers: getAuthHeaders(),
      });
      return await handleResponse<MedicalDocument[]>(res);
    } catch {
      return MOCK_DOCUMENTS;
    }
  },

  async uploadDocument(file: File, category: string, documentDate?: string): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    if (documentDate) formData.append('document_date', documentDate);

    const token = localStorage.getItem('sehat_token');
    const headers: HeadersInit = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE_URL}/api/documents/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });
    return handleResponse(res);
  },

  async getDocumentDetails(docId: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/api/documents/${docId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  getDocumentFileUrl(docId: string): string {
    const token = localStorage.getItem('sehat_token');
    return `${API_BASE_URL}/api/documents/${docId}/file?token=${encodeURIComponent(token || '')}`;
  },

  async retryDocument(docId: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/api/documents/${docId}/retry`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async deleteDocument(docId: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/api/documents/${docId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Two-Minute Doctor Brief
  async getDoctorBriefing(): Promise<DoctorBriefing> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/briefing`, {
        headers: getAuthHeaders(),
      });
      return await handleResponse<DoctorBriefing>(res);
    } catch {
      return MOCK_BRIEFING;
    }
  },

  // Verification Center
  async getUncertainties(): Promise<UncertaintyItem[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/verification/uncertainties`, {
        headers: getAuthHeaders(),
      });
      return await handleResponse<UncertaintyItem[]>(res);
    } catch {
      return MOCK_UNCERTAINTIES;
    }
  },

  async resolveUncertainty(id: string, resolvedValue: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/api/verification/resolve/${id}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ resolved_value: resolvedValue }),
    });
    return handleResponse(res);
  },

  async correctRecord(entityType: string, entityId: string, fieldName: string, newValue: string, reason?: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/api/verification/correct`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        entity_type: entityType,
        entity_id: entityId,
        field_name: fieldName,
        new_value: newValue,
        reason: reason || 'Manual verification'
      }),
    });
    return handleResponse(res);
  },

  async updateVerificationStatus(entityType: string, entityId: string, status: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/api/verification/status`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ entity_type: entityType, entity_id: entityId, status }),
    });
    return handleResponse(res);
  },

  async getCorrectionHistory(): Promise<any[]> {
    const res = await fetch(`${API_BASE_URL}/api/verification/history`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Sharing
  async createShareToken(title: string, durationHours: number = 24, doctorNameOrPurpose?: string): Promise<ShareToken> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/sharing/tokens`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title,
          duration_hours: durationHours,
          doctor_name_or_purpose: doctorNameOrPurpose,
          include_briefing: true
        }),
      });
      return await handleResponse<ShareToken>(res);
    } catch {
      return {
        id: 'mock-share-token-1',
        token: 'demo-share-token-48h',
        title: title || 'Doctor Consultation',
        doctor_name_or_purpose: doctorNameOrPurpose,
        expires_at: new Date(Date.now() + durationHours * 3600 * 1000).toISOString(),
        is_revoked: false,
        share_url: '/doctor-portal/demo-share-token-48h',
        include_briefing: true,
        allowed_documents_count: 4,
        created_at: new Date().toISOString()
      };
    }
  },

  async listShareTokens(): Promise<ShareToken[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/sharing/tokens`, {
        headers: getAuthHeaders(),
      });
      return await handleResponse<ShareToken[]>(res);
    } catch {
      return [];
    }
  },

  async revokeShareToken(tokenId: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/api/sharing/tokens/${tokenId}/revoke`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async getDoctorPortalData(token: string): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/sharing/doctor-view/${token}`);
      return await handleResponse(res);
    } catch {
      return {
        token_valid: true,
        patient_name: 'Rajesh Sharma',
        briefing: MOCK_BRIEFING,
        documents: MOCK_DOCUMENTS
      };
    }
  },

  getDoctorFileUrl(token: string, docId: string): string {
    return `${API_BASE_URL}/api/sharing/doctor-file/${token}/${docId}`;
  },

  // Audit
  async getAuditTrail(): Promise<any[]> {
    const res = await fetch(`${API_BASE_URL}/api/audit`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  }
};
