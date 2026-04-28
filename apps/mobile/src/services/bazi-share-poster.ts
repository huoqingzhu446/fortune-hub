type BaziElement = '木' | '火' | '土' | '金' | '水';

type PillarInput =
  | string
  | {
      title?: string;
      stem?: string;
      branch?: string;
      value?: string;
      element?: BaziElement | string;
    };

export interface BaziSharePosterData {
  title?: string;
  subtitle?: string;
  tagText?: string;
  calendarText?: string;
  birthDate?: string;
  birthTime?: string;
  birthPlace?: string;
  dayMaster?: string;
  pillars?: {
    year?: PillarInput;
    month?: PillarInput;
    day?: PillarInput;
    hour?: PillarInput;
  };
  wuxingTrend?: string;
  favorableElements?: string;
  analysis?: string[];
  fortunes?: {
    overall?: number | string;
    career?: number | string;
    love?: number | string;
    items?: Array<{
      label: string;
      value: number | string;
      color?: string;
    }>;
  };
  qrcode: string;
  backgroundImage?: string;
  landscapeImage?: string;
  brandLabel?: string;
  bottomSlogan?: string;
}

type PosterCanvas = {
  width: number;
  height: number;
  getContext: (type: '2d') => CanvasRenderingContext2D | null;
  createImage: () => PosterCanvasImage;
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
};

type NormalizedPillar = {
  label: string;
  stem: string;
  branch: string;
  stemElement: BaziElement;
  branchElement: BaziElement;
};

const POSTER_WIDTH = 750;
const POSTER_HEIGHT = 1334;
const FONT_FAMILY = 'PingFang SC, Microsoft YaHei, sans-serif';

const COLORS = {
  green: '#2F7D5B',
  gold: '#D9A441',
  red: '#D96B5F',
  blue: '#4B8FA8',
  ink: '#372819',
  text: '#4F4134',
  muted: '#8D7E6C',
  line: 'rgba(217,164,65,0.32)',
  whiteGlass: 'rgba(255,255,255,0.78)',
};

const ELEMENT_COLORS: Record<BaziElement, string> = {
  木: '#2F7D5B',
  火: '#D96B5F',
  土: '#B9853A',
  金: '#D9A441',
  水: '#4B8FA8',
};

const STEM_ELEMENT: Record<string, BaziElement> = {
  甲: '木',
  乙: '木',
  丙: '火',
  丁: '火',
  戊: '土',
  己: '土',
  庚: '金',
  辛: '金',
  壬: '水',
  癸: '水',
};

const BRANCH_ELEMENT: Record<string, BaziElement> = {
  子: '水',
  丑: '土',
  寅: '木',
  卯: '木',
  辰: '土',
  巳: '火',
  午: '火',
  未: '土',
  申: '金',
  酉: '金',
  戌: '土',
  亥: '水',
};

function getWxRuntime() {
  return (globalThis as typeof globalThis & { wx?: WechatCanvasRuntime }).wx;
}

function assertWechatCanvasRuntime() {
  const wxRuntime = getWxRuntime();

  if (!wxRuntime?.createOffscreenCanvas || !wxRuntime.canvasToTempFilePath) {
    throw new Error('请在微信小程序环境中生成八字分享海报');
  }

  return wxRuntime;
}

function normalizeData(data: BaziSharePosterData) {
  const pillars = {
    year: normalizePillar(data.pillars?.year ?? '丙子', '年柱'),
    month: normalizePillar(data.pillars?.month ?? '丁酉', '月柱'),
    day: normalizePillar(data.pillars?.day ?? '乙卯', '日柱'),
    hour: normalizePillar(data.pillars?.hour ?? '辛巳', '时柱'),
  };
  const calendarText =
    data.calendarText ||
    [data.birthDate || '1996年10月21日', data.birthTime || '09:28'].filter(Boolean).join(' ');

  return {
    title: data.title || '我的八字命盘',
    subtitle: data.subtitle || '根据出生日期与出生地生成的专属命理画像',
    tagText: data.tagText || '八字分享',
    calendarText,
    birthPlace: data.birthPlace || '杭州',
    dayMaster: data.dayMaster || `${pillars.day.stem}木`,
    pillars,
    wuxingTrend: data.wuxingTrend || '木旺',
    favorableElements: data.favorableElements || '水木',
    analysis: (data.analysis?.length
      ? data.analysis
      : [
          '乙木日主，气质温和，内心有韧性',
          '木水相生，学习力与感受力较强',
          '火土偏弱，宜增强行动与执行节奏',
        ]
    ).slice(0, 3),
    fortunes: normalizeFortunes(data.fortunes),
    qrcode: data.qrcode,
    backgroundImage: data.backgroundImage,
    landscapeImage: data.landscapeImage,
    brandLabel: data.brandLabel || '八字运势',
    bottomSlogan: data.bottomSlogan || '知命而后，更懂自己',
  };
}

function normalizePillar(input: PillarInput, fallbackLabel: string): NormalizedPillar {
  const raw = typeof input === 'string' ? input : input.value || '';
  const stem = typeof input === 'string' ? raw[0] || '乙' : input.stem || raw[0] || '乙';
  const branch = typeof input === 'string' ? raw[1] || '卯' : input.branch || raw[1] || '卯';
  const explicitElement = typeof input === 'string' ? '' : input.element || '';

  return {
    label: typeof input === 'string' ? fallbackLabel : input.title || fallbackLabel,
    stem,
    branch,
    stemElement: resolveElement(explicitElement || stem, STEM_ELEMENT),
    branchElement: resolveElement(branch, BRANCH_ELEMENT),
  };
}

function resolveElement(value: string, map: Record<string, BaziElement>): BaziElement {
  if (value === '木' || value === '火' || value === '土' || value === '金' || value === '水') {
    return value;
  }

  return map[value] || '木';
}

function normalizeFortunes(input: BaziSharePosterData['fortunes']) {
  if (input?.items?.length) {
    return input.items.slice(0, 3).map((item) => ({
      label: item.label,
      value: item.value,
      color: item.color || COLORS.green,
    }));
  }

  return [
    { label: '综合运势', value: input?.overall ?? 82, color: COLORS.green },
    { label: '事业', value: input?.career ?? 84, color: COLORS.blue },
    { label: '感情', value: input?.love ?? 88, color: COLORS.red },
  ];
}

function setFont(
  ctx: CanvasRenderingContext2D,
  size: number,
  weight: '400' | '500' | '600' | '700' | '800' = '400',
) {
  ctx.font = `${weight} ${size}px ${FONT_FAMILY}`;
}

function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2);

  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function fillRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fillStyle: string | CanvasGradient,
) {
  drawRoundRect(ctx, x, y, width, height, radius);
  ctx.fillStyle = fillStyle;
  ctx.fill();
}

function strokeRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  strokeStyle: string,
  lineWidth = 1,
) {
  drawRoundRect(ctx, x, y, width, height, radius);
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

function withShadow(
  ctx: CanvasRenderingContext2D,
  color: string,
  blur: number,
  offsetY: number,
  draw: () => void,
) {
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
  ctx.shadowOffsetY = offsetY;
  draw();
  ctx.restore();
}

function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  options: {
    size: number;
    color?: string;
    weight?: '400' | '500' | '600' | '700' | '800';
    align?: CanvasTextAlign;
    baseline?: CanvasTextBaseline;
    maxWidth?: number;
  },
) {
  ctx.save();
  setFont(ctx, options.size, options.weight);
  ctx.fillStyle = options.color || COLORS.text;
  ctx.textAlign = options.align || 'left';
  ctx.textBaseline = options.baseline || 'alphabetic';
  if (options.maxWidth) {
    ctx.fillText(text, x, y, options.maxWidth);
  } else {
    ctx.fillText(text, x, y);
  }
  ctx.restore();
}

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  options: {
    size: number;
    lineHeight: number;
    color?: string;
    weight?: '400' | '500' | '600' | '700' | '800';
    maxLines?: number;
  },
) {
  const chars = Array.from(text);
  const lines: string[] = [];
  let current = '';

  setFont(ctx, options.size, options.weight);

  for (const char of chars) {
    const next = current + char;
    if (ctx.measureText(next).width > maxWidth && current) {
      lines.push(current);
      current = char;
      if (options.maxLines && lines.length >= options.maxLines) {
        break;
      }
    } else {
      current = next;
    }
  }

  if (current && (!options.maxLines || lines.length < options.maxLines)) {
    lines.push(current);
  }

  lines.slice(0, options.maxLines || lines.length).forEach((line, index) => {
    drawText(ctx, line, x, y + index * options.lineHeight, {
      size: options.size,
      color: options.color,
      weight: options.weight,
    });
  });
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
  const drawableSource = await resolveCanvasImageSource(wxRuntime, source);

  return new Promise<PosterCanvasImage>((resolve, reject) => {
    const image = canvas.createImage();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = drawableSource;
  });
}

async function loadOptionalImage(
  wxRuntime: WechatCanvasRuntime,
  canvas: PosterCanvas,
  source?: string,
) {
  if (!source) {
    return null;
  }

  try {
    return await loadCanvasImage(wxRuntime, canvas, source);
  } catch {
    return null;
  }
}

function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  image: PosterCanvasImage,
  x: number,
  y: number,
  width: number,
  height: number,
  alpha = 1,
) {
  const scale = Math.max(width / image.width, height / image.height);
  const sw = width / scale;
  const sh = height / scale;
  const sx = (image.width - sw) / 2;
  const sy = (image.height - sh) / 2;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.drawImage(image, sx, sy, sw, sh, x, y, width, height);
  ctx.restore();
}

function drawCircleImage(
  ctx: CanvasRenderingContext2D,
  image: PosterCanvasImage,
  cx: number,
  cy: number,
  radius: number,
) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.clip();
  drawCoverImage(ctx, image, cx - radius, cy - radius, radius * 2, radius * 2);
  ctx.restore();
}

function drawBackground(
  ctx: CanvasRenderingContext2D,
  backgroundImage: PosterCanvasImage | null,
) {
  const gradient = ctx.createLinearGradient(0, 0, POSTER_WIDTH, POSTER_HEIGHT);
  gradient.addColorStop(0, '#FBF1E2');
  gradient.addColorStop(0.48, '#EFF8EF');
  gradient.addColorStop(1, '#FBE1DD');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, POSTER_WIDTH, POSTER_HEIGHT);

  if (backgroundImage) {
    drawCoverImage(ctx, backgroundImage, 0, 0, POSTER_WIDTH, POSTER_HEIGHT, 0.18);
  }

  drawBaguaWatermark(ctx, 392, 128, 118, 0.14);
  drawConstellation(ctx);
  drawCloud(ctx, 586, 64, 1.1, 0.18);
  drawCloud(ctx, 36, 478, 0.9, 0.2);
  drawCloud(ctx, 622, 518, 0.9, 0.24);
  drawMountains(ctx);
  drawLotus(ctx, 96, 1068, 1.08);
  drawWaterRibbon(ctx);
}

function drawBaguaWatermark(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  alpha: number,
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, radius - 28, 0, Math.PI * 2);
  ctx.stroke();

  for (let index = 0; index < 8; index += 1) {
    const angle = (Math.PI * 2 * index) / 8 - Math.PI / 2;
    const x = cx + Math.cos(angle) * (radius - 14);
    const y = cy + Math.sin(angle) * (radius - 14);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle + Math.PI / 2);
    ctx.strokeStyle = COLORS.gold;
    ctx.lineWidth = 3;
    for (let row = 0; row < 3; row += 1) {
      ctx.beginPath();
      ctx.moveTo(-12, row * 8 - 8);
      ctx.lineTo(12, row * 8 - 8);
      ctx.stroke();
    }
    ctx.restore();
  }

  ctx.restore();
}

function drawConstellation(ctx: CanvasRenderingContext2D) {
  const points = [
    [38, 156],
    [82, 214],
    [58, 286],
    [112, 342],
    [88, 430],
  ];

  ctx.save();
  ctx.strokeStyle = 'rgba(217,164,65,0.42)';
  ctx.fillStyle = COLORS.gold;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  points.forEach(([x, y], index) => {
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.stroke();
  points.forEach(([x, y], index) => {
    ctx.beginPath();
    ctx.arc(x, y, index === 3 ? 4 : 3, 0, Math.PI * 2);
    ctx.fill();
  });
  drawSparkle(ctx, 34, 318, 15, COLORS.gold);
  drawSparkle(ctx, 106, 184, 8, COLORS.gold);
  ctx.restore();
}

function drawSparkle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  color: string,
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx, cy - size);
  ctx.lineTo(cx + size * 0.28, cy - size * 0.28);
  ctx.lineTo(cx + size, cy);
  ctx.lineTo(cx + size * 0.28, cy + size * 0.28);
  ctx.lineTo(cx, cy + size);
  ctx.lineTo(cx - size * 0.28, cy + size * 0.28);
  ctx.lineTo(cx - size, cy);
  ctx.lineTo(cx - size * 0.28, cy - size * 0.28);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawCloud(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  alpha: number,
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 2;
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.beginPath();
  ctx.moveTo(0, 26);
  ctx.bezierCurveTo(24, 4, 50, 8, 58, 28);
  ctx.bezierCurveTo(78, 20, 104, 30, 106, 50);
  ctx.bezierCurveTo(80, 48, 52, 52, 24, 48);
  ctx.bezierCurveTo(14, 48, 4, 40, 0, 26);
  ctx.stroke();
  ctx.restore();
}

function drawMountains(ctx: CanvasRenderingContext2D) {
  ctx.save();
  ctx.globalAlpha = 0.38;
  ctx.fillStyle = '#B8D0C6';
  ctx.beginPath();
  ctx.moveTo(0, 944);
  ctx.lineTo(74, 812);
  ctx.lineTo(140, 940);
  ctx.lineTo(224, 838);
  ctx.lineTo(306, 944);
  ctx.lineTo(0, 944);
  ctx.fill();

  ctx.fillStyle = '#9FBEB6';
  ctx.beginPath();
  ctx.moveTo(594, 746);
  ctx.lineTo(666, 612);
  ctx.lineTo(744, 746);
  ctx.lineTo(744, 940);
  ctx.lineTo(594, 940);
  ctx.fill();
  ctx.restore();
}

function drawLotus(ctx: CanvasRenderingContext2D, cx: number, cy: number, scale: number) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.globalAlpha = 0.86;

  const petal = (rotate: number, fill: string) => {
    ctx.save();
    ctx.rotate(rotate);
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(0, -78);
    ctx.bezierCurveTo(42, -44, 34, 12, 0, 44);
    ctx.bezierCurveTo(-34, 12, -42, -44, 0, -78);
    ctx.fill();
    ctx.restore();
  };

  for (let index = -2; index <= 2; index += 1) {
    petal(index * 0.42, index === 0 ? '#F5C5BD' : '#F8D8D2');
  }

  ctx.fillStyle = '#D9A441';
  ctx.beginPath();
  ctx.arc(0, 18, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawWaterRibbon(ctx: CanvasRenderingContext2D) {
  ctx.save();
  ctx.strokeStyle = 'rgba(47,125,91,0.28)';
  ctx.lineWidth = 28;
  ctx.beginPath();
  ctx.moveTo(-20, 1286);
  ctx.bezierCurveTo(160, 1230, 260, 1268, 380, 1284);
  ctx.bezierCurveTo(520, 1302, 650, 1252, 780, 1222);
  ctx.stroke();
  ctx.restore();
}

function drawTop(ctx: CanvasRenderingContext2D, data: ReturnType<typeof normalizeData>) {
  withShadow(ctx, 'rgba(137,95,42,0.16)', 12, 4, () => {
    fillRoundRect(ctx, 42, 32, 190, 54, 27, 'rgba(255,255,255,0.72)');
  });
  strokeRoundRect(ctx, 42, 32, 190, 54, 27, 'rgba(217,164,65,0.36)', 1.5);
  drawMiniBagua(ctx, 68, 59, 23);
  drawText(ctx, data.tagText, 100, 68, {
    size: 28,
    weight: '600',
    color: '#7A5525',
  });

  drawText(ctx, data.title, POSTER_WIDTH / 2, 172, {
    size: 60,
    weight: '800',
    color: '#805A22',
    align: 'center',
  });
  drawText(ctx, data.subtitle, POSTER_WIDTH / 2, 230, {
    size: 24,
    weight: '500',
    color: '#4F4134',
    align: 'center',
  });
  drawSparkle(ctx, 136, 234, 6, COLORS.gold);
  drawSparkle(ctx, 614, 234, 6, COLORS.gold);
}

function drawMiniBagua(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number) {
  ctx.save();
  ctx.fillStyle = '#FFF7EA';
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(217,164,65,0.46)';
  ctx.stroke();
  ctx.fillStyle = COLORS.ink;
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.48, Math.PI / 2, (Math.PI * 3) / 2);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.48, -Math.PI / 2, Math.PI / 2);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(cx, cy - radius * 0.24, radius * 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.ink;
  ctx.beginPath();
  ctx.arc(cx, cy + radius * 0.24, radius * 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawMainCard(
  ctx: CanvasRenderingContext2D,
  data: ReturnType<typeof normalizeData>,
  landscapeImage: PosterCanvasImage | null,
) {
  withShadow(ctx, 'rgba(137,95,42,0.16)', 24, 12, () => {
    fillRoundRect(ctx, 56, 302, 638, 760, 32, COLORS.whiteGlass);
  });
  strokeRoundRect(ctx, 56, 302, 638, 760, 32, 'rgba(217,164,65,0.28)', 1.4);

  drawBirthRows(ctx, data);
  drawLandscapeCircle(ctx, landscapeImage);
  drawFourPillars(ctx, data);
  drawCapsules(ctx, data);
  drawElementCycle(ctx);
  drawAnalysis(ctx, data.analysis);
  drawFortunes(ctx, data.fortunes);
}

function drawBirthRows(ctx: CanvasRenderingContext2D, data: ReturnType<typeof normalizeData>) {
  const rows = [
    { icon: 'calendar', label: `公历：${data.calendarText}`, color: COLORS.green },
    { icon: 'location', label: `出生地：${data.birthPlace}`, color: COLORS.red },
    { icon: 'leaf', label: `日主：${data.dayMaster}`, color: COLORS.green },
  ];

  rows.forEach((row, index) => {
    const cy = 370 + index * 72;
    drawInfoIcon(ctx, row.icon, 118, cy, row.color);
    drawText(ctx, row.label, 166, cy + 10, {
      size: 25,
      weight: '500',
      color: COLORS.ink,
      maxWidth: 300,
    });
  });
}

function drawInfoIcon(
  ctx: CanvasRenderingContext2D,
  type: string,
  cx: number,
  cy: number,
  color: string,
) {
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.78)';
  ctx.beginPath();
  ctx.arc(cx, cy, 25, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(217,164,65,0.24)';
  ctx.stroke();

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (type === 'calendar') {
    ctx.strokeRect(cx - 10, cy - 8, 20, 19);
    ctx.beginPath();
    ctx.moveTo(cx - 5, cy - 14);
    ctx.lineTo(cx - 5, cy - 6);
    ctx.moveTo(cx + 5, cy - 14);
    ctx.lineTo(cx + 5, cy - 6);
    ctx.moveTo(cx - 10, cy - 1);
    ctx.lineTo(cx + 10, cy - 1);
    ctx.stroke();
  } else if (type === 'location') {
    ctx.beginPath();
    ctx.moveTo(cx, cy + 14);
    ctx.bezierCurveTo(cx - 14, cy - 1, cx - 9, cy - 16, cx, cy - 16);
    ctx.bezierCurveTo(cx + 9, cy - 16, cx + 14, cy - 1, cx, cy + 14);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(cx, cy - 5, 4, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(cx - 10, cy + 10);
    ctx.bezierCurveTo(cx - 6, cy - 14, cx + 14, cy - 16, cx + 10, cy + 8);
    ctx.bezierCurveTo(cx + 2, cy + 14, cx - 4, cy + 14, cx - 10, cy + 10);
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(cx - 3, cy + 7);
    ctx.lineTo(cx + 8, cy - 8);
    ctx.stroke();
  }

  ctx.restore();
}

function drawLandscapeCircle(
  ctx: CanvasRenderingContext2D,
  landscapeImage: PosterCanvasImage | null,
) {
  const cx = 566;
  const cy = 406;
  const radius = 82;

  ctx.save();
  const gradient = ctx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius);
  gradient.addColorStop(0, '#FFF3DC');
  gradient.addColorStop(0.48, '#EAF4EC');
  gradient.addColorStop(1, '#DDECEF');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(217,164,65,0.52)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  if (landscapeImage) {
    drawCircleImage(ctx, landscapeImage, cx, cy, radius - 4);
  } else {
    drawCircleLandscape(ctx, cx, cy, radius);
  }

  drawCloud(ctx, 600, 466, 0.58, 0.42);
}

function drawCircleLandscape(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius - 4, 0, Math.PI * 2);
  ctx.clip();

  ctx.fillStyle = 'rgba(75,143,168,0.18)';
  ctx.fillRect(cx - radius, cy + 30, radius * 2, 40);
  ctx.fillStyle = 'rgba(47,125,91,0.26)';
  ctx.beginPath();
  ctx.moveTo(cx - 76, cy + 36);
  ctx.lineTo(cx - 22, cy - 18);
  ctx.lineTo(cx + 22, cy + 36);
  ctx.fill();
  ctx.fillStyle = 'rgba(75,143,168,0.22)';
  ctx.beginPath();
  ctx.moveTo(cx - 26, cy + 34);
  ctx.lineTo(cx + 28, cy - 8);
  ctx.lineTo(cx + 86, cy + 36);
  ctx.fill();
  ctx.strokeStyle = COLORS.green;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cx + 36, cy + 42);
  ctx.lineTo(cx + 36, cy - 30);
  ctx.moveTo(cx + 15, cy + 42);
  ctx.lineTo(cx + 58, cy + 42);
  ctx.moveTo(cx + 20, cy + 16);
  ctx.lineTo(cx + 52, cy + 16);
  ctx.moveTo(cx + 24, cy - 4);
  ctx.lineTo(cx + 48, cy - 4);
  ctx.stroke();
  ctx.restore();
}

function drawFourPillars(ctx: CanvasRenderingContext2D, data: ReturnType<typeof normalizeData>) {
  const x = 94;
  const y = 555;
  const width = 562;
  const height = 182;
  const pillars = [data.pillars.year, data.pillars.month, data.pillars.day, data.pillars.hour];

  fillRoundRect(ctx, x, y, width, height, 20, 'rgba(255,255,255,0.72)');
  strokeRoundRect(ctx, x, y, width, height, 20, 'rgba(217,164,65,0.34)', 1.2);

  pillars.forEach((pillar, index) => {
    const columnWidth = width / 4;
    const centerX = x + columnWidth * index + columnWidth / 2;

    if (index > 0) {
      ctx.save();
      ctx.strokeStyle = 'rgba(217,164,65,0.2)';
      ctx.beginPath();
      ctx.moveTo(x + columnWidth * index, y + 22);
      ctx.lineTo(x + columnWidth * index, y + height - 22);
      ctx.stroke();
      ctx.restore();
    }

    drawText(ctx, pillar.label, centerX, y + 44, {
      size: 26,
      weight: '600',
      color: '#8A5E23',
      align: 'center',
    });
    ctx.save();
    ctx.strokeStyle = COLORS.line;
    ctx.beginPath();
    ctx.moveTo(centerX - 46, y + 60);
    ctx.lineTo(centerX + 46, y + 60);
    ctx.stroke();
    ctx.restore();
    drawText(ctx, pillar.stem, centerX, y + 116, {
      size: 50,
      weight: '700',
      color: ELEMENT_COLORS[pillar.stemElement],
      align: 'center',
    });
    drawText(ctx, pillar.branch, centerX, y + 166, {
      size: 50,
      weight: '700',
      color: ELEMENT_COLORS[pillar.branchElement],
      align: 'center',
    });
  });
}

function drawCapsules(ctx: CanvasRenderingContext2D, data: ReturnType<typeof normalizeData>) {
  drawCapsule(ctx, 116, 762, 210, 50, COLORS.green, `五行偏向：${data.wuxingTrend}`, 'leaf');
  drawCapsule(ctx, 396, 762, 208, 50, COLORS.blue, `喜用：${data.favorableElements}`, 'water');
}

function drawCapsule(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
  text: string,
  icon: 'leaf' | 'water',
) {
  withShadow(ctx, 'rgba(137,95,42,0.1)', 8, 3, () => {
    fillRoundRect(ctx, x, y, width, height, height / 2, 'rgba(255,255,255,0.72)');
  });
  strokeRoundRect(ctx, x, y, width, height, height / 2, 'rgba(217,164,65,0.22)', 1);
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x + 30, y + height / 2, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  if (icon === 'water') {
    ctx.beginPath();
    ctx.moveTo(x + 30, y + 15);
    ctx.bezierCurveTo(x + 46, y + 34, x + 38, y + 44, x + 30, y + 44);
    ctx.bezierCurveTo(x + 20, y + 44, x + 15, y + 34, x + 30, y + 15);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(x + 20, y + 34);
    ctx.bezierCurveTo(x + 26, y + 16, x + 43, y + 18, x + 39, y + 38);
    ctx.bezierCurveTo(x + 31, y + 42, x + 25, y + 40, x + 20, y + 34);
    ctx.fill();
  }
  ctx.restore();
  drawText(ctx, text, x + 58, y + 34, {
    size: 24,
    weight: '600',
    color: COLORS.text,
  });
}

function drawElementCycle(ctx: CanvasRenderingContext2D) {
  const cx = 188;
  const cy = 902;
  const radius = 78;
  const elements: BaziElement[] = ['木', '火', '土', '金', '水'];
  const positions = elements.map((element, index) => {
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / elements.length;
    return {
      element,
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
    };
  });

  fillRoundRect(ctx, 80, 814, 218, 218, 109, 'rgba(255,255,255,0.55)');
  ctx.save();
  ctx.strokeStyle = 'rgba(217,164,65,0.36)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();
  positions.forEach((point, index) => {
    const next = positions[(index + 1) % positions.length];
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
    ctx.lineTo(next.x, next.y);
    ctx.stroke();
  });
  ctx.restore();

  positions.forEach((point) => {
    ctx.save();
    ctx.fillStyle = ELEMENT_COLORS[point.element];
    ctx.beginPath();
    ctx.arc(point.x, point.y, 20, 0, Math.PI * 2);
    ctx.fill();
    drawText(ctx, point.element, point.x, point.y + 8, {
      size: 22,
      weight: '700',
      color: '#FFFFFF',
      align: 'center',
    });
    ctx.restore();
  });

  ctx.save();
  ctx.fillStyle = 'rgba(47,125,91,0.12)';
  ctx.beginPath();
  ctx.arc(cx, cy, 46, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(217,164,65,0.34)';
  ctx.stroke();
  ctx.fillStyle = COLORS.green;
  ctx.fillRect(cx - 4, cy - 2, 8, 32);
  ctx.beginPath();
  ctx.arc(cx - 14, cy - 8, 18, 0, Math.PI * 2);
  ctx.arc(cx + 14, cy - 8, 18, 0, Math.PI * 2);
  ctx.arc(cx, cy - 28, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawAnalysis(ctx: CanvasRenderingContext2D, analysis: string[]) {
  analysis.forEach((item, index) => {
    const y = 840 + index * 54;
    const color = [COLORS.green, COLORS.blue, COLORS.red][index] || COLORS.green;
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.58)';
    ctx.beginPath();
    ctx.arc(336, y - 8, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(336, y - 8, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    drawWrappedText(ctx, item, 364, y, 270, {
      size: 22,
      lineHeight: 28,
      color: COLORS.text,
      weight: '500',
      maxLines: 2,
    });
  });
}

function drawFortunes(
  ctx: CanvasRenderingContext2D,
  fortunes: ReturnType<typeof normalizeFortunes>,
) {
  fillRoundRect(ctx, 314, 992, 324, 58, 18, 'rgba(255,255,255,0.72)');
  strokeRoundRect(ctx, 314, 992, 324, 58, 18, 'rgba(217,164,65,0.24)', 1);

  fortunes.forEach((item, index) => {
    const x = 338 + index * 102;
    if (index > 0) {
      ctx.save();
      ctx.strokeStyle = 'rgba(217,164,65,0.24)';
      ctx.beginPath();
      ctx.moveTo(x - 16, 1006);
      ctx.lineTo(x - 16, 1036);
      ctx.stroke();
      ctx.restore();
    }
    drawText(ctx, item.label, x, 1014, {
      size: 16,
      color: COLORS.muted,
      align: 'center',
    });
    drawText(ctx, String(item.value), x, 1040, {
      size: 27,
      weight: '700',
      color: item.color,
      align: 'center',
    });
  });
}

function drawBottomCta(
  ctx: CanvasRenderingContext2D,
  data: ReturnType<typeof normalizeData>,
  qrcodeImage: PosterCanvasImage,
) {
  drawText(ctx, '长按识别小程序码', 258, 1130, {
    size: 25,
    weight: '500',
    color: COLORS.text,
    align: 'center',
  });
  drawText(ctx, '查看完整八字报告', 258, 1170, {
    size: 27,
    weight: '700',
    color: COLORS.green,
    align: 'center',
  });
  withShadow(ctx, 'rgba(137,95,42,0.12)', 12, 5, () => {
    fillRoundRect(ctx, 170, 1200, 176, 50, 25, 'rgba(255,255,255,0.76)');
  });
  strokeRoundRect(ctx, 170, 1200, 176, 50, 25, 'rgba(217,164,65,0.32)', 1);
  drawText(ctx, data.brandLabel, 258, 1233, {
    size: 25,
    weight: '600',
    color: COLORS.text,
    align: 'center',
  });

  withShadow(ctx, 'rgba(47,125,91,0.2)', 18, 8, () => {
    fillRoundRect(ctx, 516, 1088, 190, 190, 30, '#FFFFFF');
  });
  strokeRoundRect(ctx, 516, 1088, 190, 190, 30, 'rgba(217,164,65,0.46)', 2);
  ctx.save();
  drawRoundRect(ctx, 526, 1098, 170, 170, 22);
  ctx.clip();
  ctx.drawImage(qrcodeImage, 526, 1098, 170, 170);
  ctx.restore();

  drawText(ctx, data.bottomSlogan, POSTER_WIDTH / 2, 1302, {
    size: 28,
    weight: '500',
    color: '#8A5E23',
    align: 'center',
  });
  drawSparkle(ctx, 256, 1294, 6, COLORS.gold);
  drawSparkle(ctx, 492, 1294, 6, COLORS.gold);
}

function canvasToTempFilePath(wxRuntime: WechatCanvasRuntime, canvas: PosterCanvas) {
  return new Promise<string>((resolve, reject) => {
    wxRuntime.canvasToTempFilePath?.({
      canvas,
      x: 0,
      y: 0,
      width: POSTER_WIDTH,
      height: POSTER_HEIGHT,
      destWidth: POSTER_WIDTH,
      destHeight: POSTER_HEIGHT,
      fileType: 'png',
      quality: 1,
      success: (result) => resolve(result.tempFilePath),
      fail: reject,
    });
  });
}

export async function generateBaziSharePoster(data: BaziSharePosterData) {
  if (!data.qrcode) {
    throw new Error('缺少小程序码图片路径');
  }

  const wxRuntime = assertWechatCanvasRuntime();
  const canvas = wxRuntime.createOffscreenCanvas?.({
    type: '2d',
    width: POSTER_WIDTH,
    height: POSTER_HEIGHT,
  });
  const ctx = canvas?.getContext('2d');

  if (!canvas || !ctx) {
    throw new Error('当前环境无法创建海报画布');
  }

  const normalized = normalizeData(data);
  const [qrcodeImage, backgroundImage, landscapeImage] = await Promise.all([
    loadCanvasImage(wxRuntime, canvas, normalized.qrcode),
    loadOptionalImage(wxRuntime, canvas, normalized.backgroundImage),
    loadOptionalImage(wxRuntime, canvas, normalized.landscapeImage),
  ]);

  drawBackground(ctx, backgroundImage);
  drawTop(ctx, normalized);
  drawMainCard(ctx, normalized, landscapeImage);
  drawBottomCta(ctx, normalized, qrcodeImage);

  return canvasToTempFilePath(wxRuntime, canvas);
}

export const BAZI_SHARE_POSTER_SIZE = {
  width: POSTER_WIDTH,
  height: POSTER_HEIGHT,
};
