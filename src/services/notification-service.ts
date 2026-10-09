import { API_BASE_URL } from './auth-service';

export interface CivicAlert {
  id: string;
  numericId?: number;
  title: string;
  body: string;
  bodyHtml?: string;
  category: string;
  rawCategory?: string;
  priority?: 'Normal' | 'High' | 'Urgent' | string;
  timestamp: string;
  createdAt?: string;
  sender?: string;
  senderRole?: string;
  attachmentUrl?: string | null;
  rawAttachment?: string | null;
  isRead: boolean;
}

export class NotificationService {
  /**
   * Fetch Real Citizen Notifications from PHP Backend API
   * Endpoint: https://api-citizen.civentral.tech/api/citizen/get-notifications.php
   */
  static async getCivicAlerts(identifier?: string): Promise<CivicAlert[]> {
    try {
      const endpoints = [
        `${API_BASE_URL}/notifications`,
        `${API_BASE_URL}/get-notifications.php`,
        'https://api-citizen.civentral.tech/api/citizen/get-notifications.php',
        'https://citizenship.civentral.tech/api/citizen/get-notifications.php',
        'http://localhost/citizen-information-and-engagement-final-try/api/citizen/get-notifications.php',
      ];
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
        return json.data.map((item: any) => {
          const alertId = item.id || item.alert_id || item.notification_id || `ALT-${item.numericId || Math.random()}`;
          const cat = item.rawCategory || item.category || 'General Announcement';
          return {
            id: String(alertId),
            numericId: item.numericId ? Number(item.numericId) : undefined,
            title: item.title || 'City Announcement',
            body: item.body || item.message || '',
            bodyHtml: item.bodyHtml || item.body || item.message || '',
            category: cat,
            rawCategory: cat,
            priority: item.priority || 'Normal',
            timestamp: item.timestamp || item.created_at || 'Just now',
            createdAt: item.createdAt || item.created_at,
            sender: item.sender || item.sender_name || 'Caloocan Public Information Office',
            senderRole: item.sender_role,
            attachmentUrl: item.attachmentUrl || null,
            rawAttachment: item.rawAttachment || null,
            isRead: Boolean(item.is_read || item.isRead),
          };
        });
      }

      return [];
    } catch {
      return [];
    }
  }
}
