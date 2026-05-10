import type { PosterTheme } from './posterTheme';
import type { Rect } from './types';

type CardOptions = {
  radius: number;
  fill: string;
  border?: string;
  shadow?: string;
  shadowBlur?: number;
  shadowOffsetY?: number;
};

export function drawRoundCard(
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  options: CardOptions,
) {
  ctx.save();

  if (options.shadow) {
    ctx.shadowColor = options.shadow;
    ctx.shadowBlur = options.shadowBlur ?? 24;
    ctx.shadowOffsetY = options.shadowOffsetY ?? 12;
  }

  drawRoundedRectPath(ctx, rect.x, rect.y, rect.w, rect.h, options.radius);
  ctx.fillStyle = options.fill;
  ctx.fill();

  ctx.shadowColor = 'transparent';

  if (options.border) {
    ctx.strokeStyle = options.border;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  ctx.restore();
}

export function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);

  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export function drawSoftCircle(
  ctx: CanvasRenderingContext2D,
  options: {
    x: number;
    y: number;
    r: number;
    color: string;
  },
) {
  ctx.save();
  ctx.fillStyle = options.color;
  ctx.beginPath();
  ctx.arc(options.x, options.y, options.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawPill(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
) {
  drawRoundedRectPath(ctx, x, y, w, h, h / 2);
  ctx.fillStyle = color;
  ctx.fill();
}

export function drawMultilineText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
) {
  const chars = Array.from(text);
  const lines: string[] = [];
  let currentLine = '';
  let hasOverflow = false;

  for (const char of chars) {
    const testLine = currentLine + char;
    const width = ctx.measureText(testLine).width;

    if (width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = char;

      if (lines.length >= maxLines) {
        hasOverflow = true;
        break;
      }
    } else {
      currentLine = testLine;
    }
  }

  if (lines.length < maxLines && currentLine) {
    lines.push(currentLine);
  }

  lines.slice(0, maxLines).forEach((line, index) => {
    const isLast = index === maxLines - 1;
    const finalText = isLast && hasOverflow ? truncateText(ctx, line, maxWidth) : line;
    ctx.fillText(finalText, x, y + index * lineHeight);
  });
}

export function truncateText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
) {
  let result = text;

  while (result.length > 0 && ctx.measureText(`${result}...`).width > maxWidth) {
    result = result.slice(0, -1);
  }

  return `${result}...`;
}

export function drawSingleLineText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
) {
  if (ctx.measureText(text).width <= maxWidth) {
    ctx.fillText(text, x, y);
    return;
  }

  ctx.fillText(truncateText(ctx, text, maxWidth), x, y);
}

export function drawFittedText(
  ctx: CanvasRenderingContext2D,
  options: {
    text: string;
    x: number;
    y: number;
    maxWidth: number;
    maxSize: number;
    minSize: number;
    weight: number;
    family: string;
  },
) {
  let size = options.maxSize;

  while (size > options.minSize) {
    ctx.font = `${options.weight} ${size}px ${options.family}`;
    if (ctx.measureText(options.text).width <= options.maxWidth) {
      break;
    }
    size -= 2;
  }

  ctx.font = `${options.weight} ${size}px ${options.family}`;
  drawSingleLineText(ctx, options.text, options.x, options.y, options.maxWidth);
}

export function drawSparkle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
) {
  ctx.save();
  ctx.fillStyle = color;

  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.quadraticCurveTo(x + size * 0.25, y - size * 0.25, x + size, y);
  ctx.quadraticCurveTo(x + size * 0.25, y + size * 0.25, x, y + size);
  ctx.quadraticCurveTo(x - size * 0.25, y + size * 0.25, x - size, y);
  ctx.quadraticCurveTo(x - size * 0.25, y - size * 0.25, x, y - size);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

export function drawTag(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  theme: PosterTheme,
) {
  ctx.save();

  ctx.font = `700 24px ${theme.font.sans}`;
  const width = ctx.measureText(text).width + 44;
  const height = 42;

  drawRoundedRectPath(ctx, x, y, width, height, theme.radius.sm);

  const gradient = ctx.createLinearGradient(x, y, x + width, y);
  gradient.addColorStop(0, theme.color.purple);
  gradient.addColorStop(1, theme.color.tagGradientEnd);

  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.fillStyle = theme.color.white;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + 22, y + height / 2);

  ctx.restore();
}

export function drawSmallDivider(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  theme: PosterTheme,
) {
  ctx.save();

  ctx.strokeStyle = theme.color.divider;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.stroke();

  ctx.translate(x + w / 2, y);
  ctx.rotate(Math.PI / 4);
  ctx.strokeRect(-5, -5, 10, 10);

  ctx.restore();
}

export function drawMoonIcon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  theme: PosterTheme,
) {
  ctx.save();

  ctx.fillStyle = theme.color.purplePale;
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = theme.color.purple;
  ctx.beginPath();
  ctx.arc(x + size / 2 + 4, y + size / 2 - 2, size * 0.42, Math.PI * 0.45, Math.PI * 1.55);
  ctx.fill();

  ctx.restore();
}

export function drawCircleIcon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  icon: string,
  theme: PosterTheme,
) {
  ctx.save();

  const cx = x + size / 2;
  const cy = y + size / 2;

  ctx.fillStyle = theme.color.purplePale;
  ctx.beginPath();
  ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = theme.color.purple;

  if (icon === 'lightning') {
    ctx.beginPath();
    ctx.moveTo(cx + 4, cy - 24);
    ctx.lineTo(cx - 12, cy + 2);
    ctx.lineTo(cx + 2, cy + 2);
    ctx.lineTo(cx - 4, cy + 24);
    ctx.lineTo(cx + 16, cy - 6);
    ctx.lineTo(cx + 2, cy - 6);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(cx - 22, cy + 12);
    ctx.lineTo(cx - 6, cy - 8);
    ctx.lineTo(cx + 8, cy + 4);
    ctx.lineTo(cx + 22, cy - 14);
    ctx.lineTo(cx + 22, cy + 16);
    ctx.lineTo(cx - 22, cy + 16);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

export function drawMiniIcon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  icon: string,
  theme: PosterTheme,
) {
  ctx.save();

  ctx.fillStyle = theme.color.purplePale;
  ctx.beginPath();
  ctx.arc(x + 18, y + 18, 18, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = theme.color.purple;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (icon === 'method') {
    ctx.beginPath();
    ctx.moveTo(x + 8, y + 25);
    ctx.lineTo(x + 28, y + 25);
    ctx.moveTo(x + 10, y + 15);
    ctx.lineTo(x + 26, y + 15);
    ctx.stroke();
  } else if (icon === 'move') {
    ctx.beginPath();
    ctx.moveTo(x + 18, y + 8);
    ctx.lineTo(x + 10, y + 20);
    ctx.lineTo(x + 20, y + 20);
    ctx.lineTo(x + 15, y + 30);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(x + 18, y + 18, 10, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

export function drawBrandBadge(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  theme: PosterTheme,
) {
  ctx.save();

  const size = 64;
  const cx = x + size / 2;
  const cy = y + size / 2;

  ctx.fillStyle = theme.color.purplePale;
  ctx.strokeStyle = theme.color.purple;
  ctx.globalAlpha = 0.72;
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.globalAlpha = 1;
  drawSparkle(ctx, cx, cy, 18, theme.color.purpleDeep);
  drawSparkle(ctx, cx, cy, 8, theme.color.white);

  ctx.restore();
}

export function drawBambooDecoration(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  theme: PosterTheme,
) {
  ctx.save();

  ctx.strokeStyle = theme.color.bambooStroke;
  ctx.fillStyle = theme.color.bambooFill;
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(x + 80, y + 8);
  ctx.quadraticCurveTo(x + 30, y + 60, x + 20, y + 120);
  ctx.stroke();

  for (let i = 0; i < 5; i += 1) {
    const leafY = y + 18 + i * 22;
    const side = i % 2 === 0 ? 1 : -1;

    ctx.beginPath();
    ctx.ellipse(
      x + 62 + side * 20,
      leafY,
      9,
      32,
      side * 0.9,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }

  ctx.restore();
}

export function drawQrPlaceholder(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  theme: PosterTheme,
) {
  const cell = size / 9;

  ctx.fillStyle = theme.color.qrPlaceholder;
  drawRoundedRectPath(ctx, x, y, size, size, theme.radius.xs);
  ctx.fill();

  ctx.fillStyle = theme.color.qrDot;

  const points = [
    [0, 0], [1, 0], [3, 0], [6, 0], [8, 0],
    [0, 1], [3, 1], [4, 1], [8, 1],
    [2, 2], [5, 2], [6, 2],
    [0, 3], [1, 3], [4, 3], [7, 3],
    [3, 4], [4, 4], [8, 4],
    [0, 5], [2, 5], [5, 5], [6, 5],
    [1, 6], [4, 6], [8, 6],
    [0, 8], [2, 8], [5, 8], [6, 8], [8, 8],
  ];

  points.forEach(([cx, cy]) => {
    ctx.fillRect(x + cx * cell, y + cy * cell, cell * 0.65, cell * 0.65);
  });
}
