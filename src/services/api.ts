import { DomainApplication } from '@/types/domain';
import { API_BASE_URL } from './auth-service';
import { CertificateService } from './certificate-service';

export class CivicApiService {
  /**
   * Fetch Real Citizen Applications & Certificate Requests from PHP Backend API
   */
  static async getApplications(identifier?: string, citizenUserId?: number | null): Promise<DomainApplication[]> {
    try {
      const results: DomainApplication[] = [];

      // 1. Fetch real certificate requests from civentral_certificates table
      try {
        const certRequests = await CertificateService.getCertificateRequests(citizenUserId, identifier);
        if (Array.isArray(certRequests) && certRequests.length > 0) {
          certRequests.forEach((r: any) => {
            const rawStatus = r.status || 'Pending';
            let normStatus: 'Under Review' | 'Approved' | 'Completed' | 'Pending' = 'Under Review';
            if (rawStatus === 'Released' || rawStatus === 'Completed') normStatus = 'Completed';
            else if (rawStatus === 'Ready for Release' || rawStatus === 'Approved') normStatus = 'Approved';
            else normStatus = 'Under Review';

            results.push({
              id: r.reference_no || `CAL-DOC-${r.request_id}`,
              domainId: 'identity',
              serviceTitle: r.certificate_type || 'Barangay Certification',
              applicantId: r.citizen_name || identifier || '',
              status: normStatus,
              createdAt: r.created_at ? r.created_at.split(' ')[0] : 'Recent',
              updatedAt: r.updated_at ? r.updated_at.split(' ')[0] : (r.created_at ? r.created_at.split(' ')[0] : 'Recent'),
            });
          });
        }
      } catch {}

      if (results.length > 0) {
        return results;
      }
      const endpoints = [`${API_BASE_URL}/applications`, `${API_BASE_URL}/get-applications.php`];
      let response: Response | null = null;
      for (const ep of endpoints) {
        try {
          const res = await fetch(ep, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: identifier || '' }),
          });
          if (res.ok) {
            response = res;
            break;
          }
        } catch {}
      }

      if (!response) return [];

      const text = await response.text();
      let json: any;
      try {
        json = JSON.parse(text);
      } catch {
        return [];
      }

      if (json.status === 'success' && Array.isArray(json.data)) {
        return json.data.map((item: any) => ({
          id: item.application_id || item.id || `APP-${item.id}`,
          domainId: item.domain_id || item.domainId || 'identity',
          serviceTitle: item.service_title || item.title || 'Civic Service Application',
          applicantId: item.applicant_id || item.applicantId || '',
          status: item.status || 'Pending',
          createdAt: item.created_at || item.createdAt || '',
          updatedAt: item.updated_at || item.updatedAt || '',
        }));
      }

      return [];
    } catch {
      return [];
    }
  }
}
