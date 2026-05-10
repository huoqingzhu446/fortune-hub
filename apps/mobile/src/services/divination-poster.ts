import { drawDivinationPoster } from '../poster/divinationPoster/drawDivinationPoster';
import { posterTheme } from '../poster/divinationPoster/posterTheme';
import divinationPosterTemplateSrc from '../static/posters/divination-share-template.png';
import { appEnv } from '../config/env';
import type {
  DivinationPosterData,
  HexagramLine,
} from '../poster/divinationPoster/types';
import type {
  DivinationLineReading,
  DivinationResult,
} from '../types/divination';

type PosterCanvas = {
  width: number;
  height: number;
  getContext: (type: '2d') => CanvasRenderingContext2D | null;
  createImage?: () => PosterCanvasImage;
};

type PosterCanvasImage = CanvasImageSource & {
  src: string;
  width: number;
  height: number;
  onload: (() => void) | null;
  onerror: ((error: unknown) => void) | null;
};

type WechatCanvasRuntime = {
  createOffscreenCanvas?: (options: {
    type: '2d';
    width: number;
    height: number;
  }) => PosterCanvas;
  canvasToTempFilePath?: (options: {
    canvas: PosterCanvas;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    destWidth?: number;
    destHeight?: number;
    fileType?: 'png' | 'jpg';
    quality?: number;
    success?: (result: { tempFilePath: string }) => void;
    fail?: (error: unknown) => void;
  }) => void;
  getImageInfo?: (options: {
    src: string;
    success?: (result: { path: string; width: number; height: number }) => void;
    fail?: (error: unknown) => void;
  }) => void;
  showShareImageMenu?: (options: {
    path: string;
    success?: () => void;
    fail?: (error: unknown) => void;
  }) => void;
};

export const DIVINATION_POSTER_WIDTH = posterTheme.size.width;
export const DIVINATION_POSTER_HEIGHT = posterTheme.size.height;
const DIVINATION_POSTER_TEMPLATE_FALLBACK_SRC = '/static/posters/divination-share-template.png';
const STATIC_MINI_PROGRAM_CODE_SRC = import.meta.env.VITE_MINI_PROGRAM_CODE_URL || '';

export type DivinationPosterViewModel = DivinationPosterData;

export interface DivinationPosterFile {
  tempFilePath: string;
  width: number;
  height: number;
  fileName: string;
}

export function getWechatPosterRuntime() {
  return (globalThis as typeof globalThis & { wx?: WechatCanvasRuntime }).wx;
}

export function buildDivinationPosterViewModel(result: DivinationResult): DivinationPosterViewModel {
  return buildDivinationPosterData(result);
}

export function buildDivinationPosterData(result: DivinationResult): DivinationPosterData {
  const movingLine = resolveMovingLine(result);
  const movingLineReading = resolveMovingLineReading(result, movingLine);
  const methodText = normalizePosterText(result.casting?.methodLabel, '略筮法');
  const topicText = normalizePosterText(result.topicLabel, '综合占卜');
  const movingText = normalizePosterText(
    result.casting?.movingLineLabel || movingLineReading?.label,
    resolveMovingLineText(movingLine),
  );
  const changedName = normalizePosterText(result.changedHexagram?.name, '本卦不变');
  const oracle = result.oracle;
  const fallbackAction = joinPosterItems(result.advice, '宜先修细节、积小成势。', '，', 1);

  return {
    title: '占卜结果',
    methodLabel: `${topicText} · ${methodText}`,
    result: {
      prefix: '本卦',
      name: normalizePosterText(result.hexagram.name, '未命名卦象'),
      subtitle: normalizePosterText(result.hexagram.meaning, result.summary),
      luckyLevel: normalizePosterText(result.hexagram.level, '吉'),
      trigramNote: `${normalizePosterText(result.hexagram.upperTrigram, '上卦')}上 · ${normalizePosterText(
        result.hexagram.lowerTrigram,
        '下卦',
      )}下`,
      hexagramLines: buildPosterHexagramLines(result.hexagram.lines, movingLine),
    },
    chips: [
      {
        icon: 'method',
        label: '起法',
        value: methodText,
      },
      {
        icon: 'move',
        label: '动爻',
        value: movingText,
      },
      {
        icon: 'change',
        label: '变卦',
        value: changedName,
      },
    ],
    question: {
      tag: normalizePosterText(oracle?.title, '高岛式断曰'),
      text: normalizePosterText(oracle?.subject || result.question || result.topicLabel, '今日所问'),
      summary: normalizePosterText(oracle?.situation || result.summary, result.analysis),
    },
    analysisCards: [
      {
        icon: 'lightning',
        title: '动爻',
        value: movingText,
        content: normalizePosterText(
          oracle?.moving ||
            movingLineReading?.takashimaText ||
            movingLineReading?.text ||
            result.readingFlow?.movingLine,
          `${movingText}为本次关键，宜看清眼前最容易失衡的位置。`,
        ),
        actionText: normalizePosterText(movingLineReading?.advice, fallbackAction),
      },
      {
        icon: 'earth',
        title: '变卦',
        value: changedName,
        content: normalizePosterText(
          oracle?.tendency ||
            result.changedHexagram?.decision ||
            result.changedHexagram?.meaning ||
            result.readingFlow?.changedTrend,
          '本卦不变，宜守住当前判断，先把眼前一步做稳。',
        ),
        actionText: normalizePosterText(oracle?.action || result.topicReading?.action, fallbackAction),
      },
    ],
    footer: {
      slogan: '长按识别，生成你的今日占卜',
      brand: 'Fortune Hub',
    },
  };
}

export async function generateDivinationSharePoster(result: DivinationResult): Promise<DivinationPosterFile> {
  const wxRuntime = getWechatPosterRuntime();

  if (!wxRuntime?.createOffscreenCanvas || !wxRuntime.canvasToTempFilePath) {
    throw new Error('请在微信小程序环境中生成占卜分享海报');
  }

  const canvas = wxRuntime.createOffscreenCanvas({
    type: '2d',
    width: DIVINATION_POSTER_WIDTH,
    height: DIVINATION_POSTER_HEIGHT,
  });
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('当前环境无法创建海报画布');
  }

  const [templateImage, qrImage] = await Promise.all([
    loadFirstCanvasImage(wxRuntime, canvas, [
      divinationPosterTemplateSrc,
      DIVINATION_POSTER_TEMPLATE_FALLBACK_SRC,
    ]),
    loadOptionalCanvasImage(wxRuntime, canvas, resolveMiniProgramCodeSources(result)),
  ]);

  await drawDivinationPoster(
    ctx,
    buildDivinationPosterData(result),
    qrImage || undefined,
    templateImage || undefined,
  );

  const tempFilePath = await new Promise<string>((resolve, reject) => {
    wxRuntime.canvasToTempFilePath?.({
      canvas,
      width: DIVINATION_POSTER_WIDTH,
      height: DIVINATION_POSTER_HEIGHT,
      destWidth: DIVINATION_POSTER_WIDTH,
      destHeight: DIVINATION_POSTER_HEIGHT,
      fileType: 'png',
      quality: 1,
      success: (response) => resolve(response.tempFilePath),
      fail: reject,
    });
  });

  return {
    tempFilePath,
    width: DIVINATION_POSTER_WIDTH,
    height: DIVINATION_POSTER_HEIGHT,
    fileName: `fortune-hub-divination-${result.id}.png`,
  };
}

function buildPosterHexagramLines(lines: boolean[], movingLine: number): HexagramLine[] {
  const normalized = Array.from({ length: 6 }, (_, index) => Boolean(lines[index]));

  return normalized.reverse().map((solid, displayIndex) => {
    const originalLine = 6 - displayIndex;

    return {
      type: solid ? 'solid' : 'broken',
      active: originalLine === movingLine,
    };
  });
}

function resolveMovingLine(result: DivinationResult) {
  const line = Number(result.casting?.movingLine || result.changingLines?.[0] || 1);

  if (!Number.isFinite(line)) {
    return 1;
  }

  return Math.min(6, Math.max(1, Math.round(line)));
}

function resolveMovingLineReading(
  result: DivinationResult,
  movingLine: number,
): DivinationLineReading | undefined {
  return result.hexagram.lineReadings?.find((item) => item.line === movingLine) ??
    result.hexagram.lineReadings?.[movingLine - 1];
}

function normalizePosterText(value: unknown, fallback = '') {
  const text = String(value || '').replace(/\s+/g, ' ').trim();

  return text || fallback;
}

function joinPosterItems(
  values: string[] | undefined,
  fallback: string,
  separator: string,
  count: number,
) {
  const text = (values || [])
    .map((item) => normalizePosterText(item))
    .filter(Boolean)
    .slice(0, count)
    .join(separator);

  return text || fallback;
}

function resolveMovingLineText(line?: number) {
  const normalized = Number(line);

  if (!Number.isFinite(normalized) || normalized < 1) {
    return '动爻未显';
  }

  return `第${Math.min(6, Math.round(normalized))}爻`;
}

function resolveCanvasImageSource(wxRuntime: WechatCanvasRuntime, source: string) {
  if (!/^https?:\/\//.test(source) || !wxRuntime.getImageInfo) {
    return Promise.resolve(source);
  }

  return new Promise<string>((resolve, reject) => {
    wxRuntime.getImageInfo?.({
      src: source,
      success: (result) => resolve(result.path),
      fail: reject,
    });
  });
}

async function loadCanvasImage(
  wxRuntime: WechatCanvasRuntime,
  canvas: PosterCanvas,
  source: string,
) {
  if (!canvas.createImage) {
    throw new Error('当前环境无法加载海报模板');
  }

  const drawableSource = await resolveCanvasImageSource(wxRuntime, source);

  return new Promise<PosterCanvasImage>((resolve, reject) => {
    const image = canvas.createImage?.();

    if (!image) {
      reject(new Error('当前环境无法创建海报模板图片'));
      return;
    }

    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = drawableSource;
  });
}

async function loadFirstCanvasImage(
  wxRuntime: WechatCanvasRuntime,
  canvas: PosterCanvas,
  sources: string[],
) {
  const uniqueSources = Array.from(new Set(sources.filter(Boolean)));

  for (const source of uniqueSources) {
    try {
      return await loadCanvasImage(wxRuntime, canvas, source);
    } catch (error) {
      console.warn('load divination poster template failed', source, error);
    }
  }

  return null;
}

async function loadOptionalCanvasImage(
  wxRuntime: WechatCanvasRuntime,
  canvas: PosterCanvas,
  sources: string[],
) {
  const uniqueSources = Array.from(new Set(sources.filter(Boolean)));

  for (const source of uniqueSources) {
    try {
      return await loadCanvasImage(wxRuntime, canvas, source);
    } catch (error) {
      console.warn('load divination mini program code failed', source, error);
    }
  }

  return null;
}

export function resolveDivinationMiniProgramCodeUrl(resultId?: string) {
  const baseUrl = appEnv.apiBaseUrl.replace(/\/$/, '');

  if (!/^https?:\/\//i.test(baseUrl)) {
    return '';
  }

  const params = [
    ['sourceType', 'divination'],
    ...(resultId ? [['recordId', resultId]] : []),
  ]
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');

  return `${baseUrl}/posters/mini-program-code?${params}`;
}

export function resolveDivinationMiniProgramCodeImageUrl(resultId?: string) {
  return resolveDivinationMiniProgramCodeSourceUrls(resultId)[0] || '';
}

function resolveMiniProgramCodeSources(result: DivinationResult) {
  return resolveDivinationMiniProgramCodeSourceUrls(result.id);
}

function resolveDivinationMiniProgramCodeSourceUrls(resultId?: string) {
  return [STATIC_MINI_PROGRAM_CODE_SRC, resolveDivinationMiniProgramCodeUrl(resultId)]
    .map((source) => source.trim())
    .filter(Boolean);
}
