export interface ApiEnvelope<TData> {
  code: number;
  message: string;
  data: TData;
  timestamp: string;
}

export interface UserProfile {
  id: string;
  openid: string | null;
  phoneMasked: string | null;
  phoneVerifiedAt: string | null;
  lastLoginProvider: string | null;
  nickname: string | null;
  avatarUrl: string | null;
  birthday: string | null;
  birthTime: string | null;
  birthPlace: string | null;
  gender: string;
  zodiac: string | null;
  baziSummary: string | null;
  fiveElements: Record<string, number> | null;
  preferences?: Record<string, unknown> | null;
  vipStatus: string;
  vipExpiredAt: string | null;
}

export interface LoginResponseData {
  token: string;
  expiresIn: number;
  authMode: 'wechat' | 'mock' | 'phone';
  authProviderLabel: string;
  user: UserProfile;
  isProfileCompleted: boolean;
}

export interface LoginPayload {
  code: string;
  platform: 'mp-weixin';
  nickname?: string;
  avatarUrl?: string;
}

export interface PhoneCodePayload {
  phone: string;
  scene?: 'login' | 'bind';
}

export interface PhoneLoginPayload {
  phone: string;
  code: string;
  nickname?: string;
  avatarUrl?: string;
}

export interface BindPhonePayload {
  phone: string;
  code: string;
}

export interface PhoneCodeResponseData {
  expiresIn: number;
  cooldownSeconds: number;
}

export interface MeResponseData {
  user: UserProfile;
  isProfileCompleted: boolean;
}

export interface UpdateProfilePayload {
  nickname?: string;
  avatarUrl?: string;
  birthday: string;
  gender: 'male' | 'female' | 'unknown';
  birthTime?: string;
  birthPlace?: string;
}
