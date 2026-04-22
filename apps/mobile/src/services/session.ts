import type { UserProfile } from '../types/auth';

const AUTH_TOKEN_KEY = 'fortune-hub-auth-token';
const AUTH_USER_KEY = 'fortune-hub-auth-user';

export function getAuthToken() {
  return uni.getStorageSync(AUTH_TOKEN_KEY) as string | '';
}

export function setAuthToken(token: string) {
  uni.setStorageSync(AUTH_TOKEN_KEY, token);
}

export function clearAuthToken() {
  uni.removeStorageSync(AUTH_TOKEN_KEY);
}

export function getCachedUser() {
  return (uni.getStorageSync(AUTH_USER_KEY) as UserProfile | null) ?? null;
}

export function setCachedUser(user: UserProfile) {
  uni.setStorageSync(AUTH_USER_KEY, user);
}

export function clearCachedUser() {
  uni.removeStorageSync(AUTH_USER_KEY);
}

export function clearSession() {
  clearAuthToken();
  clearCachedUser();
}
