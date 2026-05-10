import { createPosterLayout } from './layout';
import { posterTheme, type PosterTheme } from './posterTheme';
import type { DivinationPosterData, HexagramLine, Rect } from './types';
import {
  drawBambooDecoration,
  drawBrandBadge,
  drawCircleIcon,
  drawFittedText,
  drawMiniIcon,
  drawMoonIcon,
  drawMultilineText,
  drawPill,
  drawQrPlaceholder,
  drawRoundCard,
  drawSingleLineText,
  drawSmallDivider,
  drawSoftCircle,
  drawSparkle,
  drawTag,
  truncateText,
} from './drawUtils';

export async function drawDivinationPoster(
  ctx: CanvasRenderingContext2D,
  data: DivinationPosterData,
  qrImage?: CanvasImageSource,
  templateImage?: CanvasImageSource,
) {
  const layout = createPosterLayout();
  const theme = posterTheme;

  if (templateImage) {
    drawTemplateBase(ctx, layout.canvas, templateImage);
    drawTemplateContent(ctx, data, theme);
    drawTemplateQrCode(ctx, layout.qr, qrImage);
    return;
  }

  drawPosterBackground(ctx, layout.canvas, theme);
  drawTopDecoration(ctx, layout.canvas, theme);
  drawPosterTitle(ctx, layout.title, data.title, theme);
  drawHeroCard(ctx, layout.heroCard, data, theme);
  drawQuestionCard(ctx, layout.questionCard, data.question, theme);
  drawAnalysisCard(ctx, layout.leftAnalysisCard, data.analysisCards[0], theme);
  drawAnalysisCard(ctx, layout.rightAnalysisCard, data.analysisCards[1], theme);
  drawFooter(ctx, layout.footer, data.footer, theme);
  drawQrCode(ctx, layout.qr, qrImage, theme);
}

function drawTemplateBase(
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  image: CanvasImageSource,
) {
  ctx.save();
  ctx.drawImage(image, rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

function drawTemplateContent(
  ctx: CanvasRenderingContext2D,
  data: DivinationPosterData,
  theme: PosterTheme,
) {
  const movingText = findChipValue(data, '动爻', '动爻未显');
  const changedName = findChipValue(data, '变卦', '本卦不变');
  const methodText = findChipValue(data, '起法', data.methodLabel);
  const adviceRows = buildTemplateAdviceRows(data);

  ctx.save();
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';

  ctx.font = `600 22px ${theme.font.sans}`;
  ctx.fillStyle = theme.color.textMuted;
  drawSingleLineText(ctx, methodText, 314, 356, 170);

  drawFittedText(ctx, {
    text: data.result.name,
    x: 318,
    y: 443,
    maxWidth: 170,
    maxSize: 32,
    minSize: 24,
    weight: 700,
    family: theme.font.serif,
  });

  ctx.font = `500 25px ${theme.font.serif}`;
  ctx.fillStyle = theme.color.textSecondary;
  drawCenteredTemplateText(ctx, data.result.subtitle, 285, 596, 270);

  ctx.font = `700 28px ${theme.font.serif}`;
  ctx.fillStyle = theme.color.goldText;
  drawVisualCenteredTemplateText(ctx, data.result.luckyLevel, 778, 381, 96);

  drawHexagram(ctx, {
    x: 564,
    y: 500,
    lineWidth: 184,
    lineHeight: 11,
    gap: 18,
    lines: data.result.hexagramLines,
    theme,
  });

  ctx.font = `600 22px ${theme.font.serif}`;
  ctx.fillStyle = theme.color.textSecondary;
  drawCenteredTemplateText(ctx, data.result.trigramNote, 656, 674, 210);

  ctx.font = `700 25px ${theme.font.sans}`;
  ctx.fillStyle = theme.color.textPrimary;
  drawSingleLineText(ctx, movingText, 250, 774, 96);
  drawSingleLineText(ctx, changedName, 566, 774, 112);

  ctx.font = `400 24px ${theme.font.sans}`;
  ctx.fillStyle = theme.color.textSecondary;
  drawMultilineText(ctx, data.question.summary, 318, 986, 510, 46, 2);

  drawTemplateKeywords(ctx, buildTemplateKeywords(data, movingText, changedName), theme);
  drawTemplateAdvice(ctx, adviceRows, theme);

  ctx.restore();
}

function drawTemplateKeywords(
  ctx: CanvasRenderingContext2D,
  keywords: string[],
  theme: PosterTheme,
) {
  const slots = [
    { x: 286, y: 1076, w: 126 },
    { x: 428, y: 1076, w: 126 },
    { x: 571, y: 1076, w: 126 },
    { x: 713, y: 1076, w: 126 },
  ];

  ctx.save();
  ctx.font = `600 17px ${theme.font.sans}`;
  ctx.fillStyle = theme.color.purpleDeep;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';

  slots.forEach((slot, index) => {
    drawCenteredTemplateText(ctx, keywords[index] || '', slot.x + slot.w / 2, slot.y + 20, slot.w - 24);
  });

  ctx.restore();
}

function drawTemplateAdvice(
  ctx: CanvasRenderingContext2D,
  rows: Array<{ label: string; text: string }>,
  theme: PosterTheme,
) {
  const yPositions = [1246, 1316, 1386];

  ctx.save();
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';

  rows.slice(0, 3).forEach((row, index) => {
    const y = yPositions[index];

    ctx.font = `700 22px ${theme.font.sans}`;
    ctx.fillStyle = theme.color.purpleDeep;
    drawSingleLineText(ctx, row.label, 182, y, 156);

    ctx.font = `400 22px ${theme.font.sans}`;
    ctx.fillStyle = theme.color.textSecondary;
    drawSingleLineText(ctx, row.text, 400, y, 382);
  });

  ctx.restore();
}

function drawTemplateQrCode(
  ctx: CanvasRenderingContext2D,
  _rect: Rect,
  qrImage: CanvasImageSource | undefined,
) {
  if (!qrImage) {
    return;
  }

  const rect = { x: 666, y: 1470, w: 148, h: 148 };

  ctx.save();
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.drawImage(qrImage, rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

function drawCenteredTemplateText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
) {
  ctx.save();
  ctx.textAlign = 'center';
  const finalText = ctx.measureText(text).width > maxWidth
    ? truncateText(ctx, text, maxWidth)
    : text;
  ctx.fillText(finalText, x, y);
  ctx.restore();
}

function drawVisualCenteredTemplateText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
) {
  ctx.save();
  ctx.textAlign = 'center';

  const finalText = ctx.measureText(text).width > maxWidth
    ? truncateText(ctx, text, maxWidth)
    : text;
  const metrics = ctx.measureText(finalText);
  const ascent = Number(metrics.actualBoundingBoxAscent);
  const descent = Number(metrics.actualBoundingBoxDescent);

  if (Number.isFinite(ascent) && Number.isFinite(descent) && ascent > 0) {
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(finalText, x, y + (ascent - descent) / 2);
  } else {
    ctx.textBaseline = 'middle';
    ctx.fillText(finalText, x, y);
  }

  ctx.restore();
}

function findChipValue(
  data: DivinationPosterData,
  label: string,
  fallback: string,
) {
  return data.chips.find((item) => item.label === label)?.value || fallback;
}

function buildTemplateKeywords(
  data: DivinationPosterData,
  movingText: string,
  changedName: string,
) {
  return [
    data.question.tag,
    data.result.trigramNote,
    movingText,
    changedName,
  ];
}

function buildTemplateAdviceRows(data: DivinationPosterData) {
  const first = data.analysisCards[0];
  const second = data.analysisCards[1];

  return [
    {
      label: first ? `${first.title}提示` : '当下提示',
      text: first?.actionText || first?.content || data.result.subtitle,
    },
    {
      label: second ? `${second.title}提示` : '趋势提示',
      text: second?.actionText || second?.content || data.question.summary,
    },
    {
      label: '今日取舍',
      text: data.question.summary || data.result.subtitle,
    },
  ];
}

function drawPosterBackground(
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  theme: PosterTheme,
) {
  const gradient = ctx.createLinearGradient(0, 0, 0, rect.h);

  gradient.addColorStop(0, theme.color.bgTop);
  gradient.addColorStop(0.55, theme.color.bgMiddle);
  gradient.addColorStop(1, theme.color.bgBottom);

  ctx.fillStyle = gradient;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

  drawSoftCircle(ctx, {
    x: rect.w / 2,
    y: 170,
    r: 260,
    color: theme.color.glowWhite,
  });

  drawSoftCircle(ctx, {
    x: rect.w * 0.88,
    y: 390,
    r: 180,
    color: theme.color.purpleGlow,
  });

  drawSoftCircle(ctx, {
    x: rect.w * 0.18,
    y: 1350,
    r: 220,
    color: theme.color.goldGlow,
  });
}

function drawTopDecoration(
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  theme: PosterTheme,
) {
  ctx.save();

  const cx = rect.w / 2;

  ctx.strokeStyle = theme.color.topArc;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, 178, 250, Math.PI * 1.08, Math.PI * 1.92);
  ctx.stroke();

  for (let i = 0; i < 28; i += 1) {
    const angle = Math.PI * 1.22 + (Math.PI * 0.56 * i) / 27;
    const inner = 126;
    const outer = i % 2 === 0 ? 164 : 148;

    const x1 = cx + Math.cos(angle) * inner;
    const y1 = 172 + Math.sin(angle) * inner;
    const x2 = cx + Math.cos(angle) * outer;
    const y2 = 172 + Math.sin(angle) * outer;

    ctx.strokeStyle = theme.color.topRay;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  ctx.restore();
}

function drawPosterTitle(
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  title: string,
  theme: PosterTheme,
) {
  ctx.save();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.font = `700 52px ${theme.font.serif}`;
  ctx.fillStyle = theme.color.textPrimary;
  ctx.fillText(title, rect.x + rect.w / 2, rect.y + rect.h / 2);

  drawSparkle(ctx, rect.x + 265, rect.y + 56, 12, theme.color.gold);
  drawSparkle(ctx, rect.x + rect.w - 265, rect.y + 56, 12, theme.color.gold);

  ctx.restore();
}

function drawHeroCard(
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  data: DivinationPosterData,
  theme: PosterTheme,
) {
  drawRoundCard(ctx, rect, {
    radius: theme.radius.xl,
    fill: theme.color.card,
    border: theme.color.border,
    shadow: theme.shadow.hero.color,
    shadowBlur: theme.shadow.hero.blur,
    shadowOffsetY: theme.shadow.hero.offsetY,
  });

  const padding = 48;

  ctx.save();
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';

  ctx.font = `600 30px ${theme.font.sans}`;
  ctx.fillStyle = theme.color.purple;
  drawSingleLineText(ctx, data.methodLabel, rect.x + padding + 48, rect.y + 54, 560);

  drawMoonIcon(ctx, rect.x + padding, rect.y + 58, 28, theme);

  drawLuckyBadge(
    ctx,
    rect.x + rect.w - padding - 90,
    rect.y + 44,
    data.result.luckyLevel,
    theme,
  );

  drawFittedText(ctx, {
    text: `${data.result.prefix}：${data.result.name}`,
    x: rect.x + padding,
    y: rect.y + 132,
    maxWidth: rect.w - padding * 2 - 108,
    maxSize: 62,
    minSize: 44,
    weight: 700,
    family: theme.font.serif,
  });

  ctx.font = `500 34px ${theme.font.serif}`;
  ctx.fillStyle = theme.color.textSecondary;
  drawSingleLineText(ctx, data.result.subtitle, rect.x + padding, rect.y + 238, 500);

  drawSmallDivider(ctx, rect.x + padding + 170, rect.y + 260, 180, theme);

  drawHexagram(ctx, {
    x: rect.x + padding + 10,
    y: rect.y + 338,
    lineWidth: 300,
    lineHeight: 18,
    gap: 24,
    lines: data.result.hexagramLines,
    theme,
  });

  drawTrigramNote(ctx, {
    x: rect.x + rect.w - padding - 260,
    y: rect.y + 340,
    w: 260,
    h: 230,
    note: data.result.trigramNote,
    theme,
  });

  const chipY = rect.y + rect.h - 118;
  const chipGap = 24;
  const chipW = (rect.w - padding * 2 - chipGap * 2) / 3;

  data.chips.slice(0, 3).forEach((chip, index) => {
    drawInfoChip(ctx, {
      x: rect.x + padding + index * (chipW + chipGap),
      y: chipY,
      w: chipW,
      h: 76,
      chip,
      theme,
    });
  });

  ctx.restore();
}

function drawHexagram(
  ctx: CanvasRenderingContext2D,
  options: {
    x: number;
    y: number;
    lineWidth: number;
    lineHeight: number;
    gap: number;
    lines: HexagramLine[];
    theme: PosterTheme;
  },
) {
  const { x, y, lineWidth, lineHeight, gap, lines, theme } = options;

  lines.slice(0, 6).forEach((line, index) => {
    const lineY = y + index * (lineHeight + gap);
    const fill = line.active ? theme.color.purple : theme.color.hexagram;

    if (line.type === 'solid') {
      drawPill(ctx, x, lineY, lineWidth, lineHeight, fill);
    } else {
      const segmentW = (lineWidth - 72) / 2;
      drawPill(ctx, x, lineY, segmentW, lineHeight, fill);
      drawPill(ctx, x + segmentW + 72, lineY, segmentW, lineHeight, fill);
    }
  });
}

function drawLuckyBadge(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  theme: PosterTheme,
) {
  ctx.save();

  const size = 90;
  const cx = x + size / 2;
  const cy = y + size / 2;

  ctx.fillStyle = theme.color.goldSoft;
  ctx.strokeStyle = theme.color.gold;
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, size / 2 - 8, 0, Math.PI * 2);
  ctx.strokeStyle = theme.color.badgeRing;
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `700 30px ${theme.font.serif}`;
  ctx.fillStyle = theme.color.goldText;
  ctx.fillText(text, cx, cy);

  ctx.restore();
}

function drawTrigramNote(
  ctx: CanvasRenderingContext2D,
  options: {
    x: number;
    y: number;
    w: number;
    h: number;
    note: string;
    theme: PosterTheme;
  },
) {
  const { x, y, w, note, theme } = options;
  const cx = x + w / 2;

  ctx.save();

  drawSoftCircle(ctx, {
    x: cx,
    y: y + 54,
    r: 54,
    color: theme.color.purplePale,
  });

  ctx.strokeStyle = theme.color.border;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, y + 54, 68, 0, Math.PI * 2);
  ctx.stroke();

  for (let i = 0; i < 5; i += 1) {
    drawPill(ctx, cx - 30, y + 28 + i * 12, 60, 6, theme.color.purple);
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.font = `500 30px ${theme.font.serif}`;
  ctx.fillStyle = theme.color.textPrimary;
  ctx.fillText(
    ctx.measureText(note).width > w ? truncateText(ctx, note, w) : note,
    cx,
    y + 128,
  );

  drawSmallDivider(ctx, cx - 70, y + 186, 140, theme);

  ctx.restore();
}

function drawInfoChip(
  ctx: CanvasRenderingContext2D,
  options: {
    x: number;
    y: number;
    w: number;
    h: number;
    chip: DivinationPosterData['chips'][number];
    theme: PosterTheme;
  },
) {
  const { x, y, w, h, chip, theme } = options;

  drawRoundCard(
    ctx,
    { x, y, w, h },
    {
      radius: theme.radius.sm + 2,
      fill: theme.color.chipFill,
      border: theme.color.chipBorder,
      shadow: theme.shadow.chip.color,
      shadowBlur: theme.shadow.chip.blur,
      shadowOffsetY: theme.shadow.chip.offsetY,
    },
  );

  ctx.save();
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';

  drawMiniIcon(ctx, x + 24, y + 20, chip.icon, theme);

  ctx.font = `400 20px ${theme.font.sans}`;
  ctx.fillStyle = theme.color.textMuted;
  drawSingleLineText(ctx, chip.label, x + 72, y + 14, w - 92);

  ctx.font = `700 25px ${theme.font.sans}`;
  ctx.fillStyle = theme.color.textPrimary;
  drawSingleLineText(ctx, chip.value, x + 72, y + 42, w - 92);

  ctx.restore();
}

function drawQuestionCard(
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  question: DivinationPosterData['question'],
  theme: PosterTheme,
) {
  drawRoundCard(ctx, rect, {
    radius: theme.radius.lg,
    fill: theme.color.questionCard,
    border: theme.color.borderLight,
    shadow: theme.shadow.card.color,
    shadowBlur: theme.shadow.card.blur,
    shadowOffsetY: theme.shadow.card.offsetY,
  });

  const x = rect.x + 42;
  const y = rect.y + 34;

  drawTag(ctx, x, y, question.tag, theme);

  ctx.save();

  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  ctx.fillStyle = theme.color.textPrimary;
  ctx.font = `700 40px ${theme.font.serif}`;
  drawSingleLineText(ctx, question.text, x, y + 58, rect.w - 260);

  ctx.fillStyle = theme.color.textSecondary;
  ctx.font = `400 25px ${theme.font.sans}`;
  drawMultilineText(ctx, question.summary, x, y + 116, rect.w - 84, 34, 2);

  drawBambooDecoration(ctx, rect.x + rect.w - 190, rect.y + 40, theme);

  ctx.restore();
}

function drawAnalysisCard(
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  card: DivinationPosterData['analysisCards'][number] | undefined,
  theme: PosterTheme,
) {
  if (!card) {
    return;
  }

  drawRoundCard(ctx, rect, {
    radius: theme.radius.lg,
    fill: theme.color.card,
    border: theme.color.borderLight,
    shadow: theme.shadow.card.color,
    shadowBlur: theme.shadow.card.blur,
    shadowOffsetY: theme.shadow.card.offsetY,
  });

  const padding = 34;

  ctx.save();
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';

  drawCircleIcon(ctx, rect.x + padding, rect.y + 34, 58, card.icon, theme);

  ctx.font = `700 28px ${theme.font.sans}`;
  ctx.fillStyle = theme.color.purple;
  drawSingleLineText(ctx, card.title, rect.x + padding + 76, rect.y + 34, rect.w - padding * 2 - 76);

  ctx.font = `700 40px ${theme.font.serif}`;
  ctx.fillStyle = theme.color.textPrimary;
  drawSingleLineText(ctx, card.value, rect.x + padding + 76, rect.y + 74, rect.w - padding * 2 - 76);

  ctx.font = `400 25px ${theme.font.sans}`;
  ctx.fillStyle = theme.color.textSecondary;

  drawMultilineText(
    ctx,
    card.content,
    rect.x + padding,
    rect.y + 142,
    rect.w - padding * 2,
    36,
    4,
  );

  ctx.font = `700 25px ${theme.font.sans}`;
  ctx.fillStyle = theme.color.purple;
  drawMultilineText(
    ctx,
    card.actionText,
    rect.x + padding,
    rect.y + rect.h - 68,
    rect.w - padding * 2,
    32,
    1,
  );

  drawSparkle(ctx, rect.x + rect.w - 48, rect.y + 130, 10, theme.color.gold);

  ctx.restore();
}

function drawFooter(
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  footer: DivinationPosterData['footer'],
  theme: PosterTheme,
) {
  ctx.save();

  drawBrandBadge(ctx, rect.x, rect.y + 18, theme);

  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  ctx.fillStyle = theme.color.textSecondary;
  ctx.font = `400 23px ${theme.font.sans}`;
  drawSingleLineText(ctx, footer.slogan, rect.x + 88, rect.y + 18, rect.w - 250);

  ctx.fillStyle = theme.color.textPrimary;
  ctx.font = `700 42px Georgia, ${theme.font.serif}`;
  drawSingleLineText(ctx, footer.brand, rect.x + 88, rect.y + 50, rect.w - 300);

  drawSparkle(ctx, rect.x + 384, rect.y + 72, 10, theme.color.gold);

  ctx.restore();
}

function drawQrCode(
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  qrImage: CanvasImageSource | undefined,
  theme: PosterTheme,
) {
  drawRoundCard(ctx, rect, {
    radius: theme.radius.md + 2,
    fill: theme.color.white,
    border: theme.color.border,
    shadow: theme.shadow.qr.color,
    shadowBlur: theme.shadow.qr.blur,
    shadowOffsetY: theme.shadow.qr.offsetY,
  });

  if (qrImage) {
    ctx.drawImage(qrImage, rect.x + 12, rect.y + 12, rect.w - 24, rect.h - 24);
    return;
  }

  drawQrPlaceholder(ctx, rect.x + 20, rect.y + 20, rect.w - 40, theme);
}
