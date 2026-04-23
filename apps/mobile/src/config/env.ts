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

const uniPlatform = resolveUniPlatform();
const isMpWeixin = uniPlatform === 'mp-weixin';

export const appEnv = {
  apiBaseUrl: isMpWeixin
    ? import.meta.env.VITE_MP_WEIXIN_API_BASE_URL ||
      import.meta.env.VITE_API_BASE_URL ||
      'http://8.152.214.57/api/v1'
    : import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1',
  fileServiceBaseUrl: isMpWeixin
    ? import.meta.env.VITE_MP_WEIXIN_FILE_SERVICE_BASE_URL ||
      import.meta.env.VITE_FILE_SERVICE_BASE_URL ||
      'http://8.152.214.57:3000/api'
    : import.meta.env.VITE_FILE_SERVICE_BASE_URL || 'http://8.152.214.57:3000/api',
};
