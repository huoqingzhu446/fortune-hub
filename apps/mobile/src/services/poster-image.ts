import { getErrorMessage } from './errors';
import { appEnv } from '../config/env';

type WechatRuntime = {
  env?: {
    USER_DATA_PATH?: string;
  };
  getFileSystemManager?: () => {
    writeFile: (options: {
      filePath: string;
      data: string;
      encoding: 'base64';
      success?: () => void;
      fail?: (error: unknown) => void;
    }) => void;
  };
  showShareImageMenu?: (options: {
    path: string;
    success?: () => void;
    fail?: (error: unknown) => void;
  }) => void;
};

const currentPlatform = String(
  (uni.getSystemInfoSync() as { uniPlatform?: string }).uniPlatform ?? '',
).toLowerCase();
const isMpWeixin = currentPlatform === 'mp-weixin';

function getWechatRuntime() {
  return (globalThis as typeof globalThis & { wx?: WechatRuntime }).wx;
}

function isDataUrl(value: string) {
  return value.startsWith('data:image/');
}

function extractFileIdFromUrl(value: string) {
  const match = value.match(
    /(?:^|\/)(?:api(?:\/v1)?\/)?files\/([^/?#]+)\/content(?:$|[/?#])/i,
  );

  if (!match?.[1]) {
    return '';
  }

  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

function buildApiFileContentUrl(fileId: string) {
  const path = `/api/v1/files/${encodeURIComponent(fileId)}/content`;

  if (/^https?:\/\//i.test(appEnv.apiBaseUrl)) {
    return new URL(path, appEnv.apiBaseUrl).toString();
  }

  return path;
}

function normalizeImageSource(imageSource: string) {
  const trimmed = imageSource.trim();

  if (!trimmed || isDataUrl(trimmed)) {
    return trimmed;
  }

  const fileId = extractFileIdFromUrl(trimmed);

  if (fileId) {
    return buildApiFileContentUrl(fileId);
  }

  if (trimmed.startsWith('/') && /^https?:\/\//i.test(appEnv.apiBaseUrl)) {
    return new URL(trimmed, appEnv.apiBaseUrl).toString();
  }

  return trimmed;
}

function stripFileExtension(fileName: string) {
  return fileName.replace(/\.[a-z0-9]+$/i, '');
}

function sanitizeFileName(fileName: string) {
  const normalized = stripFileExtension(fileName).replace(/[^a-z0-9\u4e00-\u9fa5-]+/gi, '-');
  return normalized.replace(/^-+|-+$/g, '') || `fortune-hub-${Date.now()}`;
}

function getImageExtension(imageSource: string) {
  const matched = imageSource.match(/^data:image\/([a-z0-9+.-]+);base64,/i)?.[1]?.toLowerCase();

  if (!matched) {
    return 'png';
  }

  if (matched.includes('jpeg') || matched.includes('jpg')) {
    return 'jpg';
  }

  if (matched.includes('webp')) {
    return 'webp';
  }

  return 'png';
}

function triggerBrowserDownload(imageSource: string, fileName: string) {
  if (typeof document === 'undefined') {
    return;
  }

  const anchor = document.createElement('a');
  anchor.href = imageSource;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}

function downloadRemoteImage(imageSource: string) {
  return new Promise<string>((resolve, reject) => {
    uni.downloadFile({
      url: imageSource,
      success: (response) => {
        if (response.statusCode >= 200 && response.statusCode < 300 && response.tempFilePath) {
          resolve(response.tempFilePath);
          return;
        }

        reject(new Error('图片下载失败，请稍后再试'));
      },
      fail: reject,
    });
  });
}

function writeDataUrlToWechatFile(imageSource: string, fileName: string) {
  const wxRuntime = getWechatRuntime();
  const base64 = imageSource.split(',')[1];
  const userDataPath = wxRuntime?.env?.USER_DATA_PATH;
  const fileSystemManager = wxRuntime?.getFileSystemManager?.();

  if (!base64 || !userDataPath || !fileSystemManager) {
    throw new Error('当前微信环境暂不支持直接处理分享图');
  }

  const extension = getImageExtension(imageSource);
  const filePath = `${userDataPath}/${sanitizeFileName(fileName)}.${extension}`;

  return new Promise<string>((resolve, reject) => {
    fileSystemManager.writeFile({
      filePath,
      data: base64,
      encoding: 'base64',
      success: () => resolve(filePath),
      fail: reject,
    });
  });
}

async function resolveUsableImagePath(imageSource: string, fileName: string) {
  if (isMpWeixin) {
    if (isDataUrl(imageSource)) {
      return writeDataUrlToWechatFile(imageSource, fileName);
    }

    return downloadRemoteImage(imageSource);
  }

  return imageSource;
}

export async function previewPosterImage(imageSource: string, fileName: string) {
  const previewSource = await resolveUsableImagePath(imageSource, fileName);

  uni.previewImage({
    urls: [previewSource],
    current: previewSource,
  });
}

export async function savePosterImage(imageSource: string, fileName: string) {
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    triggerBrowserDownload(imageSource, fileName);
    return;
  }

  if (!isMpWeixin) {
    throw new Error('当前平台暂不支持直接保存，请先预览后再处理');
  }

  const filePath = await resolveUsableImagePath(imageSource, fileName);

  await new Promise<void>((resolve, reject) => {
    uni.saveImageToPhotosAlbum({
      filePath,
      success: () => resolve(),
      fail: reject,
    });
  });
}

export async function sharePosterImageToWechat(imageSource: string, fileName: string) {
  if (!isMpWeixin) {
    throw new Error('请在微信小程序中使用该分享能力');
  }

  const wxRuntime = getWechatRuntime();

  if (typeof wxRuntime?.showShareImageMenu !== 'function') {
    throw new Error('当前微信版本暂不支持直接发送图片，请先保存到相册');
  }

  const filePath = await resolveUsableImagePath(imageSource, fileName);

  await new Promise<void>((resolve, reject) => {
    wxRuntime.showShareImageMenu?.({
      path: filePath,
      success: () => resolve(),
      fail: reject,
    });
  });
}

export function resolvePreferredImageSource(input: {
  fileUrl?: string | null;
  imageDataUrl?: string | null;
}) {
  return normalizeImageSource(input.fileUrl || input.imageDataUrl || '');
}

export function handlePosterImageError(error: unknown, fallback = '图片处理失败，请稍后再试') {
  const message = getErrorMessage(error, fallback);

  if (
    message.includes('auth deny') ||
    message.includes('auth denied') ||
    message.includes('authorize no response')
  ) {
    uni.showModal({
      title: '需要相册权限',
      content: '请先允许保存到相册，才能把今日分享图保存到手机。',
      confirmText: '去设置',
      success: (response) => {
        if (response.confirm) {
          uni.openSetting({});
        }
      },
    });
  }

  return message;
}
