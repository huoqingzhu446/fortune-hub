import { clearSession } from './session';

type RequestPayload = object | string | ArrayBuffer;

export interface RequestOptions<TData extends RequestPayload = RequestPayload> {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: TData;
  header?: Record<string, string>;
}

export function request<TResponse, TData extends RequestPayload = RequestPayload>(
  options: RequestOptions<TData>,
): Promise<TResponse> {
  return new Promise((resolve, reject) => {
    uni.request({
      url: options.url,
      method: options.method ?? 'GET',
      data: options.data,
      header: options.header,
      success: (response) => {
        if (response.statusCode >= 200 && response.statusCode < 300) {
          resolve(response.data as TResponse);
          return;
        }

        const payload = response.data as
          | {
              code?: number | string;
              message?: string | string[];
              error?: string;
              statusCode?: number;
            }
          | undefined;
        const payloadMessages = payload?.message;
        const message = Array.isArray(payloadMessages)
          ? payloadMessages.find((item) => typeof item === 'string' && item.trim()) ||
            payload?.error ||
            '请求失败，请稍后再试'
          : payload?.message || payload?.error || '请求失败，请稍后再试';
        const authExpired =
          response.statusCode === 401 ||
          (typeof message === 'string' && message.includes('重新登录'));

        if (authExpired) {
          clearSession();
        }

        reject({
          statusCode: response.statusCode,
          code: payload?.code,
          message,
          authExpired,
          raw: response.data,
        });
      },
      fail: (error) => {
        reject({
          statusCode: 0,
          message: (error as { errMsg?: string }).errMsg || '网络请求失败，请稍后重试',
          authExpired: false,
          raw: error,
        });
      },
    });
  });
}

export const http = {
  get<TResponse>(url: string, header?: Record<string, string>) {
    return request<TResponse>({
      url,
      method: 'GET',
      header,
    });
  },
  post<TResponse, TData extends RequestPayload = RequestPayload>(
    url: string,
    data?: TData,
    header?: Record<string, string>,
  ) {
    return request<TResponse, TData>({
      url,
      method: 'POST',
      data,
      header,
    });
  },
  put<TResponse, TData extends RequestPayload = RequestPayload>(
    url: string,
    data?: TData,
    header?: Record<string, string>,
  ) {
    return request<TResponse, TData>({
      url,
      method: 'PUT',
      data,
      header,
    });
  },
};
