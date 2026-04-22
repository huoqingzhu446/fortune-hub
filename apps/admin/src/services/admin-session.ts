const ADMIN_TOKEN_KEY = 'fortune-hub-admin-token';

function canUseStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}

export function getAdminToken() {
  if (!canUseStorage()) {
    return '';
  }

  return window.localStorage.getItem(ADMIN_TOKEN_KEY) || '';
}

export function setAdminToken(token: string) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function clearAdminToken() {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(ADMIN_TOKEN_KEY);
}
