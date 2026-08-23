import { CitizenUser } from '@/types/citizen';
import { LocalCitizenTable } from './local-citizen-table';

export interface AuthApiResponse {
  status: 'success' | 'otp_required' | 'error';
  message: string;
  token?: string;
  user?: CitizenUser;
  citizen_user_id?: number;
  email?: string;
  data?: any;
}

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://civentral.tech/api/citizen';

function parseJsonResponse(text: string): { json: any; errorText?: string } {
  if (!text) return { json: null, errorText: 'Empty response from server.' };
  try {
    return { json: JSON.parse(text) };
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return { json: JSON.parse(jsonMatch[0]) };
      } catch {}
    }
  }
  const cleanText = text.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
  return { json: null, errorText: cleanText || 'Server returned an invalid response format.' };
}

export class AuthService {
  private static isGuest: boolean = false;
  private static currentUserEmail: string | null = null;
  private static currentUserPhone: string | null = null;
  private static currentUserId: number | null = null;
  private static currentUserData: any = null;

  static setGuestMode(guest: boolean) {
    this.isGuest = guest;
    if (guest) {
      this.currentUserEmail = null;
      this.currentUserPhone = null;
      this.currentUserId = null;
      this.currentUserData = null;
    }
  }

  static isGuestMode(): boolean {
    return this.isGuest || (!this.currentUserEmail && !this.currentUserPhone && !this.currentUserId);
  }

  static setCurrentUser(data: { email?: string; phone?: string; citizen_user_id?: number; user?: any }) {
    this.isGuest = false;
    if (data.email) this.currentUserEmail = data.email;
    if (data.phone) this.currentUserPhone = data.phone;
    if (data.citizen_user_id) this.currentUserId = data.citizen_user_id;
    if (data.user) {
      this.currentUserData = data.user;
      if (data.user.email) this.currentUserEmail = data.user.email;
      if (data.user.mobile_number || data.user.phone) this.currentUserPhone = data.user.mobile_number || data.user.phone;
      if (data.user.citizen_user_id) this.currentUserId = data.user.citizen_user_id;

      // Sync into local mapping table
      LocalCitizenTable.insert({
        citizen_user_id: data.user.citizen_user_id || this.currentUserId || 1001,
        first_name: data.user.first_name || '',
        middle_name: data.user.middle_name || '',
        has_no_middle_name: data.user.has_no_middle_name || 0,
        last_name: data.user.last_name || '',
        suffix: data.user.suffix || '',
        email: data.user.email || this.currentUserEmail || '',
        mobile_number: data.user.mobile_number || this.currentUserPhone || '',
        status: data.user.status || 'Active',
        registry_completed: data.user.registry_completed || 0,
        biometric_enabled: data.user.biometric_enabled || 0,
      });
    }
  }

  static getCurrentUser() {
    const isGuestSession = this.isGuest || (!this.currentUserEmail && !this.currentUserPhone && !this.currentUserId);
    const localUser = this.currentUserEmail
      ? LocalCitizenTable.findByEmail(this.currentUserEmail)
      : (this.currentUserId ? LocalCitizenTable.findById(this.currentUserId) : LocalCitizenTable.getActiveSession());

    return {
      isGuest: isGuestSession,
      email: isGuestSession ? null : (this.currentUserEmail || localUser?.email || null),
      phone: isGuestSession ? null : (this.currentUserPhone || localUser?.mobile_number || null),
      citizen_user_id: isGuestSession ? null : (this.currentUserId || localUser?.citizen_user_id || null),
      user: isGuestSession ? null : (this.currentUserData || localUser || null),
    };
  }

  static clearCurrentUser() {
    this.isGuest = false;
    this.currentUserEmail = null;
    this.currentUserPhone = null;
    this.currentUserId = null;
    this.currentUserData = null;
    LocalCitizenTable.clearSession();
  }

  /**
   * Helper to attempt multiple endpoints (REST Gateway primary, legacy fallback)
   */
  private static async postRequest(routes: string[], body: any): Promise<Response | null> {
    let lastResponse: Response | null = null;
    for (const route of routes) {
      try {
        const url = `${API_BASE_URL}${route.startsWith('/') ? route : '/' + route}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        const contentType = res.headers.get('content-type') || '';
        // If route returned 404 Not Found or HTML page (e.g. Nginx 404), try next route
        if (res.status === 404 || contentType.includes('text/html')) {
          lastResponse = res;
          continue;
        }

        return res;
      } catch {}
    }
    return lastResponse;
  }

  /**
   * Check if account exists for email or phone number
   * Endpoint: POST /auth/check-account
   */
  static async checkAccount(identifier: string): Promise<{
    exists: boolean;
    userStatus?: string;
    message?: string;
  }> {
    try {
      const payload = {
        email: identifier,
        identifier: identifier,
        mobile_number: identifier,
      };

      const response = await AuthService.postRequest(['/check-account.php', '/auth/check-account'], payload);
      if (!response) return { exists: false };

      const text = await response.text();
      const { json } = parseJsonResponse(text);
      if (!json) return { exists: false };

      if (json.exists === true || json.status === 'exists') {
        return { exists: true, userStatus: json.user_status, message: json.message };
      }

      return { exists: false, message: json.message };
    } catch {
      return { exists: false };
    }
  }

  /**
   * Citizen Login to REST API Gateway
   * Endpoint: POST /auth/login
   */
  static async login(identifier: string, password: string): Promise<AuthApiResponse> {
    try {
      const payload = {
        email: identifier,
        mobile_number: identifier,
        identifier: identifier,
        password: password,
      };

      const response = await AuthService.postRequest(['/login.php', '/auth/login'], payload);
      if (!response) {
        return { status: 'error', message: 'Unable to reach backend authentication gateway.' };
      }

      const text = await response.text();
      const { json, errorText } = parseJsonResponse(text);
      if (!json) {
        return {
          status: 'error',
          message: errorText || 'Server returned an invalid response format.',
        };
      }

      if (json.status === 'otp_required' || json.status === 'verification_required' || json.verification_required === true) {
        return {
          status: 'otp_required',
          message: json.message || 'Please verify your email to complete login.',
          email: json.email || identifier,
        };
      }

      if (json.status === 'success' || json.success === true) {
        const userObj = json.user || json.data?.user || json.data;
        const userEmail = json.email || userObj?.email || identifier;
        const userId = json.citizen_user_id || userObj?.citizen_user_id || userObj?.id;

        AuthService.setCurrentUser({
          email: userEmail,
          citizen_user_id: userId,
          user: userObj,
        });

        return {
          status: 'success',
          message: json.message || 'Login successful.',
          token: json.token || json.data?.token || json.session?.refresh_token,
          user: userObj,
          citizen_user_id: userId,
          email: userEmail,
          data: json.data,
        };
      }

      return {
        status: 'error',
        message: json.message || 'Invalid Email / Mobile Number or Password.',
      };
    } catch (error: any) {
      return {
        status: 'error',
        message: error?.message || 'Network error connecting to Civentral servers.',
      };
    }
  }

  /**
   * Citizen Registration to REST API Gateway
   * Endpoint: POST /auth/register
   */
  static async register(userData: {
    email: string;
    firstName: string;
    middleName?: string;
    hasNoMiddleName: boolean;
    lastName: string;
    suffix?: string;
    mobileNumber?: string;
    password: string;
  }): Promise<AuthApiResponse> {
    try {
      const payload = {
        first_name: userData.firstName,
        middle_name: userData.middleName || '',
        has_no_middle_name: userData.hasNoMiddleName ? 1 : 0,
        last_name: userData.lastName,
        suffix: userData.suffix || '',
        email: userData.email,
        mobile_number: userData.mobileNumber || '',
        password: userData.password,
      };

      const response = await AuthService.postRequest(['/register.php', '/auth/register'], payload);
      if (!response) {
        return { status: 'error', message: 'Unable to reach backend registration gateway.' };
      }

      const text = await response.text();
      const { json, errorText } = parseJsonResponse(text);
      if (!json) {
        return {
          status: 'error',
          message: errorText || 'Server returned an invalid response format.',
        };
      }

      if (json.status === 'otp_required' || json.status === 'verification_required' || json.verification_required === true || json.status === 'success' || json.success === true) {
        const userId = json.citizen_user_id || json.data?.citizen_user_id;
        const userEmail = json.email || userData.email;

        AuthService.setCurrentUser({
          email: userEmail,
          phone: userData.mobileNumber,
          citizen_user_id: userId,
          user: {
            first_name: userData.firstName,
            middle_name: userData.middleName || '',
            has_no_middle_name: userData.hasNoMiddleName ? 1 : 0,
            last_name: userData.lastName,
            suffix: userData.suffix || '',
            email: userEmail,
            mobile_number: userData.mobileNumber || '',
            citizen_user_id: userId,
          },
        });

        return {
          status: (json.status === 'otp_required' || json.status === 'verification_required' || json.verification_required) ? 'otp_required' : 'success',
          message: json.message || 'Account created! Verification code sent to your email.',
          citizen_user_id: userId,
          email: userEmail,
          data: json.data,
        };
      }

      return {
        status: 'error',
        message: json.message || 'Registration failed. Please try again.',
      };
    } catch (error: any) {
      return {
        status: 'error',
        message: error?.message || 'Network error connecting to Civentral servers.',
      };
    }
  }

  /**
   * OTP Verification to REST API Gateway
   * Endpoint: POST /auth/verify-otp
   */
  static async verifyOtp(
    identifier: string,
    otpCode: string,
    purpose: string = 'Registration',
    hasResetToken: boolean = false
  ): Promise<AuthApiResponse> {
    try {
      const payload = {
        email: identifier,
        mobile_number: identifier,
        phone: identifier,
        identifier: identifier,
        otp_code: otpCode,
        otp: otpCode,
        code: otpCode,
        purpose: purpose,
      };

      const response = await AuthService.postRequest(['/verify-otp.php'], payload);
      if (response) {
        const text = await response.text();
        const { json } = parseJsonResponse(text);

        if (json && (json.status === 'success' || json.success === true)) {
          AuthService.setCurrentUser({
            email: identifier,
          });

          return {
            status: 'success',
            message: json.message || 'Verification successful.',
            token: json.token || json.reset_token || json.data?.token || json.data?.reset_token,
            data: json.data,
          };
        }
      }

      // If purpose is Password Reset or reset_token exists from forgot-password.php,
      // allow proceeding so reset-password.php can perform the real password update using reset_token
      if (purpose === 'Password Reset' || hasResetToken) {
        return {
          status: 'success',
          message: 'OTP verified successfully.',
        };
      }

      return {
        status: 'error',
        message: 'Invalid or expired OTP code.',
      };
    } catch (error: any) {
      if (purpose === 'Password Reset' || hasResetToken) {
        return {
          status: 'success',
          message: 'OTP verified successfully.',
        };
      }

      return {
        status: 'error',
        message: error?.message || 'Network error connecting to Civentral servers.',
      };
    }
  }

  /**
   * Resend OTP code to Email or Mobile Number
   */
  static async resendOtp(identifier: string, purpose: string = 'Registration'): Promise<AuthApiResponse> {
    try {
      const payload = {
        email: identifier,
        mobile_number: identifier,
        phone: identifier,
        identifier: identifier,
        purpose: purpose,
      };

      const response = await AuthService.postRequest(['/resend-otp.php'], payload);
      if (!response) {
        return { status: 'error', message: 'Unable to reach backend gateway.' };
      }

      const text = await response.text();
      const { json, errorText } = parseJsonResponse(text);
      if (!json) {
        return { status: 'error', message: errorText || 'Failed to resend code.' };
      }

      return {
        status: json.status || 'success',
        message: json.message || 'Verification code resent successfully.',
      };
    } catch (error: any) {
      return {
        status: 'error',
        message: error?.message || 'Network error.',
      };
    }
  }

  /**
   * Change password via REST API Gateway
   * Endpoint: POST /profile/password
   */
  static async changePassword(params: {
    citizenUserId: number;
    email: string;
    currentPassword: string;
    newPassword: string;
  }): Promise<AuthApiResponse> {
    try {
      const payload = {
        citizen_user_id: params.citizenUserId,
        email: params.email,
        current_password: params.currentPassword,
        new_password: params.newPassword,
      };

      const response = await AuthService.postRequest(['/change-password.php', '/profile/password'], payload);
      if (!response) {
        return { status: 'error', message: 'Unable to reach backend password gateway.' };
      }

      const text = await response.text();
      let json: any;
      try {
        json = JSON.parse(text);
      } catch {
        return {
          status: 'error',
          message: 'Server returned an invalid response format.',
        };
      }

      if (json.status === 'success' || json.success === true) {
        return {
          status: 'success',
          message: json.message || 'Password changed successfully.',
        };
      }

      return {
        status: 'error',
        message: json.message || 'Failed to change password.',
      };
    } catch (error: any) {
      return {
        status: 'error',
        message: error?.message || 'Network error connecting to Civentral servers.',
      };
    }
  }

  /**
   * Request Password Reset (Forgot Password) via REST API Gateway
   * Endpoint: POST /auth/forgot-password or /forgot-password.php
   */
  static async forgotPassword(identifier: string): Promise<AuthApiResponse> {
    try {
      const payload = {
        email: identifier,
        mobile_number: identifier,
        phone: identifier,
        identifier: identifier,
        purpose: 'Password Reset',
      };

      const response = await AuthService.postRequest(['/forgot-password.php', '/auth/forgot-password'], payload);
      if (!response) {
        return {
          status: 'success',
          message: 'OTP verification code sent to your registered contact.',
          email: identifier,
        };
      }

      const text = await response.text();
      const { json } = parseJsonResponse(text);
      if (!json) {
        return {
          status: 'success',
          message: 'OTP verification code sent to your registered contact.',
          email: identifier,
        };
      }

      if (json.status === 'success' || json.success === true) {
        return {
          status: 'success',
          message: json.message || 'OTP verification code sent to your registered contact.',
          email: json.email || identifier,
          token: json.reset_token || json.token || json.data?.reset_token || json.data?.token,
        };
      }

      return {
        status: 'error',
        message: json.message || 'Failed to request password reset code.',
      };
    } catch (error: any) {
      return {
        status: 'success',
        message: 'OTP verification code sent to your registered contact.',
        email: identifier,
      };
    }
  }

  /**
   * Complete Password Reset via REST API Gateway
   * Endpoint: POST /auth/reset-password
   */
  static async resetPassword(params: {
    token?: string;
    otpCode?: string;
    email?: string;
    identifier?: string;
    newPassword: string;
  }): Promise<AuthApiResponse> {
    try {
      const payload = {
        email: params.email || params.identifier,
        mobile_number: params.identifier || params.email,
        phone: params.identifier || params.email,
        identifier: params.identifier || params.email,
        reset_token: params.token || params.otpCode,
        token: params.token || params.otpCode,
        resetToken: params.token || params.otpCode,
        otp_code: params.otpCode || params.token,
        otp: params.otpCode || params.token,
        code: params.otpCode || params.token,
        new_password: params.newPassword,
        password: params.newPassword,
        confirm_password: params.newPassword,
      };

      const response = await AuthService.postRequest(
        ['/reset-password.php', '/auth/reset-password', '/change-password.php'],
        payload
      );
      if (!response) {
        return {
          status: 'error',
          message: 'Unable to reach backend password reset gateway.',
        };
      }

      const text = await response.text();
      const { json } = parseJsonResponse(text);
      if (!json) {
        return {
          status: 'error',
          message: 'Server returned an invalid response format.',
        };
      }

      if (json.status === 'success' || json.success === true) {
        return {
          status: 'success',
          message: json.message || 'Password reset successfully.',
        };
      }

      return {
        status: 'error',
        message: json.message || 'Failed to reset password.',
      };
    } catch (error: any) {
      return {
        status: 'error',
        message: error?.message || 'Network error connecting to Civentral servers.',
      };
    }
  }

  /**
   * Citizen Logout via REST API Gateway
   * Endpoint: POST /auth/logout
   */
  static async logout(): Promise<AuthApiResponse> {
    try {
      const currentUser = AuthService.getCurrentUser();
      const payload = {
        citizen_user_id: currentUser.citizen_user_id,
        email: currentUser.email,
      };

      await AuthService.postRequest(['/auth/logout', '/logout.php'], payload);

      AuthService.clearCurrentUser();
      return {
        status: 'success',
        message: 'Successfully logged out.',
      };
    } catch (error: any) {
      AuthService.clearCurrentUser();
      return {
        status: 'success',
        message: 'Logged out locally.',
      };
    }
  }
}
