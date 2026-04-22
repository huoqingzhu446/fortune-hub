import { http } from '../services/request';
import type {
  ApiEnvelope,
  LoginPayload,
  LoginResponseData,
  MeResponseData,
  UpdateProfilePayload,
} from '../types/auth';

export function loginWithCode(
  code: string,
  extras?: Omit<LoginPayload, 'code' | 'platform'>,
) {
  return http.post<ApiEnvelope<LoginResponseData>, LoginPayload>('/auth/wechat-login', {
    code,
    platform: 'mp-weixin',
    ...extras,
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
