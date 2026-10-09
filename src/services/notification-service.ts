import { Platform } from 'react-native';
import { API_BASE_URL } from './auth-service';

export interface CivicAlert {
  id: string;
  numericId?: number;
  title: string;
  body: string;
  bodyHtml?: string;
  category: string;
  priority?: string;
  timestamp: string;
  createdAt?: string;
  sender?: string;
  attachmentUrl?: string | null;
  isRead: boolean;
}

function resolveAttachmentUrl(rawUrl?: string | null): string | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return null;

  if (trimmed.startsWith('data:image/')) {
    return trimmed;
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    // If it points to civentral.tech or api-citizen.civentral.tech, static assets are hosted on citizenship.civentral.tech
    return trimmed
      .replace('https://civentral.tech/', 'https://citizenship.civentral.tech/')
      .replace('http://civentral.tech/', 'https://citizenship.civentral.tech/')
      .replace('api-citizen.civentral.tech', 'citizenship.civentral.tech');
  }

  // Handle relative paths like 'assets/uploads/...' or '/assets/uploads/...'
  const cleanPath = trimmed.replace(/^\/+/, '');
  return `https://citizenship.civentral.tech/${cleanPath}`;
}

export class NotificationService {
  /**
   * Fetch Real Citizen Notifications from PHP Backend API
   * Endpoints: Localhost XAMPP or production civentral.tech
   */
  static async getCivicAlerts(identifier?: string): Promise<CivicAlert[]> {
    const isLocalhost =
      Platform.OS === 'web' &&
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    const candidateEndpoints = [
      `${API_BASE_URL}/get-notifications.php`,
      `${API_BASE_URL}/notifications`,
      ...(isLocalhost
        ? [
            'http://localhost/citizen-backend/api/citizen/get-notifications.php',
            'http://localhost/citizen-information-and-engagement-final-try/api/citizen/get-notifications.php',
            'http://127.0.0.1/citizen-backend/api/citizen/get-notifications.php',
          ]
        : []),
    ];

    for (const ep of candidateEndpoints) {
      try {
        const res = await fetch(ep, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });

        if (res.ok) {
          const json = await res.json();
          if (json.status === 'success' && Array.isArray(json.data)) {
            return json.data.map((item: any) => ({
              id: item.id || `ALT-${item.numericId || Math.random()}`,
              numericId: item.numericId,
              title: item.title || 'City Announcement',
              body: item.body || item.message || '',
              bodyHtml: item.bodyHtml || item.body || '',
              category: item.category || 'Broadcast',
              priority: item.priority || 'Normal',
              timestamp: item.timestamp || 'Just now',
              createdAt: item.createdAt,
              sender: item.sender || 'Caloocan Public Information Office',
              attachmentUrl: resolveAttachmentUrl(item.attachmentUrl || item.rawAttachment),
              isRead: Boolean(item.isRead),
            }));
          }
        }
      } catch (err) {
        // Try next endpoint in loop
      }
    }

    return [];
  }
}

