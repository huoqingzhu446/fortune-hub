import { appEnv } from '../config/env';
import { getAuthToken } from '../services/session';

let installed = false;

function withBaseUrl(url: string | undefined, baseUrl: string) {
  if (!url) {
    return baseUrl;
  }

  if (/^https?:\/\//.test(url)) {
    return url;
  }

  return `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`;
}

export function installHttpInterceptors() {
  if (installed) {
    return;
  }

  uni.addInterceptor('request', {
    invoke(args) {
      args.timeout = args.timeout ?? 12000;
      args.url = withBaseUrl(args.url, appEnv.apiBaseUrl);
      const token = getAuthToken();
      args.header = {
        'X-Client': 'fortune-hub-mobile',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...args.header,
      };
    },
  });

  uni.addInterceptor('uploadFile', {
    invoke(args) {
      args.timeout = args.timeout ?? 20000;
      args.url = withBaseUrl(args.url, appEnv.fileServiceBaseUrl);
      args.header = {
        'X-Client': 'fortune-hub-mobile',
        ...args.header,
      };
    },
  });

  installed = true;
}
