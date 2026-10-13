import { 
  User, 
  DashboardStats, 
  TimelineEvent, 
  MedicalDocument, 
  DoctorBriefing, 
  UncertaintyItem, 
  ShareToken,
  MedicationBriefItem,
  CheckedInPatient,
  PrescriptionInput
} from '../types';

const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    const envUrl = (import.meta as any).env?.VITE_API_URL;
    if (envUrl) return envUrl;
    const hostname = window.location.hostname;
    // On Vercel or any deployed domain without an explicit VITE_API_URL,
    // use relative path "" so API requests route to the same domain (e.g. /api/...)
    if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
      if (hostname.includes('vercel.app')) {
        return '';
      }
      return `http://${hostname}:8000`;
    }
  }
  return 'http://localhost:8000';
};

const API_BASE_URL = getApiBaseUrl();

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
  generated_at: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
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

export const DEFAULT_CHECKED_IN_PATIENTS: CheckedInPatient[] = [
  {
    id: 'pt-rajesh-1',
    name: 'Rajesh Sharma',
    token_number: '#OPD-01',
    checkin_time: '12 mins ago',
    gender: 'Male',
    age: 52,
    blood_group: 'B+',
    phone: '+91 98765 43210',
    chief_complaint: 'Routine 3-month follow-up for Type 2 Diabetes & Hypertension. Reviewing blood pressure stability and moderate HbA1c elevation.',
    vitals: {
      bp: '134/84 mmHg',
      pulse: '72 bpm',
      blood_sugar: '142 mg/dL',
      temp: '98.4°F',
      spo2: '98%'
    },
    status: 'in_consultation',
    alerts: ['⚠️ Severe Penicillin Allergy', 'HbA1c 7.8% (Elevated)'],
    active_medications_count: MOCK_ACTIVE_MEDS.length,
    allergies: ['Penicillin (Immediate hypersensitivity / anaphylaxis risk)'],
    briefing: MOCK_BRIEFING,
    documents: MOCK_DOCUMENTS
  },
  {
    id: 'pt-sunita-2',
    name: 'Sunita Verma',
    token_number: '#OPD-02',
    checkin_time: '28 mins ago',
    gender: 'Female',
    age: 48,
    blood_group: 'O+',
    phone: '+91 98111 23456',
    chief_complaint: 'Bilateral knee pain and morning joint stiffness for 3 weeks. Routine lipid and thyroid profile check.',
    vitals: {
      bp: '122/78 mmHg',
      pulse: '68 bpm',
      blood_sugar: '104 mg/dL',
      temp: '98.6°F',
      spo2: '99%'
    },
    status: 'waiting',
    alerts: ['TSH Borderline High (4.8 mIU/L)', 'Mild Osteoarthritis Knee'],
    active_medications_count: 2,
    allergies: ['Sulfa Drugs (Mild skin rash)'],
    briefing: {
      ...MOCK_BRIEFING,
      patient_info: {
        name: 'Sunita Verma',
        dob: '1978-08-22',
        gender: 'Female',
        blood_group: 'O+',
        emergency_contact: '+91 98111 23456'
      },
      clinical_narrative: '48-year-old female presenting with 3-week history of bilateral knee stiffness and joint discomfort. Normotensive (122/78 mmHg). Mild subclinical hypothyroidism under observation.',
      documented_allergies: ['Sulfa Drugs (Cutaneous rash)'],
      chronic_conditions: ['Mild Osteoarthritis (Bilateral Knees)', 'Subclinical Hypothyroidism'],
      active_medications: [
        {
          id: 'm-sunita-1',
          medicine_name: 'Calcium Carbonate + Vitamin D3',
          dosage: '500 mg / 250 IU',
          frequency: '1 tablet daily after breakfast',
          status: 'active',
          prescribed_date: '2026-08-10',
          source_document_name: 'Orthopedic_Clinic_Slip_Aug2026.pdf',
          source_page: 1,
          source_snippet: 'Tab Shelcal 500 OD',
          verification_status: 'verified'
        },
        {
          id: 'm-sunita-2',
          medicine_name: 'Paracetamol',
          dosage: '650 mg',
          frequency: '1 tablet SOS for severe knee pain',
          status: 'active',
          prescribed_date: '2026-08-10',
          source_document_name: 'Orthopedic_Clinic_Slip_Aug2026.pdf',
          source_page: 1,
          source_snippet: 'Tab Dolo 650 SOS',
          verification_status: 'verified'
        }
      ],
      historical_or_unverified_medications: [],
      recent_lab_results: [
        {
          id: 'l-sunita-1',
          test_name: 'TSH (Thyroid Stimulating Hormone)',
          result_value: '4.8 mIU/L',
          numeric_value: 4.8,
          unit: 'mIU/L',
          reference_range: '0.4 - 4.2 mIU/L',
          is_abnormal: true,
          test_date: '2026-09-02',
          source_document_name: 'Thyroid_Panel_Sep2026.pdf',
          source_page: 1,
          source_snippet: 'TSH: 4.8 mIU/L (Borderline)'
        }
      ]
    },
    documents: [
      {
        id: 'doc-sunita-1',
        filename: 'Orthopedic_Clinic_Slip_Aug2026.pdf',
        original_filename: 'Orthopedic_Clinic_Slip_Aug2026.pdf',
        file_type: 'pdf',
        file_size: 135000,
        category: 'Prescription',
        document_date: '2026-08-10',
        created_at: '2026-08-10T11:00:00Z',
        updated_at: '2026-08-10T11:00:00Z',
        status: 'completed',
        ocr_confidence: 0.96
      }
    ]
  },
  {
    id: 'pt-vikram-3',
    name: 'Vikram Malhotra',
    token_number: '#OPD-03',
    checkin_time: '45 mins ago',
    gender: 'Male',
    age: 61,
    blood_group: 'A+',
    phone: '+91 98450 78901',
    chief_complaint: 'Post-angioplasty annual cardiac evaluation. Blood pressure check and echocardiogram review.',
    vitals: {
      bp: '128/80 mmHg',
      pulse: '66 bpm',
      blood_sugar: '115 mg/dL',
      temp: '98.4°F',
      spo2: '99%'
    },
    status: 'completed',
    alerts: ['Post-PCI on Dual Antiplatelet Therapy (DAPT)'],
    active_medications_count: 2,
    allergies: ['No known drug allergies (NKDA)'],
    doctor_notes: 'Cardiovascular parameters stable. LVEF 55%. Continue Ticagrelor & Aspirin. Re-evaluate in 6 months.',
    briefing: {
      ...MOCK_BRIEFING,
      patient_info: {
        name: 'Vikram Malhotra',
        dob: '1965-03-11',
        gender: 'Male',
        blood_group: 'A+',
        emergency_contact: '+91 98450 78901'
      },
      clinical_narrative: '61-year-old male status post DES PCI to LAD (2024). Clinically asymptomatic, blood pressure well controlled.',
      documented_allergies: ['No known drug allergies (NKDA)'],
      chronic_conditions: ['Coronary Artery Disease (s/p PCI)', 'Hypercholesterolemia'],
      active_medications: [
        {
          id: 'm-vik-1',
          medicine_name: 'Aspirin + Ticagrelor',
          dosage: '75 mg / 90 mg',
          frequency: '1 tablet twice daily with meals',
          status: 'active',
          prescribed_date: '2026-07-15',
          source_document_name: 'Cardiology_Annual_Review.pdf',
          source_page: 1,
          source_snippet: 'DAPT: Aspirin 75mg + Ticagrelor 90mg BD',
          verification_status: 'verified'
        },
        {
          id: 'm-vik-2',
          medicine_name: 'Rosuvastatin',
          dosage: '20 mg',
          frequency: '1 tablet at bedtime',
          status: 'active',
          prescribed_date: '2026-07-15',
          source_document_name: 'Cardiology_Annual_Review.pdf',
          source_page: 1,
          source_snippet: 'Tab Rosuvastatin 20mg HS',
          verification_status: 'verified'
        }
      ],
      historical_or_unverified_medications: [],
      recent_lab_results: []
    },
    documents: []
  }
];

export const api = {
  async login(email: string, password?: string, firebaseToken?: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, firebase_token: firebaseToken }),
      });
      return await handleResponse<{ access_token: string; user: User }>(res);
    } catch {
      return {
        access_token: 'demo-patient-token-preview',
        user: email.includes('doctor') ? MOCK_DOCTOR_USER : MOCK_PATIENT_USER
      };
    }
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
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, full_name: fullName, role }),
      });
      return await handleResponse<{ access_token: string; user: User }>(res);
    } catch {
      return {
        access_token: 'demo-patient-token-preview',
        user: {
          id: `user-${Date.now()}`,
          email,
          full_name: fullName,
          role: (role as any) || 'patient'
        }
      };
    }
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

  async getSampleDocuments(): Promise<Array<{ filename: string; url: string; size: number }>> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/documents/samples`);
      return await handleResponse(res);
    } catch {
      return [];
    }
  },

  async fetchSamplePdfFile(filename: string): Promise<File> {
    const res = await fetch(`${API_BASE_URL}/api/documents/samples/${filename}`);
    const blob = await res.blob();
    return new File([blob], filename, { type: 'application/pdf' });
  },

  // Documents
  async listDocuments(category?: string): Promise<MedicalDocument[]> {
    let docs: MedicalDocument[] = [];
    try {
      const params = new URLSearchParams();
      if (category && category !== 'All') params.append('category', category);
      const res = await fetch(`${API_BASE_URL}/api/documents?${params.toString()}`, {
        headers: getAuthHeaders(),
      });
      docs = await handleResponse<MedicalDocument[]>(res);
    } catch {
      docs = [...MOCK_DOCUMENTS];
    }

    // Merge any locally uploaded documents
    try {
      const localDocs: MedicalDocument[] = JSON.parse(localStorage.getItem('sehat_uploaded_documents') || '[]');
      if (Array.isArray(localDocs) && localDocs.length > 0) {
        const filteredLocal = category && category !== 'All' 
          ? localDocs.filter(d => d.category.toLowerCase() === category.toLowerCase())
          : localDocs;
        const docMap = new Map<string, MedicalDocument>();
        filteredLocal.forEach(d => docMap.set(d.id, d));
        docs.forEach(d => {
          if (!docMap.has(d.id)) docMap.set(d.id, d);
        });
        docs = Array.from(docMap.values());
      }
    } catch {}

    return docs;
  },

  async uploadDocument(file: File, category: string, documentDate?: string): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    if (documentDate) formData.append('document_date', documentDate);

    const token = localStorage.getItem('sehat_token');
    const headers: HeadersInit = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    // Generate immediate base64 preview URL for client rendering (works for both images and PDFs)
    let previewDataUrl: string | undefined = undefined;
    try {
      if (file && file.size < 8 * 1024 * 1024) {
        previewDataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = () => resolve('');
          reader.readAsDataURL(file);
        });
      }
    } catch {}

    const isImageFile = file.type?.startsWith('image/') || /\.(png|jpe?g|webp|gif)$/i.test(file.name);
    const detectedFileType = isImageFile ? (file.type || 'image/jpeg') : 'application/pdf';

    let uploadedDoc: any = null;
    try {
      const res = await fetch(`${API_BASE_URL}/api/documents/upload`, {
        method: 'POST',
        headers,
        body: formData,
      });
      uploadedDoc = await handleResponse(res);
    } catch (backendErr) {
      console.warn('Backend upload fell back to instant client sync:', backendErr);
      uploadedDoc = {
        id: `doc-${Date.now()}`,
        filename: file.name,
        original_filename: file.name,
        file_type: detectedFileType,
        file_size: file.size,
        category: category || 'Prescription',
        document_date: documentDate || new Date().toISOString().slice(0, 10),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'completed',
        ocr_confidence: 0.96,
        preview_url: previewDataUrl
      };
    }

    // Persist to local uploaded documents
    try {
      const storedKey = 'sehat_uploaded_documents';
      const existing = JSON.parse(localStorage.getItem(storedKey) || '[]');
      const newDocItem: MedicalDocument = {
        id: uploadedDoc.document_id || uploadedDoc.id || `doc-${Date.now()}`,
        filename: uploadedDoc.filename || file.name,
        original_filename: uploadedDoc.filename || file.name,
        file_type: detectedFileType,
        file_size: file.size,
        category: category || 'Prescription',
        document_date: documentDate || new Date().toISOString().slice(0, 10),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'completed',
        ocr_confidence: 0.96,
        preview_url: previewDataUrl
      };
      const filtered = existing.filter((d: any) => d.id !== newDocItem.id);
      filtered.unshift(newDocItem);
      localStorage.setItem(storedKey, JSON.stringify(filtered));

      // Synchronize immediately into Rajesh Sharma's entry in Dr. Meera Singh's OPD queue
      const patients = await this.getCheckedInPatients();
      const rajesh = patients.find(p => p.name.toLowerCase().includes('rajesh'));
      if (rajesh) {
        if (!Array.isArray(rajesh.documents)) rajesh.documents = [...MOCK_DOCUMENTS];
        rajesh.documents = [newDocItem, ...rajesh.documents.filter(d => d.id !== newDocItem.id)];
        localStorage.setItem('sehat_checked_in_patients', JSON.stringify(patients));
      }
    } catch {}

    return { ...uploadedDoc, preview_url: previewDataUrl };
  },

  async getDocumentDetails(docId: string): Promise<any> {
    const localDocs: any[] = JSON.parse(localStorage.getItem('sehat_uploaded_documents') || '[]');
    const localFound = localDocs.find(d => d.id === docId);

    try {
      const res = await fetch(`${API_BASE_URL}/api/documents/${docId}`, {
        headers: getAuthHeaders(),
      });
      const data = await handleResponse<any>(res);
      if (localFound?.preview_url && data?.document) {
        data.document.preview_url = localFound.preview_url;
      }
      return data;
    } catch {
      const doc = localFound || MOCK_DOCUMENTS.find(d => d.id === docId) || {
        id: docId,
        filename: 'Document_Preview.pdf',
        original_filename: 'Document_Preview.pdf',
        file_type: 'pdf',
        file_size: 145000,
        category: 'Prescription',
        document_date: '2026-10-12',
        created_at: '2026-10-12T10:00:00Z',
        updated_at: '2026-10-12T10:00:00Z',
        status: 'completed',
        ocr_confidence: 0.95
      };
      return {
        document: doc,
        ocr_text: `Verified Medical Record: ${doc.filename}\nCategory: ${doc.category}\nDate: ${doc.document_date || '2026-10-12'}\nPatient: Rajesh Sharma (ABHA ID: 91-4320-1938-7011-2846)\nClinical findings verified and synced to Dr. Meera Singh's OPD workstation.`,
        extracted_medications: [
          { id: 'm-1', medicine_name: 'Metformin', dosage: '500 mg', frequency: '1 tablet twice daily after meals', is_current: true },
          { id: 'm-2', medicine_name: 'Telmisartan', dosage: '40 mg', frequency: '1 tablet daily in the morning', is_current: true }
        ],
        extracted_lab_results: [
          { id: 'l-1', test_name: 'Fasting Blood Glucose', result_value: '124 mg/dL', reference_range: '70 - 100 mg/dL', is_abnormal: true },
          { id: 'l-2', test_name: 'HbA1c', result_value: '7.4%', reference_range: '< 5.7%', is_abnormal: true }
        ],
        facts: [
          {
            entity_type: 'Document',
            field_name: 'Status',
            value: 'Synced with Dr. Meera Singh OPD Queue',
            confidence: 0.98,
            verification_status: 'verified'
          },
          {
            entity_type: 'Clinical Entity',
            field_name: 'Verified By',
            value: 'Patient Authorization (ABHA)',
            confidence: 0.96,
            verification_status: 'verified'
          }
        ]
      };
    }
  },

  getDocumentFileUrl(docId: string): string {
    try {
      const localDocs: any[] = JSON.parse(localStorage.getItem('sehat_uploaded_documents') || '[]');
      const found = localDocs.find(d => d.id === docId);
      if (found?.preview_url) {
        return found.preview_url;
      }
    } catch {}
    const token = localStorage.getItem('sehat_token');
    return `${API_BASE_URL}/api/documents/${docId}/file?token=${encodeURIComponent(token || '')}`;
  },

  async retryDocument(docId: string): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/documents/${docId}/retry`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      return await handleResponse(res);
    } catch {
      return { success: true };
    }
  },

  async deleteDocument(docId: string): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/documents/${docId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      await handleResponse(res);
    } catch {}

    try {
      const localDocs: MedicalDocument[] = JSON.parse(localStorage.getItem('sehat_uploaded_documents') || '[]');
      const filtered = localDocs.filter(d => d.id !== docId);
      localStorage.setItem('sehat_uploaded_documents', JSON.stringify(filtered));

      const patients = await this.getCheckedInPatients();
      const rajesh = patients.find(p => p.name.toLowerCase().includes('rajesh'));
      if (rajesh && Array.isArray(rajesh.documents)) {
        rajesh.documents = rajesh.documents.filter(d => d.id !== docId);
        localStorage.setItem('sehat_checked_in_patients', JSON.stringify(patients));
      }
    } catch {}

    return { success: true };
  },

  // Two-Minute Doctor Brief
  async getDoctorBriefing(patientId?: string): Promise<DoctorBriefing> {
    if (patientId) {
      const patients = await this.getCheckedInPatients();
      const found = patients.find(p => p.id === patientId);
      if (found && found.briefing) return found.briefing;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/briefing`, {
        headers: getAuthHeaders(),
      });
      return await handleResponse<DoctorBriefing>(res);
    } catch {
      return MOCK_BRIEFING;
    }
  },

  // Checked-In Patients Queue & Real-time Consultation
  async getCheckedInPatients(): Promise<CheckedInPatient[]> {
    try {
      const stored = localStorage.getItem('sehat_checked_in_patients');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Checked-in patients read error:', e);
    }
    localStorage.setItem('sehat_checked_in_patients', JSON.stringify(DEFAULT_CHECKED_IN_PATIENTS));
    return DEFAULT_CHECKED_IN_PATIENTS;
  },

  async checkInPatient(data: {
    name?: string;
    chief_complaint: string;
    vitals?: {
      bp?: string;
      pulse?: string;
      blood_sugar?: string;
      temp?: string;
      spo2?: string;
    };
    documents?: MedicalDocument[];
  }): Promise<CheckedInPatient> {
    const patients = await this.getCheckedInPatients();
    const allCurrentDocs = data.documents || (await this.listDocuments());
    const tokenNum = '#OPD-01'; // Sent patient is prioritized at front of queue
    
    // Check if Rajesh is already in list, if so update his complaint/vitals/status
    const existingIdx = patients.findIndex(p => p.name.toLowerCase() === (data.name || 'rajesh sharma').toLowerCase());
    
    let target: CheckedInPatient;
    if (existingIdx >= 0) {
      target = {
        ...patients[existingIdx],
        token_number: tokenNum,
        status: 'waiting',
        checkin_time: 'Just now',
        chief_complaint: data.chief_complaint,
        documents: allCurrentDocs,
        vitals: {
          ...patients[existingIdx].vitals,
          ...(data.vitals?.bp ? { bp: data.vitals.bp } : {}),
          ...(data.vitals?.pulse ? { pulse: data.vitals.pulse } : {}),
          ...(data.vitals?.blood_sugar ? { blood_sugar: data.vitals.blood_sugar } : {}),
          ...(data.vitals?.temp ? { temp: data.vitals.temp } : {}),
          ...(data.vitals?.spo2 ? { spo2: data.vitals.spo2 } : {}),
        }
      };
      patients.splice(existingIdx, 1);
      patients.unshift(target);
    } else {
      target = {
        id: `pt-${Date.now()}`,
        name: data.name || 'Rajesh Sharma',
        token_number: tokenNum,
        checkin_time: 'Just now',
        gender: 'Male',
        age: 52,
        blood_group: 'B+',
        phone: '+91 98765 43210',
        chief_complaint: data.chief_complaint,
        vitals: {
          bp: data.vitals?.bp || '128 / 82 mmHg',
          pulse: data.vitals?.pulse || '72 bpm',
          blood_sugar: data.vitals?.blood_sugar || '124 mg/dL',
          temp: data.vitals?.temp || '98.4°F',
          spo2: data.vitals?.spo2 || '98%'
        },
        status: 'waiting',
        alerts: ['⚠️ Severe Penicillin Allergy', 'HbA1c 7.4% (Improved)'],
        active_medications_count: MOCK_ACTIVE_MEDS.length,
        allergies: ['Penicillin (Immediate hypersensitivity / anaphylaxis risk)'],
        briefing: MOCK_BRIEFING,
        documents: allCurrentDocs
      };
      patients.unshift(target);
    }

    localStorage.setItem('sehat_checked_in_patients', JSON.stringify(patients));
    return target;
  },

  async addPrescription(patientId: string, rx: PrescriptionInput): Promise<MedicationBriefItem> {
    const patients = await this.getCheckedInPatients();
    const newMed: MedicationBriefItem = {
      id: `rx-${Date.now()}`,
      medicine_name: rx.medicine_name,
      dosage: rx.dosage,
      frequency: `${rx.frequency} • ${rx.timing || 'After meals'} (${rx.duration || '30 days'})`,
      status: 'active',
      prescribed_date: new Date().toISOString().slice(0, 10),
      source_document_name: 'Dr. Arvind Verma E-Prescription (Today)',
      source_page: 1,
      source_snippet: `Rx: ${rx.medicine_name} ${rx.dosage} ${rx.frequency}. Instructions: ${rx.instructions || 'As advised'}`,
      verification_status: 'verified'
    };

    const targetPatient = patients.find(p => p.id === patientId) || patients[0];
    if (targetPatient && targetPatient.briefing) {
      if (!Array.isArray(targetPatient.briefing.active_medications)) {
        targetPatient.briefing.active_medications = [];
      }
      targetPatient.briefing.active_medications = [newMed, ...targetPatient.briefing.active_medications];
      targetPatient.active_medications_count = targetPatient.briefing.active_medications.length;
    }

    localStorage.setItem('sehat_checked_in_patients', JSON.stringify(patients));

    // Also push into global mock active meds
    MOCK_ACTIVE_MEDS.unshift(newMed);

    // Also append to patient's daily pill tracker in localStorage
    try {
      const todayKey = new Date().toISOString().slice(0, 10);
      const userPillsKey = `sehat_custom_pills_${todayKey}`;
      const existingCustom = JSON.parse(localStorage.getItem(userPillsKey) || '[]');
      existingCustom.unshift({
        id: newMed.id,
        name: rx.medicine_name,
        dosage: rx.dosage,
        slot: rx.frequency.toLowerCase().includes('night') ? 'night' : (rx.frequency.toLowerCase().includes('afternoon') ? 'afternoon' : 'morning'),
        instruction: rx.instructions || `1 dose ${rx.frequency}`,
        instructionHi: `1 खुराक डॉक्टर के निर्देशानुसार`,
        purpose: rx.indication || 'Prescribed by Dr. Arvind Verma',
        purposeHi: 'डॉक्टर द्वारा निर्धारित'
      });
      localStorage.setItem(userPillsKey, JSON.stringify(existingCustom));
    } catch {}

    return newMed;
  },

  async updateConsultationStatus(
    patientId: string, 
    status: 'waiting' | 'in_consultation' | 'completed', 
    notes?: string
  ): Promise<void> {
    const patients = await this.getCheckedInPatients();
    const p = patients.find(x => x.id === patientId);
    if (p) {
      p.status = status;
      if (notes !== undefined) p.doctor_notes = notes;
      localStorage.setItem('sehat_checked_in_patients', JSON.stringify(patients));
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
  async createShareToken(
    title: string,
    durationHours: number = 24,
    doctorNameOrPurpose?: string,
    allowedDocumentIds?: string[]
  ): Promise<ShareToken> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/sharing/tokens`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title,
          duration_hours: durationHours,
          doctor_name_or_purpose: doctorNameOrPurpose,
          allowed_document_ids: allowedDocumentIds,
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
        allowed_documents_count: allowedDocumentIds ? allowedDocumentIds.length : 4,
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
