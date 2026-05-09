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

export const DIVINATION_POSTER_WIDTH = 1088;
export const DIVINATION_POSTER_HEIGHT = 1472;

const FONT_FAMILY = 'PingFang SC, Microsoft YaHei, sans-serif';
const SERIF_FONT_FAMILY = 'Songti SC, STSong, Noto Serif SC, serif';

export interface DivinationPosterScoreMetric {
  key: 'overall' | 'emotion' | 'action';
  label: string;
  value: number;
  color: string;
}

export interface DivinationPosterViewModel {
  dateText: string;
  hexagramNo: string;
  title: string;
  meaning: string;
  level: string;
  topicLabel: string;
  movingText: string;
  changedText: string;
  keywordText: string;
  summaryText: string;
  suitableText: string;
  avoidText: string;
  scoreMetrics: DivinationPosterScoreMetric[];
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
  return {
    dateText: formatDivinationDate(result.createdAt),
    hexagramNo: String(result.hexagram.sequence ?? result.hexagram.id).padStart(2, '0'),
    title: normalizePosterText(result.hexagram.name),
    meaning: normalizePosterText(result.hexagram.meaning),
    level: normalizePosterText(result.hexagram.level),
    topicLabel: normalizePosterText(result.topicLabel || '今日占卜'),
    movingText: normalizePosterText(result.casting?.movingLineLabel || resolveMovingLineText(result.changingLines[0])),
    changedText: result.changedHexagram
      ? `变卦 ${normalizePosterText(result.changedHexagram.name)}`
      : '本卦不变',
    keywordText: joinPosterItems(result.keywords, '顺势 / 调整 / 收束', ' / ', 4),
    summaryText: normalizePosterText(
      result.summary ||
        result.oracle?.action ||
        result.topicReading?.summary ||
        '先看清局势，再把今天最确定的一步做稳。',
    ),
    suitableText: joinPosterItems(result.suitable, '整理、复盘、沟通', '、', 3),
    avoidText: joinPosterItems(result.avoid, '急进、纠缠、过度消耗', '、', 3),
    scoreMetrics: [
      { key: 'overall', label: '综合', value: clampScore(result.scores.overall), color: '#A04735' },
      { key: 'emotion', label: '情绪', value: clampScore(result.scores.emotion), color: '#6F7F6B' },
      { key: 'action', label: '行动', value: clampScore(result.scores.action), color: '#B17A32' },
    ],
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

  drawBackground(ctx);
  drawFrame(ctx);
  drawHeader(ctx, poster);
  drawTitleBlock(ctx, poster);
  drawOraclePanel(ctx, result, poster);
  drawScores(ctx, poster);
  drawSummary(ctx, poster);
  drawSuitableAvoid(ctx, poster);
  drawFooter(ctx);
}

function drawBackground(ctx: CanvasRenderingContext2D) {
  const gradient = ctx.createLinearGradient(0, 0, 0, DIVINATION_POSTER_HEIGHT);
  gradient.addColorStop(0, '#F8F0E3');
  gradient.addColorStop(0.55, '#F3ECE2');
  gradient.addColorStop(1, '#EDF2E9');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, DIVINATION_POSTER_WIDTH, DIVINATION_POSTER_HEIGHT);

  ctx.save();
  ctx.globalAlpha = 0.42;
  ctx.fillStyle = '#D8C7AD';
  for (let index = 0; index < 42; index += 1) {
    const x = (index * 113) % DIVINATION_POSTER_WIDTH;
    const y = 42 + ((index * 191) % (DIVINATION_POSTER_HEIGHT - 96));
    const width = 34 + ((index * 17) % 76);
    ctx.fillRect(x, y, width, 1);
  }
  ctx.restore();
}

function drawFrame(ctx: CanvasRenderingContext2D) {
  ctx.save();
  ctx.strokeStyle = 'rgba(118,88,55,0.34)';
  ctx.lineWidth = 2;
  ctx.strokeRect(64, 56, 960, 1360);

  ctx.strokeStyle = 'rgba(160,71,53,0.56)';
  ctx.beginPath();
  ctx.moveTo(88, 166);
  ctx.lineTo(88, 1224);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(118,88,55,0.24)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(1000, 166);
  ctx.lineTo(1000, 1224);
  ctx.stroke();

  drawCorner(ctx, 64, 56, 46, 46);
  drawCorner(ctx, 1024, 56, -46, 46);
  drawCorner(ctx, 64, 1416, 46, -46);
  drawCorner(ctx, 1024, 1416, -46, -46);
  ctx.restore();
}

function drawHeader(ctx: CanvasRenderingContext2D, poster: DivinationPosterViewModel) {
  setFont(ctx, 22, '700');
  ctx.fillStyle = '#A04735';
  ctx.textAlign = 'left';
  ctx.fillText('FORTUNE HUB', 112, 112);

  setFont(ctx, 34, '600');
  ctx.fillStyle = '#35291F';
  ctx.fillText('今日占卜签', 112, 154);

  setFont(ctx, 28, '500');
  ctx.fillStyle = '#6F6253';
  ctx.textAlign = 'right';
  ctx.fillText(poster.dateText, 976, 116);

  setFont(ctx, 20, '700');
  ctx.fillStyle = '#A04735';
  ctx.fillText(`HEXAGRAM NO.${poster.hexagramNo}`, 976, 154);
}

function drawTitleBlock(ctx: CanvasRenderingContext2D, poster: DivinationPosterViewModel) {
  ctx.save();
  ctx.textAlign = 'left';
  ctx.fillStyle = '#35291F';
  drawFitText(ctx, poster.title, 112, 260, 680, 92, 62, '700', SERIF_FONT_FAMILY);

  setFont(ctx, 30, '400');
  ctx.fillStyle = '#6F6253';
  ctx.fillText(poster.meaning, 116, 316);

  const levelWidth = Math.max(92, ctx.measureText(poster.level).width + 46);
  drawRoundRect(ctx, 116, 344, levelWidth, 48, 24, '#A04735');
  setFont(ctx, 24, '700');
  ctx.fillStyle = '#FFF6EA';
  ctx.textAlign = 'center';
  ctx.fillText(poster.level, 116 + levelWidth / 2, 376);

  ctx.textAlign = 'left';
  setFont(ctx, 25, '500');
  ctx.fillStyle = '#7A6A58';
  ctx.fillText(`${poster.topicLabel} · ${poster.movingText}`, 116 + levelWidth + 24, 376);

  drawSeal(ctx, 884, 238, 104);
  ctx.restore();
}

function drawOraclePanel(
  ctx: CanvasRenderingContext2D,
  result: DivinationResult,
  poster: DivinationPosterViewModel,
) {
  ctx.save();
  ctx.shadowColor = 'rgba(45,58,52,0.18)';
  ctx.shadowBlur = 34;
  ctx.shadowOffsetY = 18;
  drawRoundRect(ctx, 112, 438, 864, 328, 36, '#2D3A34');
  ctx.restore();

  ctx.save();
  setFont(ctx, 20, '700');
  ctx.textAlign = 'left';
  drawRoundRect(ctx, 156, 474, 82, 36, 18, 'rgba(250,240,220,0.12)', 'rgba(250,240,220,0.22)');
  ctx.fillStyle = '#EEDDC4';
  ctx.fillText('本卦', 176, 498);

  drawHexagram(ctx, result.hexagram.lines, 164, 548, 350, 24, 24, '#F6ECDD');

  setFont(ctx, 168, '400', SERIF_FONT_FAMILY);
  ctx.fillStyle = 'rgba(246,236,221,0.09)';
  ctx.textAlign = 'center';
  ctx.fillText(result.hexagram.symbol, 830, 578);

  setFont(ctx, 22, '700');
  ctx.fillStyle = '#C69A5B';
  ctx.textAlign = 'left';
  ctx.fillText('卦象关键词', 610, 492);

  setFont(ctx, 36, '600');
  ctx.fillStyle = '#FFF6EA';
  wrapText(ctx, poster.keywordText, 610, 544, 290, 48, 2);

  drawInfoLine(ctx, '动爻', poster.movingText, 610, 662);
  drawInfoLine(ctx, '后势', poster.changedText, 610, 708);
  ctx.restore();
}

function drawScores(ctx: CanvasRenderingContext2D, poster: DivinationPosterViewModel) {
  ctx.save();
  ctx.strokeStyle = 'rgba(118,88,55,0.25)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(112, 830);
  ctx.lineTo(976, 830);
  ctx.moveTo(112, 990);
  ctx.lineTo(976, 990);
  ctx.stroke();

  poster.scoreMetrics.forEach((item, index) => {
    const x = 112 + index * 288;
    const centerX = x + 144;

    if (index > 0) {
      ctx.strokeStyle = 'rgba(118,88,55,0.16)';
      ctx.beginPath();
      ctx.moveTo(x, 864);
      ctx.lineTo(x, 956);
      ctx.stroke();
    }

    setFont(ctx, 24, '600');
    ctx.fillStyle = '#6F6253';
    ctx.textAlign = 'center';
    ctx.fillText(item.label, centerX, 874);

    setFont(ctx, 58, '700');
    ctx.fillStyle = '#35291F';
    ctx.fillText(String(item.value), centerX, 932);

    setFont(ctx, 21, '500');
    ctx.fillStyle = '#8B7B67';
    ctx.fillText('/100', centerX + 54, 932);

    drawScoreTrack(ctx, x + 48, 958, 192, item.value, item.color);
  });
  ctx.restore();
}

function drawSummary(ctx: CanvasRenderingContext2D, poster: DivinationPosterViewModel) {
  ctx.save();
  ctx.fillStyle = '#A04735';
  ctx.fillRect(112, 1052, 8, 144);

  setFont(ctx, 30, '700');
  ctx.fillStyle = '#35291F';
  ctx.textAlign = 'left';
  ctx.fillText('一句话结论', 146, 1084);

  setFont(ctx, 34, '500');
  ctx.fillStyle = '#5D5044';
  wrapText(ctx, poster.summaryText, 146, 1136, 780, 48, 3);
  ctx.restore();
}

function drawSuitableAvoid(ctx: CanvasRenderingContext2D, poster: DivinationPosterViewModel) {
  drawAdviceBlock(ctx, 112, 1244, 400, 108, '宜', poster.suitableText, '#EEF4E9', '#58735A');
  drawAdviceBlock(ctx, 576, 1244, 400, 108, '忌', poster.avoidText, '#F8E8E2', '#A04735');
}

function drawFooter(ctx: CanvasRenderingContext2D) {
  ctx.save();
  ctx.strokeStyle = 'rgba(118,88,55,0.23)';
  ctx.beginPath();
  ctx.moveTo(112, 1370);
  ctx.lineTo(760, 1370);
  ctx.stroke();

  setFont(ctx, 24, '400');
  ctx.fillStyle = '#6F6253';
  ctx.textAlign = 'left';
  ctx.fillText('长按识别，生成你的今日占卜', 112, 1410);

  setFont(ctx, 34, '700');
  ctx.fillStyle = '#35291F';
  ctx.fillText('Fortune Hub', 112, 1450);

  drawRoundRect(ctx, 830, 1340, 142, 142, 24, '#FFF9F0', 'rgba(118,88,55,0.26)');
  drawQrPlaceholder(ctx, 856, 1366, 90);
  ctx.restore();
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

function drawCorner(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + width, y);
  ctx.lineTo(x, y);
  ctx.lineTo(x, y + height);
  ctx.stroke();
}

function drawSeal(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.08);
  ctx.strokeStyle = 'rgba(160,71,53,0.78)';
  ctx.lineWidth = 4;
  ctx.strokeRect(-size / 2, -size / 2, size, size);
  setFont(ctx, size * 0.28, '700', SERIF_FONT_FAMILY);
  ctx.fillStyle = '#A04735';
  ctx.textAlign = 'center';
  ctx.fillText('占', 0, -size * 0.08);
  ctx.fillText('签', 0, size * 0.28);
  ctx.restore();
}

function drawInfoLine(
  ctx: CanvasRenderingContext2D,
  label: string,
  value: string,
  x: number,
  y: number,
) {
  setFont(ctx, 20, '700');
  ctx.fillStyle = '#C69A5B';
  ctx.textAlign = 'left';
  ctx.fillText(label, x, y);

  setFont(ctx, 25, '500');
  ctx.fillStyle = '#F6ECDD';
  ctx.fillText(value, x + 66, y);
}

function drawScoreTrack(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  value: number,
  color: string,
) {
  drawRoundRect(ctx, x, y, width, 10, 5, 'rgba(118,88,55,0.12)');
  drawRoundRect(ctx, x, y, width * (value / 100), 10, 5, color);
}

function drawAdviceBlock(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  label: string,
  text: string,
  fillStyle: string,
  accentColor: string,
) {
  drawRoundRect(ctx, x, y, width, height, 28, fillStyle, 'rgba(118,88,55,0.16)');
  setFont(ctx, 36, '700', SERIF_FONT_FAMILY);
  ctx.fillStyle = accentColor;
  ctx.textAlign = 'left';
  ctx.fillText(label, x + 34, y + 66);

  setFont(ctx, 26, '500');
  ctx.fillStyle = '#5D5044';
  wrapText(ctx, text, x + 90, y + 50, width - 122, 36, 2);
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

function clampScore(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
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
