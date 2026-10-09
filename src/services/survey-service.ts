import { Platform } from 'react-native';
import { API_BASE_URL } from './auth-service';

export interface SurveyQuestion {
  id: string;
  title: string;
  type:
    | 'multiple_choice'
    | 'multiple_selection'
    | 'yes_no'
    | 'rating_scale'
    | 'likert_scale'
    | 'short_answer'
    | 'long_answer';
  options?: string[];
  required?: boolean;
}

export interface SurveyItem {
  id: string;
  surveyCode?: string;
  title: string;
  shortDescription: string;
  category: string;
  estimatedTime: string;
  closingDate: string;
  status: 'Open' | 'Completed' | 'Closing Soon';
  isPublicResults: boolean;
  questions: SurveyQuestion[];
}

export interface ConsultationItem {
  id: string;
  consultationCode?: string;
  title: string;
  category: string;
  closingDate: string;
  backgroundInfo: string;
  objective: string;
  participantsCount: number;
  status?: string;
}

export interface SubmitSurveyPayload {
  survey_id: string | number;
  answers: Record<string, any>;
  citizen_name?: string;
  barangay?: string;
  overall_rating?: number | null;
  commentary?: string | null;
  citizen_id?: number | null;
}

export interface SubmitConsultationPayload {
  consultation_id: string | number;
  stance: 'In Favor' | 'Neutral' | 'Against' | 'Suggested Amendments';
  commentary: string;
  citizen_name?: string;
  barangay?: string;
  citizen_id?: number | null;
}

export class SurveyService {
  /**
   * Determine candidate endpoints prioritizing Dokploy live cloud API
   */
  private static getCandidateEndpoints(endpointName: string): string[] {
    const isLocalhost =
      Platform.OS === 'web' &&
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    return [
      `${API_BASE_URL}/${endpointName}`,
      `https://citizenship.civentral.tech/api/citizen/${endpointName}`,
      ...(isLocalhost
        ? [
            `http://localhost/citizen-information-and-engagement-final-try/api/citizen/${endpointName}`,
            `http://127.0.0.1/citizen-information-and-engagement-final-try/api/citizen/${endpointName}`,
            `http://localhost/citizen-backend/api/citizen/${endpointName}`,
          ]
        : []),
    ];
  }

  /**
   * Safe JSON parser that recovers from any leading/trailing HTML or warnings
   */
  private static parseJsonSafely(text: string): any {
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          return JSON.parse(match[0]);
        } catch {}
      }
    }
    return null;
  }

  /**
   * Fetches active surveys from the backend
   */
  public static async getSurveys(): Promise<SurveyItem[]> {
    const endpoints = this.getCandidateEndpoints('get-surveys.php');

    for (const ep of endpoints) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 12000);

        const res = await fetch(ep, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (res.ok) {
          const rawText = await res.text();
          const json = this.parseJsonSafely(rawText);
          if (json && (json.success === true || json.status === 'success') && Array.isArray(json.data)) {
            return json.data as SurveyItem[];
          }
        }
      } catch (err) {
        console.warn(`[SurveyService] Failed to load surveys from ${ep}:`, err);
      }
    }

    return [];
  }

  /**
   * Fetches civic public consultations from the backend
   */
  public static async getConsultations(): Promise<ConsultationItem[]> {
    const endpoints = this.getCandidateEndpoints('get-consultations.php');

    for (const ep of endpoints) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 12000);

        const res = await fetch(ep, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (res.ok) {
          const rawText = await res.text();
          const json = this.parseJsonSafely(rawText);
          if (json && (json.success === true || json.status === 'success') && Array.isArray(json.data)) {
            return json.data as ConsultationItem[];
          }
        }
      } catch (err) {
        console.warn(`[SurveyService] Failed to load consultations from ${ep}:`, err);
      }
    }

    return [];
  }

  /**
   * Submits survey questionnaire answers to the backend
   */
  public static async submitSurveyResponse(
    payload: SubmitSurveyPayload
  ): Promise<{ success: boolean; data?: any; message?: string }> {
    const endpoints = this.getCandidateEndpoints('submit-survey-response.php');
    let lastError = 'Failed to submit survey response to the server.';

    for (const ep of endpoints) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 35000);

        const res = await fetch(ep, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (res.ok) {
          const rawText = await res.text();
          const json = this.parseJsonSafely(rawText);
          if (json && (json.success === true || json.status === 'success')) {
            return {
              success: true,
              data: json.data || json,
              message: json.message || 'Survey response recorded successfully.',
            };
          }
          if (json && json.message) {
            lastError = json.message;
          }
        } else {
          lastError = `Server returned HTTP status ${res.status}`;
        }
      } catch (err: any) {
        lastError = err?.message || 'Network timeout or connection failed';
      }
    }

    return { success: false, message: lastError };
  }

  /**
   * Submits citizen opinion / position to civic public consultation
   */
  public static async submitConsultationFeedback(
    payload: SubmitConsultationPayload
  ): Promise<{ success: boolean; data?: any; message?: string }> {
    const endpoints = this.getCandidateEndpoints('submit-consultation-feedback.php');
    let lastError = 'Failed to submit consultation feedback to the server.';

    for (const ep of endpoints) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 35000);

        const res = await fetch(ep, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (res.ok) {
          const rawText = await res.text();
          const json = this.parseJsonSafely(rawText);
          if (json && (json.success === true || json.status === 'success')) {
            return {
              success: true,
              data: json.data || json,
              message: json.message || 'Consultation feedback recorded successfully.',
            };
          }
          if (json && json.message) {
            lastError = json.message;
          }
        } else {
          lastError = `Server returned HTTP status ${res.status}`;
        }
      } catch (err: any) {
        lastError = err?.message || 'Network timeout or connection failed';
      }
    }

    return { success: false, message: lastError };
  }
}
