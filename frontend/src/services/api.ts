import { 
  User, 
  DashboardStats, 
  TimelineEvent, 
  MedicalDocument, 
  DoctorBriefing, 
  UncertaintyItem, 
  ShareToken 
} from '../types';

const API_BASE_URL = 'http://localhost:8000';

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
    return handleResponse<{ access_token: string; user: User }>(res);
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
    const res = await fetch(`${API_BASE_URL}/api/auth/demo-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse<{ access_token: string; user: User }>(res);
  },

  async demoDoctorLogin() {
    const res = await fetch(`${API_BASE_URL}/api/auth/demo-doctor-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse<{ access_token: string; user: User }>(res);
  },

  async getMe() {
    const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<User>(res);
  },

  // Dashboard & Timeline
  async getDashboardStats(): Promise<DashboardStats> {
    const res = await fetch(`${API_BASE_URL}/api/timeline/stats`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<DashboardStats>(res);
  },

  async getTimeline(category?: string, verificationStatus?: string, search?: string): Promise<TimelineEvent[]> {
    const params = new URLSearchParams();
    if (category && category !== 'All') params.append('event_type', category);
    if (verificationStatus && verificationStatus !== 'All') params.append('verification_status', verificationStatus);
    if (search) params.append('search', search);

    const res = await fetch(`${API_BASE_URL}/api/timeline?${params.toString()}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<TimelineEvent[]>(res);
  },

  async getLabTrends(): Promise<Record<string, Array<{ date: string; value: number; unit?: string; is_abnormal: boolean; reference_range?: string }>>> {
    const res = await fetch(`${API_BASE_URL}/api/timeline/lab-trends`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Documents
  async listDocuments(category?: string): Promise<MedicalDocument[]> {
    const params = new URLSearchParams();
    if (category && category !== 'All') params.append('category', category);
    const res = await fetch(`${API_BASE_URL}/api/documents?${params.toString()}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<MedicalDocument[]>(res);
  },

  async uploadDocument(file: File, category: string): Promise<any> {
    const token = localStorage.getItem('sehat_token');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);

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
    const res = await fetch(`${API_BASE_URL}/api/briefing`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<DoctorBriefing>(res);
  },

  // Verification Center
  async getUncertainties(): Promise<UncertaintyItem[]> {
    const res = await fetch(`${API_BASE_URL}/api/verification/uncertainties`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<UncertaintyItem[]>(res);
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
    return handleResponse<ShareToken>(res);
  },

  async listShareTokens(): Promise<ShareToken[]> {
    const res = await fetch(`${API_BASE_URL}/api/sharing/tokens`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<ShareToken[]>(res);
  },

  async revokeShareToken(tokenId: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/api/sharing/tokens/${tokenId}/revoke`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async getDoctorPortalData(token: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/api/sharing/doctor-view/${token}`);
    return handleResponse(res);
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
