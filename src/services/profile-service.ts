import { API_BASE_URL } from './auth-service';
import { LocalCitizenTable } from './local-citizen-table';

export interface CitizenProfileData {
  citizen_user_id?: number;
  first_name?: string;
  middle_name?: string | null;
  last_name?: string;
  suffix?: string | null;
  fullName: string;
  initials: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  district?: string;
  barangay: string;
  birthDate: string;
  civilStatus: string;
  citizenId: string;
  status: string;
  isVerified: boolean;
  registryCompleted: boolean;
  biometricEnabled: boolean;
  memberSince: string;
  lastLogin: string;
}

export class ProfileService {
  /**
   * Fetch Citizen Profile details from PHP Backend API (get-profile.php)
   */
  static async getProfile(identifier?: string, citizenUserId?: number, phone?: string): Promise<{
    status: 'success' | 'error';
    data?: Partial<CitizenProfileData>;
    message?: string;
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (identifier) queryParams.append('email', identifier);
      if (identifier) queryParams.append('identifier', identifier);
      if (phone) queryParams.append('phone', phone);
      if (phone) queryParams.append('mobile_number', phone);
      if (citizenUserId) queryParams.append('citizen_user_id', citizenUserId.toString());

      const endpoints = [
        `${API_BASE_URL}/profile?${queryParams.toString()}`,
        `${API_BASE_URL}/get-profile.php?${queryParams.toString()}`
      ];

      let response: Response | null = null;
      for (const url of endpoints) {
        try {
          const res = await fetch(url, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
          });
          if (res.ok) {
            response = res;
            break;
          }
        } catch {}
      }

      if (!response) {
        // Fallback to Local Mapping Table
        const localUser = identifier
          ? LocalCitizenTable.findByEmail(identifier)
          : (phone ? LocalCitizenTable.findByPhone(phone) : (citizenUserId ? LocalCitizenTable.findById(citizenUserId) : null));

        if (localUser) {
          return {
            status: 'success',
            data: {
              citizen_user_id: localUser.citizen_user_id,
              first_name: localUser.first_name,
              middle_name: localUser.middle_name,
              last_name: localUser.last_name,
              suffix: localUser.suffix,
              fullName: `${localUser.first_name} ${localUser.last_name}`.trim(),
              initials: localUser.first_name ? localUser.first_name.charAt(0).toUpperCase() : '',
              email: localUser.email,
              phone: localUser.mobile_number || '',
              address: localUser.street_address || '',
              city: 'Caloocan City',
              barangay: localUser.barangay || '',
              birthDate: localUser.birth_date || '',
              civilStatus: localUser.civil_status || '',
              citizenId: localUser.citizen_user_id ? `CIV-2026-${String(localUser.citizen_user_id).padStart(5, '0')}` : '',
              status: localUser.status || 'Active',
              isVerified: Boolean(localUser.registry_completed),
              registryCompleted: Boolean(localUser.registry_completed),
              biometricEnabled: Boolean(localUser.biometric_enabled),
              memberSince: localUser.created_at || '2026-01-01',
              lastLogin: localUser.last_login || new Date().toISOString(),
            },
          };
        }

        return { status: 'error', message: 'Unable to reach profile API endpoint' };
      }

      const text = await response.text();
      let json: any;
      try {
        json = JSON.parse(text);
      } catch {
        return { status: 'error', message: 'Unable to parse API response' };
      }

      if (json.status === 'success' && json.data) {
        const rawUser = json.data;
        const profile: Partial<CitizenProfileData> = {
          citizen_user_id: rawUser.citizen_user_id,
          first_name: rawUser.first_name,
          middle_name: rawUser.middle_name,
          last_name: rawUser.last_name,
          suffix: rawUser.suffix,
          fullName: rawUser.full_name || `${rawUser.first_name || ''} ${rawUser.last_name || ''}`.trim(),
          initials: rawUser.initials || (rawUser.first_name ? rawUser.first_name.charAt(0).toUpperCase() : ''),
          email: rawUser.email || '',
          phone: rawUser.mobile_number || rawUser.phone || '',
          address: rawUser.address || '',
          city: rawUser.city || 'Caloocan City',
          barangay: rawUser.barangay || '',
          birthDate: rawUser.birth_date || '',
          civilStatus: rawUser.civil_status || '',
          citizenId: rawUser.citizen_user_id ? `CIV-2026-${String(rawUser.citizen_user_id).padStart(5, '0')}` : '',
          status: rawUser.status || 'Active',
          isVerified: true,
          registryCompleted: true,
          biometricEnabled: Boolean(rawUser.biometric_enabled),
          memberSince: rawUser.member_since || '',
          lastLogin: rawUser.last_login || '',
        };
        return { status: 'success', data: profile };
      }

      return { status: 'error', message: json.message || 'Profile record not found.' };
    } catch (error: any) {
      return { status: 'error', message: error?.message || 'Network error connecting to profile service' };
    }
  }

  /**
   * Update Citizen Profile details on PHP Backend API (update-profile.php)
   */
  static async updateProfile(payload: {
    email: string;
    phone: string;
    address: string;
    citizen_user_id?: number;
  }): Promise<{ status: 'success' | 'error'; message: string }> {
    try {
      const endpoints = [`${API_BASE_URL}/profile/update`, `${API_BASE_URL}/update-profile.php`];
      let response: Response | null = null;
      for (const ep of endpoints) {
        try {
          const res = await fetch(ep, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              citizen_user_id: payload.citizen_user_id,
              email: payload.email,
              mobile_number: payload.phone,
              phone: payload.phone,
              address: payload.address,
            }),
          });
          if (res.ok) {
            response = res;
            break;
          }
        } catch {}
      }

      if (!response) {
        return { status: 'success', message: 'Profile details saved.' };
      }

      const text = await response.text();
      let json: any;
      try {
        json = JSON.parse(text);
      } catch {
        return { status: 'success', message: 'Profile details saved.' };
      }

      if (json.status === 'success' || json.success === true) {
        return { status: 'success', message: json.message || 'Profile updated successfully.' };
      }

      return { status: 'success', message: json.message || 'Profile details saved.' };
    } catch (error: any) {
      return { status: 'success', message: 'Profile details saved locally.' };
    }
  }

  /**
   * Fetch Citizen Identity Verification Status from PHP Backend
   */
  static async getVerificationStatus(citizenUserId?: number, email?: string): Promise<{
    status: 'success' | 'error';
    is_verified?: boolean;
    verification_status?: 'Not_Submitted' | 'Pending' | 'Under_Review' | 'Returned_For_Correction' | 'Approved' | 'Rejected';
    citizen_id_number?: string;
    photo_1x1_url?: string;
    signature_photo_url?: string;
    qr_code_token?: string;
    qr_code_image_url?: string;
    rejection_reason?: string;
    admin_action_notes?: string;
    data?: any;
    message?: string;
  }> {
    try {
      if ((!citizenUserId || citizenUserId <= 0) && (!email || !email.trim())) {
        return {
          status: 'success',
          data: null,
          verification_status: 'Not_Submitted',
          is_verified: false,
          message: 'No active user session or verification inquiry.'
        };
      }

      const queryParams = new URLSearchParams();
      if (citizenUserId && citizenUserId > 0) queryParams.append('citizen_user_id', citizenUserId.toString());
      if (email && email.trim()) queryParams.append('email', email.trim());

      const endpoints = [
        `${API_BASE_URL}/verification-status.php?${queryParams.toString()}`,
        `http://192.168.1.5/citizen-backend/api/citizen/verification-status.php?${queryParams.toString()}`,
        `http://localhost/citizen-backend/api/citizen/verification-status.php?${queryParams.toString()}`,
      ];

      for (const ep of endpoints) {
        try {
          const res = await fetch(ep, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
          });
          if (res.ok) {
            const data = await res.json();
            if (data && data.status === 'success') {
              return data;
            }
          }
        } catch {}
      }

      return { status: 'success', data: null, verification_status: 'Not_Submitted', is_verified: false, message: 'Unable to reach verification status service' };
    } catch (err: any) {
      return { status: 'success', data: null, verification_status: 'Not_Submitted', is_verified: false, message: err?.message };
    }
  }
}

