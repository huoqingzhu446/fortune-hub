import { clearSession } from './session';

export interface AppRequestError {
  statusCode?: number;
  code?: number | string;
  message: string;
  authExpired?: boolean;
  raw?: unknown;
}

export function getErrorMessage(error: unknown, fallback = '请求失败，请稍后再试') {
  if (typeof error === 'string' && error.trim()) {
    return error;
  }

  if (error && typeof error === 'object') {
    const candidates = [
      (error as { message?: unknown }).message,
      (error as { errmsg?: unknown }).errmsg,
      (error as { errMsg?: unknown }).errMsg,
    ];

    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.trim()) {
        return candidate;
      }

      if (Array.isArray(candidate)) {
        const firstMessage = candidate.find(
          (item) => typeof item === 'string' && item.trim(),
        );
        if (typeof firstMessage === 'string') {
          return firstMessage;
        }
      }
    }
  }

  return fallback;
}

export function normalizeRequestError(
  error: unknown,
  extras?: Partial<AppRequestError>,
): AppRequestError {
  return {
    message: getErrorMessage(error),
    raw: error,
    ...(extras || {}),
  };
}

export function isAuthExpiredError(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false;
  }

  return Boolean((error as AppRequestError).authExpired);
}

export function handleAuthExpired(error: unknown, redirectToProfile = false) {
  if (!isAuthExpiredError(error)) {
    return false;
  }

  clearSession();
  uni.showToast({
    title: getErrorMessage(error, '登录状态已失效，请重新登录'),
    icon: 'none',
  });

  if (redirectToProfile) {
    setTimeout(() => {
      uni.navigateTo({
        url: '/pages/profile/index',
      });
    }, 120);
  }

  return true;
}
