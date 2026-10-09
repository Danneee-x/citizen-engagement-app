import { Platform } from 'react-native';
import { API_BASE_URL } from './auth-service';

export interface IdApplicationRecord {
  id: number;
  reference_no: string;
  citizen_user_id?: number | null;
  id_category: 'citizen_id' | 'barangay_id' | 'solo_parent_id' | 'pwd_id' | 'senior_citizen_id' | string;
  id_title: string;
  application_type: 'New Application' | 'Renewal' | 'Replacement' | string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  suffix?: string;
  gender: string;
  birthdate?: string | null;
  civil_status: string;
  contact_number: string;
  email?: string | null;
  street_address: string;
  barangay: string;
  district?: string;
  resident_since?: string;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  emergency_contact_relation?: string | null;
  signature_url?: string | null;
  e_signature_name?: string | null;
  signature_mode?: 'upload' | 'esignature' | string | null;
  issuing_bureau: string;
  claim_office: string;
  estimated_turnaround: string;
  primary_doc_name?: string | null;
  primary_doc_url?: string | null;
  photo_2x2_url?: string | null;
  support_doc_name?: string | null;
  support_doc_url?: string | null;
  status: 'Pending Review' | 'Under Review' | 'Approved' | 'Ready to Print' | 'Ready for Release' | 'Claimed' | 'Rejected' | string;
  review_notes?: string | null;
  rejection_reason?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  released_by?: string | null;
  released_at?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface SubmitIdApplicationPayload {
  reference_no: string;
  id_category: string;
  id_title: string;
  application_type: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  suffix?: string;
  gender: string;
  birthdate?: string;
  civil_status: string;
  contact_number: string;
  email?: string;
  street_address: string;
  barangay: string;
  district?: string;
  resident_since?: string;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  emergency_contact_relation?: string | null;
  signature_url?: string | null;
  e_signature_name?: string | null;
  signature_mode?: 'upload' | 'esignature' | string | null;
  issuing_bureau: string;
  primary_doc_name?: string;
  primary_doc_url?: string | null;
  photo_2x2_url?: string | null;
  claim_office: string;
  estimated_turnaround: string;
  citizen_user_id?: number | null;
}

export class IdIssuanceService {
  private static getCandidateEndpoints(): string[] {
    const isLocalhost =
      Platform.OS === 'web' &&
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    return [
      `${API_BASE_URL}/submit-id-application.php`,
      ...(isLocalhost
        ? [
            'http://localhost/citizen-information-and-engagement-final-try/api/citizen/submit-id-application.php',
            'http://127.0.0.1/citizen-information-and-engagement-final-try/api/citizen/submit-id-application.php',
          ]
        : []),
    ];
  }

  /**
   * Fetches the citizen's ID applications from the backend MySQL DB
   */
  public static async getMyApplications(
    userId?: number | null,
    email?: string | null
  ): Promise<IdApplicationRecord[]> {
    const endpoints = this.getCandidateEndpoints();
    const queryParams = new URLSearchParams();

    if (userId && userId > 0) {
      queryParams.append('citizen_user_id', String(userId));
    }
    if (email && email.trim()) {
      queryParams.append('email', email.trim());
      queryParams.append('citizen_email', email.trim());
    }

    const qs = queryParams.toString() ? `?${queryParams.toString()}` : '';

    for (const ep of endpoints) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);

        const res = await fetch(`${ep}${qs}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (res.ok) {
          const json = await res.json();
          if (json && json.status === 'success' && Array.isArray(json.data)) {
            return json.data as IdApplicationRecord[];
          }
        }
      } catch (err) {
        // Continue to fallback endpoint
      }
    }

    return [];
  }

  /**
   * Transmits a new ID application to the backend
   */
    /**
   * Converts an image URI (blob: or file:) into a base64 Data URL
   */
  private static async uriToBase64(uri: string): Promise<string | null> {
    if (!uri) return null;
    if (uri.startsWith('data:image')) return uri;

    try {
      const res = await fetch(uri);
      const blob = await res.blob();
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            resolve('');
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.warn('Could not convert ID photo URI to base64:', err);
      return null;
    }
  }

  /**
   * Transmits a new ID application to the backend
   */
  public static async submitApplication(payload: SubmitIdApplicationPayload): Promise<{ success: boolean; data?: any; message?: string }> {
    const endpoints = this.getCandidateEndpoints();
    let lastError = 'Failed to connect to the ID application server.';

    // Convert local image URIs (blob: or file:) to base64 so server can save them to disk
    const processedPayload = { ...payload };
    if (payload.photo_2x2_url && !payload.photo_2x2_url.startsWith('data:image') && !payload.photo_2x2_url.startsWith('http')) {
      const b64 = await this.uriToBase64(payload.photo_2x2_url);
      if (b64) processedPayload.photo_2x2_url = b64;
    }
    if (payload.primary_doc_url && !payload.primary_doc_url.startsWith('data:image') && !payload.primary_doc_url.startsWith('http')) {
      const b64 = await this.uriToBase64(payload.primary_doc_url);
      if (b64) processedPayload.primary_doc_url = b64;
    }
    if (payload.signature_url && !payload.signature_url.startsWith('data:image') && !payload.signature_url.startsWith('http') && payload.signature_url.startsWith('blob:')) {
      const b64 = await this.uriToBase64(payload.signature_url);
      if (b64) processedPayload.signature_url = b64;
    }

    for (const ep of endpoints) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 35000);

        const res = await fetch(ep, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(processedPayload),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (res.ok) {
          const json = await res.json();
          if (json && (json.status === 'success' || json.success === true)) {
            return { success: true, data: json.data || json };
          }
          if (json && json.message) {
            lastError = json.message;
          }
        } else {
          lastError = `Server returned status ${res.status}`;
        }
      } catch (err: any) {
        lastError = err?.message || 'Network timeout or connection failed';
      }
    }

    return { success: false, message: lastError };
  }
}
