import { http } from '../services/request';
import type {
  ApiEnvelope,
  LoginResponseData,
  MeResponseData,
  UpdateProfilePayload,
} from '../types/auth';

export function loginWithCode(code: string) {
  return http.post<ApiEnvelope<LoginResponseData>>('/auth/wechat-login', {
    code,
    platform: 'mp-weixin',
  });
}

export function fetchMe() {
  return http.get<ApiEnvelope<MeResponseData>>('/me');
}

export function updateMyProfile(payload: UpdateProfilePayload) {
  return http.put<ApiEnvelope<MeResponseData>, UpdateProfilePayload>(
    '/me/profile',
    payload,
  );
}
