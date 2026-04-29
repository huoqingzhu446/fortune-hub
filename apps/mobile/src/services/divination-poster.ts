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

const FONT_FAMILY = 'PingFang SC, Microsoft YaHei, sans-serif';

export interface DivinationPosterFile {
  tempFilePath: string;
  width: number;
  height: number;
  fileName: string;
}

export function getWechatPosterRuntime() {
  return (globalThis as typeof globalThis & { wx?: WechatCanvasRuntime }).wx;
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
  drawBackground(ctx);
  drawDecorations(ctx);
  drawHeader(ctx, result);
  drawMainVisual(ctx, result);
  drawScores(ctx, result);
  drawSummary(ctx, result);
  drawSuitableAvoid(ctx, result);
  drawFooter(ctx);
}

function drawBackground(ctx: CanvasRenderingContext2D) {
  const gradient = ctx.createLinearGradient(0, 0, 0, DIVINATION_POSTER_HEIGHT);
  gradient.addColorStop(0, '#FFF9EF');
  gradient.addColorStop(0.52, '#F4ECFF');
  gradient.addColorStop(1, '#FFF6E5');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, DIVINATION_POSTER_WIDTH, DIVINATION_POSTER_HEIGHT);

  ctx.fillStyle = 'rgba(255,255,255,0.46)';
  for (let y = 0; y < DIVINATION_POSTER_HEIGHT; y += 28) {
    ctx.fillRect(0, y, DIVINATION_POSTER_WIDTH, 1);
  }
}

function drawDecorations(ctx: CanvasRenderingContext2D) {
  ctx.save();
  ctx.globalAlpha = 0.9;

  const purpleGlow = ctx.createRadialGradient(150, 220, 12, 150, 220, 230);
  purpleGlow.addColorStop(0, 'rgba(139,111,214,0.36)');
  purpleGlow.addColorStop(1, 'rgba(139,111,214,0)');
  ctx.fillStyle = purpleGlow;
  ctx.fillRect(0, 0, 420, 480);

  const goldGlow = ctx.createRadialGradient(640, 120, 8, 640, 120, 190);
  goldGlow.addColorStop(0, 'rgba(216,166,78,0.28)');
  goldGlow.addColorStop(1, 'rgba(216,166,78,0)');
  ctx.fillStyle = goldGlow;
  ctx.fillRect(440, 0, 310, 340);

  ctx.strokeStyle = 'rgba(216,166,78,0.36)';
  ctx.lineWidth = 2;
  drawCloud(ctx, 74, 176, 0.88);
  drawCloud(ctx, 534, 1038, 0.74);
  drawMoon(ctx, 574, 184, 54);
  drawStar(ctx, 126, 92, 18);
  drawStar(ctx, 662, 300, 12);

  ctx.restore();
}

function drawHeader(ctx: CanvasRenderingContext2D, result: DivinationResult) {
  setFont(ctx, 26, '500');
  ctx.fillStyle = '#8B6FD6';
  ctx.textAlign = 'left';
  ctx.fillText('今日占卜结果', 64, 92);

  setFont(ctx, 24, '400');
  ctx.fillStyle = '#8B7A64';
  ctx.textAlign = 'right';
  ctx.fillText(formatDivinationDate(result.createdAt), DIVINATION_POSTER_WIDTH - 64, 92);

  setFont(ctx, 58, '700');
  ctx.fillStyle = '#4E3825';
  ctx.textAlign = 'center';
  ctx.fillText(result.hexagram.name, DIVINATION_POSTER_WIDTH / 2, 178);

  setFont(ctx, 24, '400');
  ctx.fillStyle = '#8B7A64';
  ctx.fillText(result.hexagram.meaning, DIVINATION_POSTER_WIDTH / 2, 222);
}

function drawMainVisual(ctx: CanvasRenderingContext2D, result: DivinationResult) {
  drawRoundRect(ctx, 78, 274, 594, 392, 38, 'rgba(255,255,255,0.72)', 'rgba(216,166,78,0.3)');

  const hexX = 156;
  const hexY = 352;
  drawHexagram(ctx, result.hexagram.lines, hexX, hexY, 228, 26, 24);

  setFont(ctx, 150, '400');
  ctx.fillStyle = 'rgba(139,111,214,0.12)';
  ctx.textAlign = 'center';
  ctx.fillText(result.hexagram.symbol, 532, 428);

  drawRoundRect(ctx, 452, 494, 108, 42, 21, '#FFF3D8', '#E1B76E');
  setFont(ctx, 22, '600');
  ctx.fillStyle = '#B97724';
  ctx.fillText(result.hexagram.level, 506, 522);

  setFont(ctx, 27, '600');
  ctx.fillStyle = '#4E3825';
  ctx.textAlign = 'left';
  ctx.fillText('卦象关键词', 420, 574);

  setFont(ctx, 22, '400');
  ctx.fillStyle = '#7B6B59';
  wrapText(ctx, result.keywords.join(' · '), 420, 612, 190, 32, 2);
}

function drawScores(ctx: CanvasRenderingContext2D, result: DivinationResult) {
  const metrics = [
    { label: '综合指数', value: result.scores.overall, color: '#8B6FD6' },
    { label: '情绪指数', value: result.scores.emotion, color: '#F3A6B5' },
    { label: '行动时机', value: result.scores.action, color: '#8FB99A' },
  ];

  metrics.forEach((item, index) => {
    const x = 92 + index * 194;
    drawRoundRect(ctx, x, 704, 164, 136, 28, 'rgba(255,255,255,0.74)', 'rgba(255,255,255,0.9)');
    drawArcScore(ctx, x + 82, 760, 46, item.value, item.color);
    setFont(ctx, 34, '700');
    ctx.fillStyle = '#4E3825';
    ctx.textAlign = 'center';
    ctx.fillText(String(item.value), x + 82, 774);
    setFont(ctx, 20, '400');
    ctx.fillStyle = '#8B7A64';
    ctx.fillText('/100', x + 82, 804);
    setFont(ctx, 22, '500');
    ctx.fillStyle = '#6B5A49';
    ctx.fillText(item.label, x + 82, 738);
  });
}

function drawSummary(ctx: CanvasRenderingContext2D, result: DivinationResult) {
  drawRoundRect(ctx, 64, 884, 622, 186, 30, 'rgba(255,255,255,0.78)', 'rgba(255,255,255,0.9)');
  setFont(ctx, 26, '700');
  ctx.fillStyle = '#4E3825';
  ctx.textAlign = 'left';
  ctx.fillText('一句话结论', 98, 932);

  setFont(ctx, 26, '400');
  ctx.fillStyle = '#675848';
  wrapText(ctx, result.summary, 98, 976, 552, 38, 3);
}

function drawSuitableAvoid(ctx: CanvasRenderingContext2D, result: DivinationResult) {
  drawRoundRect(ctx, 64, 1104, 286, 116, 26, '#F4F8ED', 'rgba(143,185,154,0.36)');
  drawRoundRect(ctx, 400, 1104, 286, 116, 26, '#FFF1EC', 'rgba(243,166,181,0.28)');

  setFont(ctx, 26, '700');
  ctx.textAlign = 'left';
  ctx.fillStyle = '#4F7C5A';
  ctx.fillText('宜', 96, 1148);
  ctx.fillStyle = '#B75A4F';
  ctx.fillText('忌', 432, 1148);

  setFont(ctx, 22, '400');
  ctx.fillStyle = '#5A6B4D';
  wrapText(ctx, result.suitable.slice(0, 3).join('、'), 136, 1148, 176, 32, 2);
  ctx.fillStyle = '#7B5A55';
  wrapText(ctx, result.avoid.slice(0, 3).join('、'), 472, 1148, 176, 32, 2);
}

function drawFooter(ctx: CanvasRenderingContext2D) {
  setFont(ctx, 22, '400');
  ctx.fillStyle = '#8B7A64';
  ctx.textAlign = 'left';
  ctx.fillText('长按识别，生成你的今日占卜', 64, 1270);
  ctx.fillStyle = '#4E3825';
  setFont(ctx, 28, '700');
  ctx.fillText('Fortune Hub', 64, 1308);

  drawRoundRect(ctx, 584, 1228, 112, 112, 22, '#FFFFFF', 'rgba(216,166,78,0.28)');
  drawQrPlaceholder(ctx, 604, 1248, 72);
}

function drawHexagram(
  ctx: CanvasRenderingContext2D,
  lines: boolean[],
  x: number,
  y: number,
  width: number,
  lineHeight: number,
  gap: number,
) {
  ctx.fillStyle = '#3D3342';
  const segmentGap = 42;
  lines.forEach((solid, index) => {
    const lineY = y + (5 - index) * (lineHeight + gap);

    if (solid) {
      drawRoundRect(ctx, x, lineY, width, lineHeight, 4, '#3D3342');
      return;
    }

    drawRoundRect(ctx, x, lineY, (width - segmentGap) / 2, lineHeight, 4, '#3D3342');
    drawRoundRect(ctx, x + (width + segmentGap) / 2, lineY, (width - segmentGap) / 2, lineHeight, 4, '#3D3342');
  });
}

function drawArcScore(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  value: number,
  color: string,
) {
  ctx.save();
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(120,94,86,0.12)';
  ctx.beginPath();
  ctx.arc(cx, cy, radius, Math.PI * 0.78, Math.PI * 2.22);
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, Math.PI * 0.78, Math.PI * (0.78 + 1.44 * (value / 100)));
  ctx.stroke();
  ctx.restore();
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

function drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.beginPath();
  ctx.moveTo(0, 36);
  ctx.bezierCurveTo(34, 0, 78, 0, 104, 32);
  ctx.bezierCurveTo(140, 12, 184, 34, 184, 72);
  ctx.bezierCurveTo(146, 58, 106, 74, 72, 74);
  ctx.bezierCurveTo(44, 74, 18, 64, 0, 36);
  ctx.stroke();
  ctx.restore();
}

function drawMoon(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  ctx.save();
  ctx.fillStyle = 'rgba(216,166,78,0.38)';
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFF9EF';
  ctx.beginPath();
  ctx.arc(x + radius * 0.36, y - radius * 0.14, radius * 0.86, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  ctx.save();
  ctx.strokeStyle = 'rgba(216,166,78,0.64)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - radius, y);
  ctx.lineTo(x + radius, y);
  ctx.moveTo(x, y - radius);
  ctx.lineTo(x, y + radius);
  ctx.stroke();
  ctx.restore();
}

function drawQrPlaceholder(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.fillStyle = '#F7F0E3';
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = '#4E3825';
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
    ctx.fillRect(x + cx * unit + 2, y + cy * unit + 2, unit - 4, unit - 4);
  });
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
      ctx.fillText(line, x, y + lineCount * lineHeight);
      line = text[index];
      lineCount += 1;

      if (lineCount >= maxLines - 1) {
        break;
      }
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
) {
  ctx.font = `${weight} ${size}px ${FONT_FAMILY}`;
}
