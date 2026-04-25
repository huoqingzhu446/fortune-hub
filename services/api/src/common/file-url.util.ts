const FILE_CONTENT_PATH_REGEXP =
  /(?:^|\/)(?:api(?:\/v1)?\/)?files\/([^/?#]+)\/content(?:$|[/?#])/i;

function trimUrl(value: string) {
  return value.trim();
}

function parseAbsoluteUrl(value: string) {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function isLoopbackHost(hostname: string) {
  const normalized = hostname.trim().toLowerCase();

  return (
    normalized === 'localhost' ||
    normalized === '127.0.0.1' ||
    normalized === '0.0.0.0' ||
    normalized === '::1' ||
    normalized === 'host.docker.internal'
  );
}

function isPrivateIpv4Host(hostname: string) {
  const normalized = hostname.trim();

  return (
    /^10\./.test(normalized) ||
    /^192\.168\./.test(normalized) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(normalized)
  );
}

export function extractFileIdFromFileUrl(url: string) {
  const trimmed = trimUrl(url);

  if (!trimmed) {
    return null;
  }

  const parsedUrl = /^https?:\/\//i.test(trimmed)
    ? parseAbsoluteUrl(trimmed)
    : null;
  const target = trimmed.startsWith('/')
    ? trimmed
    : parsedUrl
      ? `${parsedUrl.pathname}${parsedUrl.search}`
      : trimmed;
  const match = target.match(FILE_CONTENT_PATH_REGEXP);

  if (!match?.[1]) {
    return null;
  }

  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

export function buildPublicApiFileContentUrl(
  fileId: string,
  publicApiBaseUrl?: string,
) {
  const path = `/api/v1/files/${encodeURIComponent(fileId)}/content`;
  const normalizedBase = trimUrl(publicApiBaseUrl ?? '').replace(/\/$/, '');

  if (!normalizedBase || !/^https?:\/\//i.test(normalizedBase)) {
    return path;
  }

  const parsedBase = parseAbsoluteUrl(normalizedBase);

  if (!parsedBase) {
    return path;
  }

  return new URL(path, parsedBase).toString();
}

export function isInternalFileServiceUrl(url: string, internalBaseUrl?: string) {
  const trimmed = trimUrl(url);

  if (!trimmed) {
    return false;
  }

  if (trimmed.startsWith('/')) {
    return true;
  }

  if (!/^https?:\/\//i.test(trimmed)) {
    return false;
  }

  const parsedUrl = parseAbsoluteUrl(trimmed);

  if (!parsedUrl) {
    return false;
  }

  if (isLoopbackHost(parsedUrl.hostname) || isPrivateIpv4Host(parsedUrl.hostname)) {
    return true;
  }

  const normalizedInternalBase = trimUrl(internalBaseUrl ?? '');
  const parsedInternalBase = /^https?:\/\//i.test(normalizedInternalBase)
    ? parseAbsoluteUrl(normalizedInternalBase)
    : null;

  return Boolean(parsedInternalBase && parsedUrl.origin === parsedInternalBase.origin);
}

export function normalizeFileServiceUrlToApiProxy(
  url: string,
  options?: {
    internalBaseUrl?: string;
    publicApiBaseUrl?: string;
    forceProxy?: boolean;
  },
) {
  const trimmed = trimUrl(url);

  if (!trimmed) {
    return '';
  }

  const fileId = extractFileIdFromFileUrl(trimmed);

  if (!fileId) {
    return trimmed;
  }

  if (
    options?.forceProxy ||
    isInternalFileServiceUrl(trimmed, options?.internalBaseUrl)
  ) {
    return buildPublicApiFileContentUrl(fileId, options?.publicApiBaseUrl);
  }

  return trimmed;
}
