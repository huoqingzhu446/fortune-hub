import { http } from '../services/request';
import type {
  SubscribeNotificationPayload,
  SubscribeNotificationResponse,
} from '../types/settings';

export function subscribeNotification(payload: SubscribeNotificationPayload) {
  return http.post<
    SubscribeNotificationResponse,
    SubscribeNotificationPayload
  >('/notifications/subscribe', payload);
}
