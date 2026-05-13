function resolveUniPlatform() {
  if (typeof uni === 'undefined' || typeof uni.getSystemInfoSync !== 'function') {
    return '';
  }

  try {
    return String((uni.getSystemInfoSync() as { uniPlatform?: string }).uniPlatform ?? '').toLowerCase();
  } catch {
    return '';
  }
}

function pickEnvValue(...values: Array<string | undefined>) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return '';
}

const uniPlatform = resolveUniPlatform();
const isMpWeixin = uniPlatform === 'mp-weixin';
const isDev = import.meta.env.DEV;
const mpApiBaseUrl = pickEnvValue(
  isDev ? import.meta.env.VITE_MP_WEIXIN_DEV_API_BASE_URL : undefined,
  import.meta.env.VITE_MP_WEIXIN_API_BASE_URL,
);
const mpFileServiceBaseUrl = pickEnvValue(
  isDev ? import.meta.env.VITE_MP_WEIXIN_DEV_FILE_SERVICE_BASE_URL : undefined,
  import.meta.env.VITE_MP_WEIXIN_FILE_SERVICE_BASE_URL,
);

export const appEnv = {
  apiBaseUrl: isMpWeixin ? mpApiBaseUrl : import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1',
  fileServiceBaseUrl: isMpWeixin
    ? mpFileServiceBaseUrl
    : import.meta.env.VITE_FILE_SERVICE_BASE_URL || 'http://localhost:3000/api',
};
