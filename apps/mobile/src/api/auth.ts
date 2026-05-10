import { http } from '../services/request';
import type {
  ApiEnvelope,
  BindPhonePayload,
  LoginPayload,
  LoginResponseData,
  MeResponseData,
  PhoneCodePayload,
  PhoneCodeResponseData,
  PhoneLoginPayload,
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

export function sendPhoneCode(payload: PhoneCodePayload) {
  return http.post<ApiEnvelope<PhoneCodeResponseData>, PhoneCodePayload>(
    '/auth/phone-code',
    payload,
  );
}

export function loginWithPhone(payload: PhoneLoginPayload) {
  return http.post<ApiEnvelope<LoginResponseData>, PhoneLoginPayload>(
    '/auth/phone-login',
    payload,
  );
}

export function bindMyPhone(payload: BindPhonePayload) {
  return http.post<ApiEnvelope<MeResponseData>, BindPhonePayload>(
    '/me/phone/bind',
    payload,
  );
}

export function updateMyProfile(payload: UpdateProfilePayload) {
  return http.put<ApiEnvelope<MeResponseData>, UpdateProfilePayload>(
    '/me/profile',
    payload,
  );
}
