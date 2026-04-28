type QueryValue = string | number | boolean | null | undefined;

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '');
}

function extractOrigin(url: string) {
  return url.match(/^(https?:\/\/[^/?#]+)/i)?.[1] ?? '';
}

export function resolveUrl(path: string, baseUrl: string) {
  const target = path.trim();

  if (!target || /^https?:\/\//i.test(target)) {
    return target;
  }

  const base = baseUrl.trim();
  const origin = extractOrigin(base);

  if (target.startsWith('/')) {
    return origin ? `${origin}${target}` : target;
  }

  if (!base) {
    return target;
  }

  return `${trimTrailingSlash(base)}/${target}`;
}

export function buildQueryString(params: Record<string, QueryValue | QueryValue[]>) {
  const pairs: string[] = [];

  Object.keys(params).forEach((key) => {
    const value = params[key];
    const values = Array.isArray(value) ? value : [value];

    values.forEach((item) => {
      if (item === null || item === undefined) {
        return;
      }

      pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(item))}`);
    });
  });

  return pairs.join('&');
}

export function appendQueryString(path: string, params: Record<string, QueryValue | QueryValue[]>) {
  const queryString = buildQueryString(params);

  if (!queryString) {
    return path;
  }

  return `${path}${path.includes('?') ? '&' : '?'}${queryString}`;
}
