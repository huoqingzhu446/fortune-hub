import type { DivinationResult } from '../types/divination';
import { formatDivinationDate } from './divination';

type PosterCanvas = {
  width: number;
  height: number;
  getContext: (type: '2d') => CanvasRenderingContext2D | null;
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
  showShareImageMenu?: (options: {
    path: string;
    success?: () => void;
    fail?: (error: unknown) => void;
  }) => void;
};

export const DIVINATION_POSTER_WIDTH = 750;
export const DIVINATION_POSTER_HEIGHT = 1334;

const POSTER_DESIGN_WIDTH = 941;
const POSTER_DESIGN_HEIGHT = 1672;

const FONT_FAMILY = 'PingFang SC, Microsoft YaHei, sans-serif';
const SERIF_FONT_FAMILY = 'Songti SC, STSong, Noto Serif SC, serif';

export interface DivinationPosterInfoChip {
  label: string;
  value: string;
}

export interface DivinationPosterViewModel {
  dateText: string;
  eyebrowText: string;
  hexagramTitle: string;
  meaning: string;
  level: string;
  trigramText: string;
  changedName: string;
  changedButtonText: string;
  movingText: string;
  infoChips: DivinationPosterInfoChip[];
  oracleTitle: string;
  oracleSubject: string;
  oracleSituation: string;
  movingTitle: string;
  movingBody: string;
  movingAdvice: string;
  changedTitle: string;
  changedBody: string;
  changedAdvice: string;
}

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
  const movingLine = result.casting?.movingLine || result.changingLines?.[0] || 1;
  const movingLineReading = result.hexagram.lineReadings?.[movingLine - 1];
  const methodText = normalizePosterText(result.casting?.methodLabel || '略筮法');
  const movingText = normalizePosterText(result.casting?.movingLineLabel || resolveMovingLineText(movingLine));
  const changedName = normalizePosterText(result.changedHexagram?.name || '本卦不变');
  const oracle = result.oracle;
  const fallbackAction = joinPosterItems(result.advice, '宜先修细节、积小成势。', '，', 1);

  return {
    dateText: formatDivinationDate(result.createdAt),
    eyebrowText: `${normalizePosterText(result.topicLabel || '今日占卜')} · ${methodText}`,
    hexagramTitle: `本卦：${normalizePosterText(result.hexagram.name)}`,
    meaning: normalizePosterText(result.hexagram.meaning),
    level: normalizePosterText(result.hexagram.level),
    trigramText: `${normalizePosterText(result.hexagram.upperTrigram)}上 · ${normalizePosterText(result.hexagram.lowerTrigram)}下`,
    changedName,
    changedButtonText: result.changedHexagram ? `查看变卦：${changedName}` : '本卦不变',
    movingText,
    infoChips: [
      { label: '起法', value: methodText },
      { label: '动爻', value: movingText },
      { label: '变卦', value: changedName },
    ],
    oracleTitle: normalizePosterText(oracle?.title || '高岛式断曰'),
    oracleSubject: normalizePosterText(oracle?.subject || result.question || result.topicLabel || result.hexagram.name),
    oracleSituation: normalizePosterText(oracle?.situation || result.summary),
    movingTitle: movingText,
    movingBody: normalizePosterText(
      oracle?.moving ||
        movingLineReading?.takashimaText ||
        movingLineReading?.text ||
        `${movingText}为本次关键，宜看清眼前最容易失衡的位置。`,
    ),
    movingAdvice: normalizePosterText(movingLineReading?.advice || fallbackAction),
    changedTitle: changedName,
    changedBody: normalizePosterText(
      oracle?.tendency ||
        result.changedHexagram?.decision ||
        result.changedHexagram?.meaning ||
        '本卦不变，宜守住当前判断，先把眼前一步做稳。',
    ),
    changedAdvice: normalizePosterText(oracle?.action || result.topicReading?.action || fallbackAction),
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

  drawPoster(ctx, result);

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

function drawPoster(ctx: CanvasRenderingContext2D, result: DivinationResult) {
  const poster = buildDivinationPosterViewModel(result);

  // Keep the template layout in a larger design space, then export at the unified poster size.
  ctx.save();
  ctx.scale(DIVINATION_POSTER_WIDTH / POSTER_DESIGN_WIDTH, DIVINATION_POSTER_HEIGHT / POSTER_DESIGN_HEIGHT);
  drawBackground(ctx);
  drawPageTitle(ctx, poster);
  drawResultCard(ctx, result, poster);
  drawOracleCard(ctx, poster);
  drawDetailPanels(ctx, poster);
  drawFooter(ctx);
  ctx.restore();
}

function drawBackground(ctx: CanvasRenderingContext2D) {
  const gradient = ctx.createLinearGradient(0, 0, 0, POSTER_DESIGN_HEIGHT);
  gradient.addColorStop(0, '#FCF7EE');
  gradient.addColorStop(0.56, '#F7EFE4');
  gradient.addColorStop(1, '#F3EADD');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, POSTER_DESIGN_WIDTH, POSTER_DESIGN_HEIGHT);
}

function drawPageTitle(ctx: CanvasRenderingContext2D, poster: DivinationPosterViewModel) {
  void poster;
  setFont(ctx, 42, '700');
  ctx.fillStyle = '#181512';
  ctx.textAlign = 'center';
  ctx.fillText('占卜结果', POSTER_DESIGN_WIDTH / 2, 96);
}

function drawResultCard(
  ctx: CanvasRenderingContext2D,
  result: DivinationResult,
  poster: DivinationPosterViewModel,
) {
  drawCard(ctx, 30, 154, 881, 610, 42);

  setFont(ctx, 30, '700');
  ctx.fillStyle = '#8D73E6';
  ctx.textAlign = 'left';
  ctx.fillText(poster.eyebrowText, 64, 230);

  drawRoundRect(ctx, 776, 190, 104, 66, 33, '#FFF3D8', 'rgba(216,178,103,0.45)');
  setFont(ctx, 28, '700');
  ctx.fillStyle = '#B67C25';
  ctx.textAlign = 'center';
  ctx.fillText(poster.level, 828, 233);

  ctx.fillStyle = '#4B382A';
  ctx.textAlign = 'left';
  drawFitText(ctx, poster.hexagramTitle, 64, 330, 700, 64, 46, '700', FONT_FAMILY);

  setFont(ctx, 34, '400');
  ctx.fillStyle = '#8E8174';
  ctx.fillText(poster.meaning, 64, 408);

  drawHexagram(ctx, result.hexagram.lines, 64, 474, 274, 21, 21, '#3E3345');

  setFont(ctx, 54, '700', SERIF_FONT_FAMILY);
  ctx.fillStyle = '#C9BDF1';
  ctx.textAlign = 'center';
  ctx.fillText(result.hexagram.symbol, 462, 552);

  setFont(ctx, 30, '500');
  ctx.fillStyle = '#9A8B7D';
  ctx.textAlign = 'left';
  ctx.fillText(poster.trigramText, 394, 624);

  drawRoundRect(ctx, 394, 660, 486, 66, 33, '#F1EEF8');
  setFont(ctx, 30, '600');
  ctx.fillStyle = '#8D73E6';
  ctx.textAlign = 'center';
  ctx.fillText(poster.changedButtonText, 637, 703);

  poster.infoChips.forEach((item, index) => {
    const x = 64 + index * 277;
    drawInfoChip(ctx, x, 674, 255, item.label, item.value);
  });
}

function drawOracleCard(ctx: CanvasRenderingContext2D, poster: DivinationPosterViewModel) {
  drawCard(ctx, 30, 794, 881, 246, 36);

  setFont(ctx, 30, '500');
  ctx.fillStyle = '#8D73E6';
  ctx.textAlign = 'left';
  ctx.fillText(poster.oracleTitle, 64, 874);

  setFont(ctx, 42, '700');
  ctx.fillStyle = '#4B382A';
  wrapText(ctx, poster.oracleSubject, 64, 940, 760, 52, 1);

  setFont(ctx, 32, '400');
  ctx.fillStyle = '#766A60';
  wrapText(ctx, poster.oracleSituation, 64, 1000, 770, 44, 2);
}

function drawDetailPanels(ctx: CanvasRenderingContext2D, poster: DivinationPosterViewModel) {
  drawDetailPanel(ctx, {
    x: 30,
    y: 1070,
    width: 420,
    height: 398,
    eyebrow: '动爻',
    title: poster.movingTitle,
    body: poster.movingBody,
    advice: poster.movingAdvice,
  });

  drawDetailPanel(ctx, {
    x: 492,
    y: 1070,
    width: 419,
    height: 398,
    eyebrow: '变卦',
    title: poster.changedTitle,
    body: poster.changedBody,
    advice: poster.changedAdvice,
  });
}

function drawFooter(ctx: CanvasRenderingContext2D) {
  setFont(ctx, 24, '400');
  ctx.fillStyle = '#8E8174';
  ctx.textAlign = 'left';
  ctx.fillText('长按识别，生成你的今日占卜', 64, 1544);

  setFont(ctx, 34, '700');
  ctx.fillStyle = '#4B382A';
  ctx.fillText('Fortune Hub', 64, 1584);

  drawRoundRect(ctx, 766, 1500, 116, 116, 20, '#FFFFFF', 'rgba(228,218,207,0.9)');
  drawQrPlaceholder(ctx, 788, 1522, 72);
}

function drawHexagram(
  ctx: CanvasRenderingContext2D,
  lines: boolean[],
  x: number,
  y: number,
  width: number,
  lineHeight: number,
  gap: number,
  color = '#3D3342',
) {
  ctx.fillStyle = color;
  const segmentGap = width * 0.18;
  lines.forEach((solid, index) => {
    const lineY = y + (5 - index) * (lineHeight + gap);

    if (solid) {
      drawRoundRect(ctx, x, lineY, width, lineHeight, 4, color);
      return;
    }

    drawRoundRect(ctx, x, lineY, (width - segmentGap) / 2, lineHeight, 4, color);
    drawRoundRect(ctx, x + (width + segmentGap) / 2, lineY, (width - segmentGap) / 2, lineHeight, 4, color);
  });
}

function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fillStyle: string,
  strokeStyle?: string,
) {
  const r = Math.min(radius, width / 2, height / 2);

  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
  ctx.fillStyle = fillStyle;
  ctx.fill();

  if (strokeStyle) {
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function drawCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  ctx.save();
  ctx.shadowColor = 'rgba(84,64,45,0.08)';
  ctx.shadowBlur = 28;
  ctx.shadowOffsetY = 12;
  drawRoundRect(ctx, x, y, width, height, radius, '#FFFFFF');
  ctx.restore();
}

function drawInfoChip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  label: string,
  value: string,
) {
  drawRoundRect(ctx, x, y, width, 76, 18, '#F6F2FA');
  setFont(ctx, 24, '500');
  ctx.fillStyle = '#A49A90';
  ctx.textAlign = 'left';
  ctx.fillText(label, x + 24, y + 33);

  setFont(ctx, 28, '700');
  ctx.fillStyle = '#4B382A';
  drawFitText(ctx, value, x + 24, y + 62, width - 48, 28, 21, '700');
}

function drawDetailPanel(ctx: CanvasRenderingContext2D, input: {
  x: number;
  y: number;
  width: number;
  height: number;
  eyebrow: string;
  title: string;
  body: string;
  advice: string;
}) {
  drawCard(ctx, input.x, input.y, input.width, input.height, 34);

  setFont(ctx, 30, '500');
  ctx.fillStyle = '#8D73E6';
  ctx.textAlign = 'left';
  ctx.fillText(input.eyebrow, input.x + 36, input.y + 64);

  ctx.fillStyle = '#4B382A';
  drawFitText(ctx, input.title, input.x + 36, input.y + 128, input.width - 72, 42, 30, '700');

  setFont(ctx, 30, '400');
  ctx.fillStyle = '#766A60';
  wrapText(ctx, input.body, input.x + 36, input.y + 178, input.width - 72, 42, 4);

  if (input.advice) {
    setFont(ctx, 28, '500');
    ctx.fillStyle = '#8D73E6';
    wrapText(ctx, input.advice, input.x + 36, input.y + 342, input.width - 72, 38, 1);
  }
}

function drawFitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  maxSize: number,
  minSize: number,
  weight: '400' | '500' | '600' | '700',
  family = FONT_FAMILY,
) {
  let size = maxSize;

  while (size > minSize) {
    setFont(ctx, size, weight, family);
    if (ctx.measureText(text).width <= maxWidth) {
      break;
    }
    size -= 2;
  }

  setFont(ctx, size, weight, family);
  ctx.fillText(text, x, y);
}

function drawQrPlaceholder(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.fillStyle = '#F7F0E3';
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = '#35291F';
  const cells = [
    [0, 0],
    [1, 0],
    [2, 0],
    [0, 1],
    [2, 1],
    [0, 2],
    [1, 2],
    [2, 2],
    [5, 0],
    [6, 0],
    [7, 0],
    [5, 1],
    [7, 1],
    [5, 2],
    [6, 2],
    [7, 2],
    [0, 5],
    [1, 5],
    [2, 5],
    [0, 6],
    [2, 6],
    [0, 7],
    [1, 7],
    [2, 7],
    [4, 4],
    [6, 4],
    [3, 5],
    [5, 6],
    [7, 7],
  ];
  const unit = size / 8;
  cells.forEach(([cx, cy]) => {
    ctx.fillRect(x + cx * unit + unit * 0.2, y + cy * unit + unit * 0.2, unit * 0.6, unit * 0.6);
  });
}

function normalizePosterText(value: unknown) {
  return String(value || '').replace(/\s+/g, ' ').trim();
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

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
) {
  let line = '';
  let lineCount = 0;

  for (let index = 0; index < text.length; index += 1) {
    const nextLine = `${line}${text[index]}`;

    if (ctx.measureText(nextLine).width > maxWidth && line) {
      const isLastLine = lineCount >= maxLines - 1;
      ctx.fillText(isLastLine ? `${line.slice(0, Math.max(1, line.length - 1))}…` : line, x, y + lineCount * lineHeight);

      if (isLastLine) {
        return;
      }

      line = text[index];
      lineCount += 1;
    } else {
      line = nextLine;
    }
  }

  if (line && lineCount < maxLines) {
    ctx.fillText(line, x, y + lineCount * lineHeight);
  }
}

function setFont(
  ctx: CanvasRenderingContext2D,
  size: number,
  weight: '400' | '500' | '600' | '700' = '400',
  family = FONT_FAMILY,
) {
  ctx.font = `${weight} ${size}px ${family}`;
}
