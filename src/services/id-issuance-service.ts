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
  status: 'Pending Review' | 'Under Review' | 'Approved' | 'Ready for Release' | 'Claimed' | 'Rejected' | string;
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

    return isLocalhost
      ? [
          'http://localhost/citizen-backend/api/citizen/submit-id-application.php',
          'http://127.0.0.1/citizen-backend/api/citizen/submit-id-application.php',
          `${API_BASE_URL}/submit-id-application.php`,
        ]
      : [
          `${API_BASE_URL}/submit-id-application.php`,
          'http://localhost/citizen-backend/api/citizen/submit-id-application.php',
          'http://10.0.2.2/citizen-backend/api/citizen/submit-id-application.php',
          'http://192.168.100.15/citizen-backend/api/citizen/submit-id-application.php',
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
  public static async submitApplication(payload: SubmitIdApplicationPayload): Promise<boolean> {
    const endpoints = this.getCandidateEndpoints();

    for (const ep of endpoints) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        const res = await fetch(ep, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (res.ok) {
          const json = await res.json();
          if (json && json.status === 'success') {
            return true;
          }
        }
      } catch (err) {
        // Continue to fallback endpoint
      }
    }

    return false;
  }
}
