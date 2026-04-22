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

        reject(response.data);
      },
      fail: reject,
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
