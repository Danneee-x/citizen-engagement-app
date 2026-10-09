import { Platform } from 'react-native';
import { API_BASE_URL } from './auth-service';

export interface ConcernPhotoItem {
  id?: string;
  name: string;
  size?: string;
  uri?: string;
  data?: string;
}

export interface SubmitConcernPayload {
  title: string;
  description: string;
  category: string;
  sub_category?: string;
  location: string;
  barangay: string;
  district?: string;
  gps_coordinates?: string | null;
  citizen_user_id?: number | null;
  citizen_name?: string;
  citizen_phone?: string;
  citizen_email?: string;
  is_anonymous?: boolean;
  photos?: ConcernPhotoItem[];
}

export interface ConcernSubmissionResponse {
  status: 'success' | 'error';
  message?: string;
  ticket_number: string;
  concern_id?: number;
  data: {
    ticket_number: string;
    title: string;
    category: string;
    status: string;
    priority: string;
    detected_category: string;
    recommended_department: string;
    confidence_score: string;
    similar_concerns: string;
    submission_date: string;
  };
}

export class ConcernService {
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
      console.warn('Could not convert photo URI to base64:', err);
      return null;
    }
  }

  /**
   * Submits a citizen grievance concern to the backend MySQL database
   */
  public static async submitConcern(
    payload: SubmitConcernPayload
  ): Promise<ConcernSubmissionResponse> {
    // 1. Convert attached photos to base64
    const processedPhotos: { name: string; data?: string }[] = [];
    if (payload.photos && payload.photos.length > 0) {
      for (const p of payload.photos) {
        let base64Data = p.data;
        if (!base64Data && p.uri) {
          base64Data = (await this.uriToBase64(p.uri)) || undefined;
        }
        processedPhotos.push({
          name: p.name || 'evidence_photo.jpg',
          data: base64Data,
        });
      }
    }

    const requestPayload = {
      ...payload,
      photos: processedPhotos,
    };

    // 2. Determine Candidate Endpoints with Multi-Network Fallback
    const isLocalhost =
      Platform.OS === 'web' &&
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    const candidateEndpoints = [
      `${API_BASE_URL}/submit-concern.php`,
      ...(isLocalhost
        ? [
            'http://localhost/citizen-information-and-engagement-final-try/api/citizen/submit-concern.php',
            'http://127.0.0.1/citizen-information-and-engagement-final-try/api/citizen/submit-concern.php',
          ]
        : []),
    ];

    let lastError = 'Failed to connect to the concern submission server.';

    // 3. Attempt endpoint transmission
    for (const endpoint of candidateEndpoints) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 35000);

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(requestPayload),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (res.ok) {
          const json = await res.json();
          if (json && (json.status === 'success' || json.ticket_number)) {
            console.log('Successfully filed concern in MySQL database via:', endpoint, json);
            return json as ConcernSubmissionResponse;
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

    throw new Error(lastError);
  }

  /**
   * Fetches citizen grievance reports from the database with multi-endpoint fallback
   */
  public static async getMyReports(
    citizenUserId?: number | null,
    citizenEmail?: string | null,
    citizenPhone?: string | null
  ): Promise<any[]> {
    if (!citizenUserId && !citizenEmail && !citizenPhone) {
      return [];
    }

    const isLocalhost =
      Platform.OS === 'web' &&
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    const params = new URLSearchParams();
    if (citizenUserId) params.append('citizen_user_id', String(citizenUserId));
    if (citizenEmail) params.append('citizen_email', citizenEmail);
    if (citizenPhone) params.append('citizen_phone', citizenPhone);

    const queryStr = params.toString() ? `?${params.toString()}` : '';

    const candidateEndpoints = [
      `${API_BASE_URL}/submit-concern.php${queryStr}`,
      ...(isLocalhost
        ? [
            `http://localhost/citizen-information-and-engagement-final-try/api/citizen/submit-concern.php${queryStr}`,
            `http://127.0.0.1/citizen-information-and-engagement-final-try/api/citizen/submit-concern.php${queryStr}`,
          ]
        : []),
    ];

    for (const endpoint of candidateEndpoints) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        const res = await fetch(endpoint, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (res.ok) {
          const json = await res.json();
          if (json && json.status === 'success' && Array.isArray(json.recent_submissions)) {
            return json.recent_submissions;
          }
        }
      } catch (err) {
        // try next endpoint
      }
    }
    return [];
  }
}