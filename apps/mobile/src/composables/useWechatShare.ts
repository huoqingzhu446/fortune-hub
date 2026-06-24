import { onShareAppMessage, onShareTimeline, onShow } from '@dcloudio/uni-app';

type ShareConfig = {
  title: string;
  path?: string;
  imageUrl?: string;
  timelineTitle?: string;
  timelineImageUrl?: string;
};

type ShareConfigResolver = ShareConfig | (() => ShareConfig);

const defaultShareConfig: ShareConfig = {
  title: '今日状态',
  path: '/pages/index/index',
  imageUrl: '/static/logo.png',
};

function normalizePath(path: string) {
  return path.startsWith('/') ? path : `/${path}`;
}

function stringifyQuery(options: Record<string, unknown>) {
  return Object.entries(options)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');
}

function resolveCurrentPagePath() {
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1] as
    | {
        route?: string;
        options?: Record<string, unknown>;
        $page?: {
          fullPath?: string;
        };
      }
    | undefined;

  if (!currentPage) {
    return defaultShareConfig.path;
  }

  if (currentPage.$page?.fullPath) {
    return normalizePath(currentPage.$page.fullPath);
  }

  const route = normalizePath(currentPage.route || defaultShareConfig.path || '');
  const query = currentPage.options ? stringifyQuery(currentPage.options) : '';
  return query ? `${route}?${query}` : route;
}

function resolveShareConfig(input: ShareConfigResolver) {
  const provided = typeof input === 'function' ? input() : input;
  const path = provided.path ? normalizePath(provided.path) : resolveCurrentPagePath();

  return {
    ...defaultShareConfig,
    ...provided,
    path,
  };
}

function extractQuery(path: string) {
  const queryIndex = path.indexOf('?');
  return queryIndex >= 0 ? path.slice(queryIndex + 1) : '';
}

export function useWechatShare(input: ShareConfigResolver = defaultShareConfig) {
  onShow(() => {
    // #ifdef MP-WEIXIN
    uni.showShareMenu({
      menus: ['shareAppMessage', 'shareTimeline'],
    });
    // #endif
  });

  onShareAppMessage(() => {
    const share = resolveShareConfig(input);

    return {
      title: share.title,
      path: share.path,
      imageUrl: share.imageUrl,
    };
  });

  onShareTimeline(() => {
    const share = resolveShareConfig(input);

    return {
      title: share.timelineTitle || share.title,
      query: extractQuery(share.path || ''),
      imageUrl: share.timelineImageUrl || share.imageUrl,
    };
  });
}
