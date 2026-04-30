import { Injectable } from '@nestjs/common';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const POSTER_FONT_FAMILY =
  'WenQuanYi Zen Hei, Noto Sans CJK SC, Noto Sans SC, PingFang SC, Microsoft YaHei, DejaVu Sans, Arial, sans-serif';
const ZODIAC_POSTER_FONT_FAMILY =
  'PingFang SC, Noto Sans SC, Noto Sans CJK SC, Microsoft YaHei, Hiragino Sans GB, Source Han Sans SC, DejaVu Sans, Arial, sans-serif';
const ZODIAC_TEMPLATE_SANS_FONT_FAMILY =
  "'PingFang SC', 'Noto Sans CJK SC', 'Microsoft YaHei', 'WenQuanYi Zen Hei', sans-serif";
const ZODIAC_TEMPLATE_SERIF_FONT_FAMILY =
  "'Songti SC', 'STSong', 'Noto Serif CJK SC', 'Noto Serif SC', 'SimSun', serif";

const ZODIAC_POSTER_VISUALS: Record<
  string,
  {
    glyph: string;
    english: string;
  }
> = {
  白羊座: { glyph: '♈', english: 'Aries' },
  金牛座: { glyph: '♉', english: 'Taurus' },
  双子座: { glyph: '♊', english: 'Gemini' },
  巨蟹座: { glyph: '♋', english: 'Cancer' },
  狮子座: { glyph: '♌', english: 'Leo' },
  处女座: { glyph: '♍', english: 'Virgo' },
  天秤座: { glyph: '♎', english: 'Libra' },
  天蝎座: { glyph: '♏', english: 'Scorpio' },
  射手座: { glyph: '♐', english: 'Sagittarius' },
  摩羯座: { glyph: '♑', english: 'Capricorn' },
  水瓶座: { glyph: '♒', english: 'Aquarius' },
  双鱼座: { glyph: '♓', english: 'Pisces' },
};

export type PosterMetric = {
  label: string;
  value: string;
  hint?: string;
};

export type BaziPosterPillar = {
  label: string;
  stem: string;
  branch: string;
};

export type BaziPosterFortune = {
  label: string;
  value: string | number;
  color?: string;
};

export type BaziPosterDetails = {
  tagText: string;
  calendarText: string;
  birthPlace: string;
  dayMaster: string;
  pillars: BaziPosterPillar[];
  wuxingTrend: string;
  favorableElements: string;
  analysis: string[];
  fortunes: BaziPosterFortune[];
  brandLabel: string;
  bottomSlogan: string;
};

export type ZodiacPosterDetails = {
  tagText: string;
  subtitle: string;
  signName: string;
  englishName: string;
  glyph: string;
  keywords: string[];
  temperament: string;
  energyTendency: string;
  guardianElement: string;
  birthday: string;
  birthPlace: string;
  elementLabel: string;
  charmScore: number;
  socialScore: number;
  luckyColor: string;
  quote: string;
};

export type PosterRenderSource = {
  sourceType: string;
  title: string;
  subtitle: string;
  accentText: string;
  footerText: string;
  summary: string;
  themeName: string;
  eyebrowText: string;
  chips: string[];
  metrics: PosterMetric[];
  highlightTitle?: string;
  highlightLines: string[];
  zodiacName?: string;
  zodiacGlyph?: string;
  zodiacEnglish?: string;
  energyValue?: string;
  zodiacPoster?: ZodiacPosterDetails;
  baziPoster?: BaziPosterDetails;
  miniProgramCodeDataUrl?: string | null;
};

export type PosterLayout = {
  size: '1280x1280' | '1080x1440' | '1088x1472' | '941x1672';
  width: number;
  height: number;
  kind: 'square' | 'portrait';
};

export type WallpaperLayout = {
  aspectRatio: '9:16' | '16:9' | '1:1';
  width: number;
  height: number;
};

export type RenderedPosterImage = {
  imageBuffer: Buffer;
  imageDataUrl: string;
  usedProviderBackground: boolean;
};

export type WallpaperRenderInput = {
  layout: WallpaperLayout;
  title: string;
  subtitle: string;
  guidance: string;
  chips: string[];
  palette: string[];
  themeName?: string;
  backgroundDataUrl?: string | null;
};

@Injectable()
export class PosterRendererService {
  private readonly zodiacTemplateCache = new Map<string, Buffer>();

  resolvePosterLayout(
    requestedSize: PosterLayout['size'] | undefined,
    sourceType: string,
  ): PosterLayout {
    const prefersPortrait =
      sourceType === 'today_index' ||
      sourceType === 'zodiac_today' ||
      sourceType === 'bazi';
    const size =
      requestedSize ??
      (sourceType === 'bazi' || sourceType === 'zodiac_today'
        ? '941x1672'
        : prefersPortrait
          ? '1088x1472'
          : '1280x1280');

    if (size === '1080x1440') {
      return {
        size: '1080x1440',
        width: 1080,
        height: 1440,
        kind: 'portrait',
      };
    }

    if (size === '1088x1472') {
      return {
        size: '1088x1472',
        width: 1088,
        height: 1472,
        kind: 'portrait',
      };
    }

    if (size === '941x1672') {
      return {
        size: '941x1672',
        width: 941,
        height: 1672,
        kind: 'portrait',
      };
    }

    return {
      size: '1280x1280',
      width: 1280,
      height: 1280,
      kind: 'square',
    };
  }

  resolveWallpaperLayout(aspectRatio?: string): WallpaperLayout {
    if (aspectRatio === '16:9') {
      return {
        aspectRatio: '16:9',
        width: 1472,
        height: 1088,
      };
    }

    if (aspectRatio === '1:1') {
      return {
        aspectRatio: '1:1',
        width: 1280,
        height: 1280,
      };
    }

    return {
      aspectRatio: '9:16',
      width: 1088,
      height: 1472,
    };
  }

  async renderPoster(
    source: PosterRenderSource,
    backgroundDataUrl: string | null,
    layout: PosterLayout,
  ): Promise<RenderedPosterImage> {
    if (layout.kind === 'portrait' && source.sourceType === 'zodiac_today') {
      return this.renderZodiacTemplatePoster(source, layout);
    }

    const build = (background: string | null) =>
      layout.kind === 'portrait' && source.sourceType === 'bazi'
          ? this.buildBaziPosterSvg(source, layout)
          : layout.kind === 'portrait'
            ? this.buildRichPosterSvg(source, background, layout)
            : this.buildSharePosterSvg(source, background);

    const templateMarkup = build(backgroundDataUrl);

    const imageBuffer = await this.renderPng(templateMarkup);
    return {
      imageBuffer,
      imageDataUrl: this.toPngDataUrl(imageBuffer),
      usedProviderBackground: Boolean(backgroundDataUrl),
    };
  }

  async renderWallpaper(
    input: WallpaperRenderInput,
  ): Promise<RenderedPosterImage> {
    const build = (background: string | null) =>
      this.buildWallpaperSvg({
        ...input,
        backgroundDataUrl: background,
      });
    const templateMarkup = build(input.backgroundDataUrl ?? null);

    const imageBuffer = await this.renderPng(templateMarkup);
    return {
      imageBuffer,
      imageDataUrl: this.toPngDataUrl(imageBuffer),
      usedProviderBackground: Boolean(input.backgroundDataUrl),
    };
  }

  private async renderZodiacTemplatePoster(
    source: PosterRenderSource,
    layout: PosterLayout,
  ): Promise<RenderedPosterImage> {
    const details = this.resolveZodiacArchiveDetails(source);
    const templateBuffer = await this.readZodiacPosterTemplate(
      details.signName,
    );

    if (!templateBuffer) {
      throw new Error(`星座分享模板缺失：${details.signName}`);
    }

    const overlay = this.buildZodiacTemplateOverlay(source, details, layout);
    const imageBuffer = await sharp(templateBuffer)
      .resize(layout.width, layout.height, { fit: 'fill' })
      .composite([{ input: Buffer.from(overlay), top: 0, left: 0 }])
      .png({ compressionLevel: 9 })
      .toBuffer();

    return {
      imageBuffer,
      imageDataUrl: this.toPngDataUrl(imageBuffer),
      usedProviderBackground: false,
    };
  }

  private async readZodiacPosterTemplate(signName: string) {
    const normalizedSign = this.normalizeZodiacSignName(signName);
    const cached = this.zodiacTemplateCache.get(normalizedSign);

    if (cached) {
      return cached;
    }

    const fileName = `${normalizedSign}.png`;
    const candidates = [
      path.join(__dirname, '..', 'assets', 'posters', 'zodiac', fileName),
      path.join(
        process.cwd(),
        'dist',
        'assets',
        'posters',
        'zodiac',
        fileName,
      ),
      path.join(
        process.cwd(),
        'src',
        'assets',
        'posters',
        'zodiac',
        fileName,
      ),
      path.join(
        process.cwd(),
        'services',
        'api',
        'dist',
        'assets',
        'posters',
        'zodiac',
        fileName,
      ),
      path.join(
        process.cwd(),
        'services',
        'api',
        'src',
        'assets',
        'posters',
        'zodiac',
        fileName,
      ),
    ];
    const templatePath = candidates.find((candidate) => existsSync(candidate));

    if (!templatePath) {
      return null;
    }

    const buffer = await readFile(templatePath);
    this.zodiacTemplateCache.set(normalizedSign, buffer);

    return buffer;
  }

  private buildZodiacTemplateOverlay(
    source: PosterRenderSource,
    details: ZodiacPosterDetails,
    layout: PosterLayout,
  ) {
    const scaleX = layout.width / 941;
    const scaleY = layout.height / 1672;
    const keywords = details.keywords.join(' · ');
    const signFontSize = this.fitPosterFontSize(
      details.signName,
      88,
      62,
      360,
    );
    const englishFontSize = this.fitPosterFontSize(
      details.englishName,
      46,
      32,
      260,
    );
    const keywordFontSize = this.fitPosterFontSize(keywords, 25, 19, 260);
    const temperamentFontSize = this.fitPosterFontSize(
      details.temperament,
      32,
      24,
      132,
    );
    const energyFontSize = this.fitPosterFontSize(
      details.energyTendency,
      32,
      24,
      132,
    );
    const guardianFontSize = this.fitPosterFontSize(
      details.guardianElement,
      32,
      24,
      108,
    );
    const luckyColorFontSize = this.fitPosterFontSize(
      details.luckyColor,
      40,
      28,
      112,
    );
    const quoteLines = this.splitTextByDisplayUnits(details.quote, 17.5, 2);

    return `
<svg xmlns="http://www.w3.org/2000/svg" width="${layout.width}" height="${layout.height}" viewBox="0 0 ${layout.width} ${layout.height}">
  <defs>
    <filter id="zodiac-template-text-soft" x="-10%" y="-10%" width="120%" height="130%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#FFFFFF" flood-opacity="0.72" />
    </filter>
  </defs>
  <g transform="scale(${scaleX} ${scaleY})" filter="url(#zodiac-template-text-soft)">
    ${this.renderZodiacTemplateText({
      x: 248,
      y: 474,
      value: details.signName,
      size: signFontSize,
      weight: 560,
      family: ZODIAC_TEMPLATE_SERIF_FONT_FAMILY,
      anchor: 'middle',
      width: 360,
    })}
    ${this.renderZodiacTemplateText({
      x: 248,
      y: 548,
      value: details.englishName,
      size: englishFontSize,
      weight: 400,
      family: ZODIAC_TEMPLATE_SERIF_FONT_FAMILY,
      anchor: 'middle',
      width: 260,
      color: '#C59B63',
      style: 'font-style="italic"',
    })}
    ${this.renderZodiacTemplateText({
      x: 248,
      y: 612,
      value: keywords,
      size: keywordFontSize,
      weight: 390,
      anchor: 'middle',
      width: 260,
    })}
    ${this.renderZodiacTemplateText({
      x: 150,
      y: 916,
      value: details.temperament,
      size: temperamentFontSize,
      weight: 400,
      width: 132,
    })}
    ${this.renderZodiacTemplateText({
      x: 453,
      y: 916,
      value: details.energyTendency,
      size: energyFontSize,
      weight: 400,
      width: 132,
    })}
    ${this.renderZodiacTemplateText({
      x: 756,
      y: 916,
      value: details.guardianElement,
      size: guardianFontSize,
      weight: 400,
      width: 108,
    })}
    ${this.renderZodiacTemplateText({
      x: 174,
      y: 1128,
      value: String(details.charmScore),
      size: 56,
      weight: 430,
      color: '#24227D',
    })}
    ${this.renderZodiacTemplateText({
      x: 475,
      y: 1128,
      value: String(details.socialScore),
      size: 56,
      weight: 430,
      color: '#24227D',
    })}
    ${this.renderZodiacTemplateText({
      x: 746,
      y: 1126,
      value: details.luckyColor,
      size: luckyColorFontSize,
      weight: 460,
      width: 112,
      color: '#24227D',
    })}
    ${quoteLines
      .map((line, index) =>
        this.renderZodiacTemplateText({
          x: 471,
          y: 1288 + index * 62,
          value: line,
          size: 36,
          weight: 430,
          family: ZODIAC_TEMPLATE_SERIF_FONT_FAMILY,
          anchor: 'middle',
          width: 620,
        }),
      )
      .join('')}
  </g>
  <g transform="scale(${scaleX} ${scaleY})">
    ${this.renderZodiacTemplateMiniProgramCode(
      source.miniProgramCodeDataUrl ?? null,
      270,
      1556,
    )}
    ${this.renderZodiacTemplateText({
      x: 404,
      y: 1518,
      value: '长按识别小程序码，',
      size: 31,
      weight: 430,
    })}
    ${this.renderZodiacTemplateText({
      x: 404,
      y: 1574,
      value: '查看你的专属星运报告',
      size: 34,
      weight: 560,
    })}
  </g>
</svg>`.trim();
  }

  private renderZodiacTemplateText(options: {
    x: number;
    y: number;
    value: string | number;
    size: number;
    weight?: number;
    family?: string;
    anchor?: 'start' | 'middle' | 'end';
    width?: number;
    color?: string;
    opacity?: number;
    style?: string;
  }) {
    const value = String(options.value);
    const widthAttributes = options.width
      ? this.buildSvgTextFitAttributes(value, options.size, options.width)
      : '';

    return `<text x="${options.x}" y="${options.y}" text-anchor="${options.anchor ?? 'start'}" font-family="${options.family ?? ZODIAC_TEMPLATE_SANS_FONT_FAMILY}" font-size="${options.size}" font-weight="${options.weight ?? 400}" fill="${options.color ?? '#14245A'}" opacity="${options.opacity ?? 1}" ${options.style ?? ''}${widthAttributes}>${this.escapeXml(value)}</text>`;
  }

  private renderZodiacTemplateMiniProgramCode(
    codeDataUrl: string | null,
    cx: number,
    cy: number,
  ) {
    if (codeDataUrl) {
      const imageSize = 156;
      const imageX = cx - imageSize / 2;
      const imageY = cy - imageSize / 2;

      return `
  <circle cx="${cx}" cy="${cy}" r="86" fill="#FFFFFF" fill-opacity="0.9" />
  <circle cx="${cx}" cy="${cy}" r="66" fill="#F7F9FF" stroke="#E5EBFA" stroke-width="2" />
  <image href="${this.escapeXml(codeDataUrl)}" x="${imageX}" y="${imageY}" width="${imageSize}" height="${imageSize}" preserveAspectRatio="xMidYMid meet" />`.trim();
    }

    return this.renderZodiacTemplateMiniProgramCodePlaceholder(cx, cy);
  }

  private renderZodiacTemplateMiniProgramCodePlaceholder(
    cx: number,
    cy: number,
  ) {
    const scale = 1.12;
    const modules = [
      [-49, -49, 18],
      [-24, -49, 10],
      [18, -49, 19],
      [-49, -21, 10],
      [-30, -16, 18],
      [12, -20, 12],
      [38, -18, 10],
      [-44, 14, 18],
      [-14, 16, 10],
      [18, 12, 20],
      [-32, 44, 12],
      [4, 44, 16],
      [37, 41, 10],
    ];

    return `
  <circle cx="${cx}" cy="${cy}" r="86" fill="#FFFFFF" fill-opacity="0.9" />
  <circle cx="${cx}" cy="${cy}" r="66" fill="#F7F9FF" stroke="#E5EBFA" stroke-width="2" />
  ${modules
    .map(
      ([offsetX, offsetY, size]) =>
        `<rect x="${cx + offsetX * scale}" y="${cy + offsetY * scale}" width="${size * scale}" height="${size * scale}" rx="3" fill="#2F3A4A" fill-opacity="0.84" />`,
    )
    .join('')}
  <circle cx="${cx}" cy="${cy}" r="24" fill="#605DD5" />
  <path d="M${cx - 14} ${cy + 6} C${cx - 3} ${cy - 13}, ${cx + 15} ${cy - 9}, ${cx + 9} ${cy + 9} C${cx + 3} ${cy + 26}, ${cx - 15} ${cy + 23}, ${cx - 14} ${cy + 6} Z" fill="#FFFFFF" fill-opacity="0.9" />
  <circle cx="${cx + 61}" cy="${cy + 59}" r="18" fill="#20C866" />
  <path d="M${cx + 55} ${cy + 57} C${cx + 55} ${cy + 49}, ${cx + 67} ${cy + 49}, ${cx + 67} ${cy + 57} V${cy + 70}" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" />`.trim();
  }

  resolveThemePalette(themeName: string) {
    if (themeName.includes('amber') || themeName.includes('gold')) {
      return ['#e8b15b', '#f6d8a2', '#8b5f2a'];
    }

    if (themeName.includes('sunset') || themeName.includes('ember')) {
      return ['#ff8c6a', '#ffe1c8', '#8c4258'];
    }

    if (themeName.includes('sand') || themeName.includes('earth')) {
      return ['#c8a980', '#f4e3cc', '#7a5c44'];
    }

    if (themeName.includes('silver') || themeName.includes('metal')) {
      return ['#bfd1e8', '#eef5ff', '#5b6b85'];
    }

    if (themeName.includes('ocean') || themeName.includes('water')) {
      return ['#7bb9e8', '#dff2ff', '#2b5e8d'];
    }

    if (themeName.includes('mint')) {
      return ['#8fd5bf', '#d6f5ee', '#4e8f7c'];
    }

    return ['#7aa8ff', '#dfe9ff', '#435c98'];
  }

  private buildSharePosterSvg(
    source: PosterRenderSource,
    backgroundDataUrl: string | null,
  ) {
    const [colorA, colorB, colorC] = this.resolveThemePalette(source.themeName);
    const titleLines = this.renderTextTspans(source.title, 12, 0, 74, 640);
    const subtitleLines = this.renderTextTspans(
      source.subtitle,
      22,
      0,
      44,
      520,
    );
    const accentLines = this.renderTextTspans(
      source.accentText,
      26,
      0,
      38,
      460,
    );
    const footerLines = this.renderTextTspans(
      source.footerText,
      32,
      0,
      34,
      540,
    );
    const backgroundLayer = backgroundDataUrl
      ? `<image href="${backgroundDataUrl}" x="0" y="0" width="1280" height="1280" preserveAspectRatio="xMidYMid slice" />`
      : this.buildAbstractBackground(1280, 1280, colorA, colorB, colorC);

    return `
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="1280" viewBox="0 0 1280 1280">
  <defs>
    <linearGradient id="overlay" x1="0%" x2="100%" y1="0%" y2="100%">
      <stop offset="0%" stop-color="${colorA}" stop-opacity="0.76" />
      <stop offset="55%" stop-color="${colorB}" stop-opacity="0.38" />
      <stop offset="100%" stop-color="${colorC}" stop-opacity="0.68" />
    </linearGradient>
  </defs>
  ${backgroundLayer}
  <rect x="0" y="0" width="1280" height="1280" fill="url(#overlay)" />
  <path d="M136 250 C 290 146, 458 154, 626 246 S 960 382, 1134 250" fill="none" stroke="#ffffff" stroke-opacity="0.2" stroke-width="5" />
  <rect x="92" y="92" width="1096" height="1096" rx="52" ry="52" fill="#06111d" fill-opacity="0.18" stroke="#ffffff" stroke-opacity="0.36" />
  <rect x="124" y="124" width="1032" height="1032" rx="42" ry="42" fill="#ffffff" fill-opacity="0.16" />
  <text x="152" y="200" font-size="30" letter-spacing="7" fill="#eff5fb" font-family="${POSTER_FONT_FAMILY}">${this.escapeXml(
    source.eyebrowText,
  )}</text>
  <text x="152" y="360" font-size="84" font-weight="700" fill="#ffffff" font-family="${POSTER_FONT_FAMILY}">${titleLines}</text>
  <text x="152" y="560" font-size="34" fill="#ffffff" fill-opacity="0.94" font-family="${POSTER_FONT_FAMILY}">${subtitleLines}</text>
  <rect x="152" y="658" width="976" height="186" rx="34" ry="34" fill="#ffffff" fill-opacity="0.23" stroke="#ffffff" stroke-opacity="0.22" />
  <text x="188" y="724" font-size="30" fill="#fefefe" font-family="${POSTER_FONT_FAMILY}">${accentLines}</text>
  <rect x="152" y="928" width="976" height="148" rx="30" ry="30" fill="#08111a" fill-opacity="0.22" />
  <text x="188" y="992" font-size="24" fill="#f7fbff" font-family="${POSTER_FONT_FAMILY}">${footerLines}</text>
  <text x="152" y="1136" font-size="24" fill="#ffffff" fill-opacity="0.88" font-family="${POSTER_FONT_FAMILY}">Generated by Fortune Hub</text>
</svg>`.trim();
  }

  private buildRichPosterSvg(
    source: PosterRenderSource,
    backgroundDataUrl: string | null,
    layout: PosterLayout,
  ) {
    const [colorA, colorB, colorC] = this.resolveThemePalette(source.themeName);
    const titleLines = this.renderTextTspans(source.title, 10, 0, 78, 88);
    const subtitleLines = this.renderTextTspans(source.subtitle, 18, 0, 42, 88);
    const accentLines = this.renderTextTspans(
      source.accentText,
      16,
      0,
      38,
      118,
    );
    const summaryLines = this.renderTextTspans(source.summary, 17, 0, 36, 120);
    const footerLines = this.renderTextTspans(
      source.footerText,
      22,
      0,
      32,
      148,
    );
    const highlightTitle = this.escapeXml(source.highlightTitle ?? '今日提示');
    const metricBlocks = this.renderMetricBlocks(
      source.metrics,
      120,
      620,
      848,
      184,
    );
    const chipBlocks = this.renderChipBlocks(
      source.chips.slice(0, 5),
      120,
      530,
      848,
    );
    const highlightBlocks = this.renderHighlightBlocks(
      source.highlightLines,
      160,
      1210,
      768,
      44,
    );
    const backgroundLayer = backgroundDataUrl
      ? `<image href="${backgroundDataUrl}" x="0" y="0" width="${layout.width}" height="${layout.height}" preserveAspectRatio="xMidYMid slice" />`
      : this.buildAbstractBackground(
          layout.width,
          layout.height,
          colorA,
          colorB,
          colorC,
        );

    return `
<svg xmlns="http://www.w3.org/2000/svg" width="${layout.width}" height="${layout.height}" viewBox="0 0 ${layout.width} ${layout.height}">
  <defs>
    <linearGradient id="today-overlay" x1="0%" x2="100%" y1="0%" y2="100%">
      <stop offset="0%" stop-color="#07111d" stop-opacity="0.42" />
      <stop offset="48%" stop-color="${colorB}" stop-opacity="0.04" />
      <stop offset="100%" stop-color="#07111d" stop-opacity="0.54" />
    </linearGradient>
    <linearGradient id="today-card" x1="0%" x2="100%" y1="0%" y2="100%">
      <stop offset="0%" stop-color="#06111d" stop-opacity="0.34" />
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.13" />
    </linearGradient>
    <filter id="soft-text-shadow" x="-20%" y="-20%" width="140%" height="160%">
      <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#06111d" flood-opacity="0.32" />
    </filter>
  </defs>
  ${backgroundLayer}
  <rect x="0" y="0" width="${layout.width}" height="${layout.height}" fill="url(#today-overlay)" />
  <path d="M108 336 C 248 250, 418 234, 592 306 S 894 408, 996 338" fill="none" stroke="#ffffff" stroke-opacity="0.24" stroke-width="4" />
  <rect x="44" y="44" width="1000" height="1384" rx="58" ry="58" fill="none" stroke="#ffffff" stroke-opacity="0.24" />
  <text x="88" y="132" font-size="26" letter-spacing="6" fill="#f1f7ff" font-family="${POSTER_FONT_FAMILY}" filter="url(#soft-text-shadow)">${this.escapeXml(
    source.eyebrowText,
  )}</text>
  <text x="88" y="238" font-size="72" font-weight="760" fill="#ffffff" font-family="${POSTER_FONT_FAMILY}" filter="url(#soft-text-shadow)">${titleLines}</text>
  <text x="88" y="382" font-size="30" fill="#f8fbff" fill-opacity="0.96" font-family="${POSTER_FONT_FAMILY}" filter="url(#soft-text-shadow)">${subtitleLines}</text>
  <rect x="88" y="434" width="912" height="74" rx="28" ry="28" fill="#06111d" fill-opacity="0.2" stroke="#ffffff" stroke-opacity="0.14" />
  <text x="118" y="482" font-size="28" fill="#ffffff" fill-opacity="0.98" font-family="${POSTER_FONT_FAMILY}">${accentLines}</text>
  ${chipBlocks}
  ${metricBlocks}
  <rect x="120" y="862" width="848" height="204" rx="34" ry="34" fill="url(#today-card)" stroke="#ffffff" stroke-opacity="0.16" />
  <text x="120" y="924" font-size="26" letter-spacing="3" fill="#eaf4ff" font-family="${POSTER_FONT_FAMILY}">TODAY SUMMARY</text>
  <text x="120" y="984" font-size="32" fill="#ffffff" fill-opacity="0.98" font-family="${POSTER_FONT_FAMILY}">${summaryLines}</text>
  <rect x="120" y="1098" width="848" height="216" rx="34" ry="34" fill="#06111d" fill-opacity="0.2" stroke="#ffffff" stroke-opacity="0.16" />
  <text x="160" y="1160" font-size="28" fill="#fefefe" font-family="${POSTER_FONT_FAMILY}">${highlightTitle}</text>
  ${highlightBlocks}
  <rect x="120" y="1332" width="848" height="80" rx="26" ry="26" fill="#06111d" fill-opacity="0.24" />
  <text x="148" y="1384" font-size="24" fill="#f7fbff" fill-opacity="0.94" font-family="${POSTER_FONT_FAMILY}">${footerLines}</text>
</svg>`.trim();
  }

  private buildZodiacTodayPosterSvg(
    source: PosterRenderSource,
    layout: PosterLayout,
  ) {
    const details = this.resolveZodiacArchiveDetails(source);
    const scaleX = layout.width / 941;
    const scaleY = layout.height / 1672;
    const quoteLines = this.renderTextTspans(details.quote, 17, 0, 54, 471);

    return `
<svg xmlns="http://www.w3.org/2000/svg" width="${layout.width}" height="${layout.height}" viewBox="0 0 ${layout.width} ${layout.height}">
  <defs>
    <linearGradient id="zodiac-archive-bg" x1="0%" x2="100%" y1="0%" y2="100%">
      <stop offset="0%" stop-color="#D8E7FF" />
      <stop offset="48%" stop-color="#F4F7FF" />
      <stop offset="100%" stop-color="#CADBFF" />
    </linearGradient>
    <linearGradient id="zodiac-hero" x1="0%" x2="100%" y1="0%" y2="100%">
      <stop offset="0%" stop-color="#F8FBFF" stop-opacity="0.92" />
      <stop offset="48%" stop-color="#DCE8FF" stop-opacity="0.7" />
      <stop offset="100%" stop-color="#B7C8FF" stop-opacity="0.82" />
    </linearGradient>
    <linearGradient id="zodiac-card" x1="0%" x2="100%" y1="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.9" />
      <stop offset="100%" stop-color="#F5F8FF" stop-opacity="0.78" />
    </linearGradient>
    <linearGradient id="zodiac-orb" x1="15%" x2="85%" y1="8%" y2="90%">
      <stop offset="0%" stop-color="#FCF4D8" />
      <stop offset="45%" stop-color="#BFCBFF" />
      <stop offset="100%" stop-color="#5E6FDB" />
    </linearGradient>
    <linearGradient id="zodiac-icon" x1="8%" x2="92%" y1="8%" y2="92%">
      <stop offset="0%" stop-color="#D9CAFF" />
      <stop offset="58%" stop-color="#879BFF" />
      <stop offset="100%" stop-color="#4962C7" />
    </linearGradient>
    <linearGradient id="purple-core" x1="16%" x2="86%" y1="8%" y2="92%">
      <stop offset="0%" stop-color="#C4B8FF" />
      <stop offset="54%" stop-color="#787FE6" />
      <stop offset="100%" stop-color="#4A5BC8" />
    </linearGradient>
    <filter id="archive-shadow" x="-20%" y="-20%" width="140%" height="150%">
      <feDropShadow dx="0" dy="16" stdDeviation="18" flood-color="#5D7FB8" flood-opacity="0.16" />
    </filter>
    <filter id="card-shadow" x="-20%" y="-20%" width="140%" height="150%">
      <feDropShadow dx="0" dy="14" stdDeviation="16" flood-color="#607FC8" flood-opacity="0.16" />
    </filter>
    <filter id="archive-title-shadow" x="-10%" y="-10%" width="120%" height="130%">
      <feDropShadow dx="0" dy="6" stdDeviation="5" flood-color="#B6C7EE" flood-opacity="0.34" />
    </filter>
    <filter id="archive-symbol-glow" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="2.6" result="archive-symbol-blur" />
      <feColorMatrix in="archive-symbol-blur" type="matrix" values="1 0 0 0 0.55 0 1 0 0 0.60 0 0 1 0 0.95 0 0 0 0.26 0" />
      <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
    </filter>
  </defs>
  <g transform="scale(${scaleX} ${scaleY})">
    <rect width="941" height="1672" fill="url(#zodiac-archive-bg)" />
    ${this.renderZodiacArchiveTexture()}
    <rect x="318" y="58" width="55" height="55" rx="16" fill="url(#zodiac-icon)" filter="url(#archive-shadow)" />
    ${this.renderZodiacSymbolIcon(details.signName, 345, 87, 50, '#FFFFFF', 0.96)}
    <text x="398" y="103" font-size="43" font-weight="650" fill="#14245A" font-family="${ZODIAC_POSTER_FONT_FAMILY}" filter="url(#archive-title-shadow)">${this.escapeXml(
      details.tagText,
    )}</text>
    <path d="M232 151 H326" stroke="#C8A76F" stroke-width="1.5" stroke-opacity="0.42" />
    <path d="M615 151 H708" stroke="#C8A76F" stroke-width="1.5" stroke-opacity="0.42" />
    <path d="M342 143 L348 151 L342 159 L334 151 Z" fill="#394D94" fill-opacity="0.78" />
    <path d="M600 143 L606 151 L600 159 L592 151 Z" fill="#394D94" fill-opacity="0.78" />
    <text x="471" y="162" text-anchor="middle" font-size="25" font-weight="520" fill="#1D2D63" font-family="${ZODIAC_POSTER_FONT_FAMILY}">${this.escapeXml(
      details.subtitle,
    )}</text>
    ${this.renderZodiacArchiveHero(details)}
    ${this.renderZodiacArchiveInfoCards(details)}
    ${this.renderZodiacArchiveMetrics(details)}
    <rect x="46" y="1174" width="849" height="224" rx="28" fill="#FFFFFF" fill-opacity="0.76" stroke="#E7C78F" stroke-width="1.4" filter="url(#archive-shadow)" />
    <path d="M94 1224 C112 1200, 142 1202, 154 1228 C134 1220, 110 1234, 110 1260 C94 1250, 84 1238, 94 1224 Z" fill="#D4A766" fill-opacity="0.32" />
    <path d="M806 1240 L812 1228 L818 1240 L830 1246 L818 1252 L812 1264 L806 1252 L794 1246 Z" fill="#C8A76F" fill-opacity="0.72" />
    <text x="471" y="1264" text-anchor="middle" font-size="34" font-weight="520" fill="#14245A" font-family="${ZODIAC_POSTER_FONT_FAMILY}">${quoteLines}</text>
    <path d="M244 1368 H430 M512 1368 H698" stroke="#C8A76F" stroke-width="1.6" stroke-opacity="0.56" />
    <path d="M471 1348 L481 1368 L471 1388 L461 1368 Z" fill="#C8A76F" fill-opacity="0.62" />
    <rect x="158" y="1435" width="625" height="178" rx="34" fill="#FFFFFF" fill-opacity="0.58" stroke="#FFFFFF" stroke-width="2" filter="url(#archive-shadow)" />
    ${this.renderMiniProgramCode(source.miniProgramCodeDataUrl ?? null, 270, 1524)}
    <text x="404" y="1510" font-size="30" font-weight="520" fill="#14245A" font-family="${ZODIAC_POSTER_FONT_FAMILY}">长按识别小程序码，</text>
    <text x="404" y="1565" font-size="33" font-weight="680" fill="#14245A" font-family="${ZODIAC_POSTER_FONT_FAMILY}">查看你的专属星运报告</text>
  </g>
</svg>`.trim();
  }

  private resolveZodiacArchiveDetails(
    source: PosterRenderSource,
  ): ZodiacPosterDetails {
    const visual = this.resolveZodiacPosterVisual(source);
    const signName =
      source.zodiacName ??
      source.title.match(
        /白羊座|金牛座|双子座|巨蟹座|狮子座|处女座|天秤座|天蝎座|射手座|摩羯座|水瓶座|双鱼座/,
      )?.[0] ??
      '星座';
    const metrics = source.metrics;
    const pickMetric = (label: string, fallback: string) =>
      metrics.find((item) => item.label === label)?.value ?? fallback;
    const keywords = (
      source.zodiacPoster?.keywords?.length
        ? source.zodiacPoster.keywords
        : source.chips.length
          ? source.chips
          : ['优雅', '平衡', '和谐']
    ).slice(0, 3);
    const elementLabel =
      source.zodiacPoster?.elementLabel || pickMetric('星座属性', '风象星座');

    return {
      tagText: source.zodiacPoster?.tagText || '星运档案',
      subtitle:
        source.zodiacPoster?.subtitle ||
        '根据出生日期与出生地生成你的星座画像',
      signName: source.zodiacPoster?.signName || signName,
      englishName:
        source.zodiacPoster?.englishName ||
        source.zodiacEnglish ||
        visual.english,
      glyph: source.zodiacPoster?.glyph || visual.glyph,
      keywords,
      temperament:
        source.zodiacPoster?.temperament ||
        pickMetric(
          '星象气质',
          this.resolveZodiacTemplateTemperament(signName, keywords),
        ),
      energyTendency:
        source.zodiacPoster?.energyTendency ||
        pickMetric(
          '能量倾向',
          this.resolveZodiacTemplateEnergyTendency(signName),
        ),
      guardianElement:
        source.zodiacPoster?.guardianElement ||
        pickMetric(
          '守护元素',
          this.resolveZodiacTemplateGuardianElement(elementLabel),
        ),
      birthday: source.zodiacPoster?.birthday || pickMetric('出生日期', '待完善'),
      birthPlace:
        source.zodiacPoster?.birthPlace || pickMetric('出生地点', '待完善'),
      elementLabel,
      charmScore:
        source.zodiacPoster?.charmScore ??
        Number(pickMetric('魅力指数', source.energyValue ?? '88')),
      socialScore:
        source.zodiacPoster?.socialScore ??
        Number(pickMetric('社交能量', source.energyValue ?? '86')),
      luckyColor:
        source.zodiacPoster?.luckyColor || pickMetric('今日幸运色', '雾蓝'),
      quote: this.normalizeZodiacArchiveQuote(
        source.zodiacPoster?.quote ||
          source.summary ||
          '你像星光一样自带节奏，温柔而坚定地走向答案。',
      ),
    };
  }

  private normalizeZodiacArchiveQuote(value: string) {
    const normalized = value.trim();

    if (normalized.length <= 34) {
      return normalized;
    }

    return normalized.slice(0, 34).replace(/[，。、；：,.+\s]+$/u, '');
  }

  private normalizeZodiacSignName(value: string) {
    return (
      value.match(
        /白羊座|金牛座|双子座|巨蟹座|狮子座|处女座|天秤座|天蝎座|射手座|摩羯座|水瓶座|双鱼座/,
      )?.[0] ?? '天秤座'
    );
  }

  private resolveZodiacTemplateTemperament(
    signName: string,
    keywords: string[],
  ) {
    const map: Record<string, string> = {
      白羊座: '热烈勇敢',
      金牛座: '稳定丰盈',
      双子座: '灵动敏捷',
      巨蟹座: '温柔守护',
      狮子座: '明亮自信',
      处女座: '细致清醒',
      天秤座: '优雅平衡',
      天蝎座: '深邃敏锐',
      射手座: '自由开阔',
      摩羯座: '沉稳坚韧',
      水瓶座: '独立理性',
      双鱼座: '浪漫共情',
    };

    return map[signName] ?? keywords.slice(0, 2).join('') ?? '星光流动';
  }

  private resolveZodiacTemplateEnergyTendency(signName: string) {
    const map: Record<string, string> = {
      白羊座: '主动开局',
      金牛座: '稳步积累',
      双子座: '表达连接',
      巨蟹座: '情感滋养',
      狮子座: '自信绽放',
      处女座: '秩序优化',
      天秤座: '理性社交',
      天蝎座: '专注洞察',
      射手座: '探索扩展',
      摩羯座: '长期推进',
      水瓶座: '创新突破',
      双鱼座: '直觉流动',
    };

    return map[signName] ?? '顺势调整';
  }

  private resolveZodiacTemplateGuardianElement(elementLabel: string) {
    if (elementLabel.includes('火')) {
      return '火元素';
    }

    if (elementLabel.includes('土')) {
      return '土元素';
    }

    if (elementLabel.includes('水')) {
      return '水元素';
    }

    return '风元素';
  }

  private renderZodiacArchiveTexture() {
    return `
  <circle cx="45" cy="-4" r="150" fill="#FFFFFF" fill-opacity="0.24" />
  <circle cx="45" cy="-4" r="137" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-opacity="0.38" />
  <path d="M0 1468 C154 1398, 292 1462, 452 1508 S742 1540, 941 1458 L941 1672 L0 1672 Z" fill="#9AB2F0" fill-opacity="0.22" />
  <path d="M36 1650 C210 1580, 356 1620, 520 1640 S760 1634, 910 1572" fill="none" stroke="#FFFFFF" stroke-width="7" stroke-opacity="0.36" />
  <path d="M720 0 C692 44, 704 84, 760 122 S842 180, 832 250" fill="none" stroke="#C8A76F" stroke-width="1.6" stroke-opacity="0.48" stroke-dasharray="6 8" />
  <path d="M914 436 L920 424 L926 436 L938 442 L926 448 L920 460 L914 448 L902 442 Z" fill="#D1A968" />
  <path d="M814 1188 L822 1172 L830 1188 L846 1196 L830 1204 L822 1220 L814 1204 L798 1196 Z" fill="#D1A968" fill-opacity="0.72" />
  ${this.renderZodiacStars()}
  <path d="M32 1524 C76 1466, 130 1448, 190 1458" fill="none" stroke="#7D85C9" stroke-width="5" stroke-opacity="0.36" />
  <path d="M42 1544 C86 1518, 120 1518, 168 1536" fill="none" stroke="#7D85C9" stroke-width="5" stroke-opacity="0.28" />
  <path d="M812 1332 C848 1286, 888 1270, 936 1276" fill="none" stroke="#7D85C9" stroke-width="5" stroke-opacity="0.32" />
  <path d="M770 1388 C824 1356, 872 1354, 932 1380" fill="none" stroke="#7D85C9" stroke-width="5" stroke-opacity="0.26" />`.trim();
  }

  private renderZodiacArchiveHero(details: ZodiacPosterDetails) {
    const keywords = details.keywords.join(' · ');
    const signFontSize = this.fitPosterFontSize(
      details.signName,
      82,
      58,
      330,
    );
    const englishFontSize = this.fitPosterFontSize(
      details.englishName,
      44,
      32,
      250,
    );

    return `
  <rect x="30" y="198" width="881" height="546" rx="42" fill="url(#zodiac-hero)" stroke="#FFFFFF" stroke-width="2.5" filter="url(#archive-shadow)" />
  <clipPath id="zodiac-hero-clip"><rect x="30" y="198" width="881" height="546" rx="42" /></clipPath>
  <g clip-path="url(#zodiac-hero-clip)">
    <rect x="30" y="198" width="881" height="546" fill="#BFD0FF" fill-opacity="0.2" />
    ${this.renderZodiacWheel(248, 424, 194)}
    <path d="M610 256 C700 214, 822 236, 892 326" fill="none" stroke="#FFFFFF" stroke-width="1.6" stroke-opacity="0.56" />
    <path d="M724 234 L734 214 L744 234 L764 244 L744 254 L734 274 L724 254 L704 244 Z" fill="#FFFFFF" fill-opacity="0.86" />
    <path d="M823 320 L831 304 L839 320 L855 328 L839 336 L831 352 L823 336 L807 328 Z" fill="#FFFFFF" fill-opacity="0.8" />
    <path d="M746 258 L830 326 L876 374" fill="none" stroke="#FFFFFF" stroke-width="1.4" stroke-opacity="0.48" />
    <circle cx="746" cy="258" r="6" fill="#FFFFFF" />
    <circle cx="830" cy="326" r="6" fill="#FFFFFF" />
    <circle cx="876" cy="374" r="7" fill="#FFFFFF" />
    <path d="M52 646 C156 606, 248 618, 328 662 S524 716, 692 650 S836 616, 930 654 V744 H30 V672 C36 664, 44 654, 52 646 Z" fill="#FFFFFF" fill-opacity="0.2" />
    <circle cx="672" cy="390" r="128" fill="url(#zodiac-orb)" fill-opacity="0.9" />
    <circle cx="672" cy="390" r="154" fill="none" stroke="#F1D6A7" stroke-width="5" stroke-opacity="0.86" />
    <circle cx="672" cy="390" r="176" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-opacity="0.58" />
    ${this.renderZodiacSymbolIcon(details.signName, 672, 394, 246, '#FFF2D2', 0.95)}
  </g>
  <text x="244" y="480" text-anchor="middle" font-size="${signFontSize}" font-weight="650" fill="#14245A" font-family="${ZODIAC_POSTER_FONT_FAMILY}" filter="url(#archive-title-shadow)">${this.escapeXml(
    details.signName,
  )}</text>
  <text x="248" y="556" text-anchor="middle" font-size="${englishFontSize}" font-style="italic" fill="#C69C67" font-family="Georgia, Times New Roman, ${ZODIAC_POSTER_FONT_FAMILY}">${this.escapeXml(
    details.englishName,
  )}</text>
  <text x="248" y="624" text-anchor="middle" font-size="25" font-weight="480" fill="#1F3068" font-family="${ZODIAC_POSTER_FONT_FAMILY}">${this.escapeXml(
    keywords,
  )}</text>`.trim();
  }

  private renderZodiacSymbolIcon(
    signName: string,
    cx: number,
    cy: number,
    size: number,
    color: string,
    opacity = 1,
  ) {
    const scale = size / 512;
    const x = cx - 256 * scale;
    const y = cy - 256 * scale;

    return `
  <g transform="translate(${x} ${y}) scale(${scale})" color="${color}" opacity="${opacity}" filter="url(#archive-symbol-glow)">
    <circle cx="256" cy="168" r="152" fill="none" stroke="currentColor" stroke-width="4" stroke-opacity="0.18" stroke-dasharray="1 16" />
    <circle cx="256" cy="168" r="124" fill="none" stroke="currentColor" stroke-width="4" stroke-opacity="0.16" />
    <circle cx="256" cy="168" r="92" fill="currentColor" fill-opacity="0.09" stroke="currentColor" stroke-width="6" stroke-opacity="0.68" />
    <path d="M256 20v14M249 27h14M92 106v10M87 111h10M420 106v10M415 111h10" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" stroke-opacity="0.76" />
    <circle cx="140" cy="78" r="3" fill="currentColor" fill-opacity="0.72" />
    <circle cx="372" cy="78" r="3" fill="currentColor" fill-opacity="0.72" />
    <path d="M140 430c42 10 190 10 232 0" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-opacity="0.2" />
    ${this.resolveZodiacSymbolArtwork(signName)}
  </g>`.trim();
  }

  private resolveZodiacSymbolArtwork(signName: string) {
    const line = (d: string, width = 8, opacity = 0.96) =>
      `<path d="${d}" fill="none" stroke="currentColor" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" stroke-opacity="${opacity}" />`;
    const fill = (d: string, width = 8, opacity = 0.96) =>
      `<path d="${d}" fill="currentColor" fill-opacity="0.12" stroke="currentColor" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" stroke-opacity="${opacity}" />`;
    const circle = (cx: number, cy: number, r: number, width = 8) =>
      `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="currentColor" stroke-width="${width}" stroke-opacity="0.96" />`;
    const ellipse = (cx: number, cy: number, rx: number, ry: number) =>
      `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="currentColor" fill-opacity="0.12" stroke="currentColor" stroke-width="6" stroke-opacity="0.82" />`;
    const dot = (cx: number, cy: number, r = 5) =>
      `<circle cx="${cx}" cy="${cy}" r="${r}" fill="currentColor" fill-opacity="0.96" />`;
    const map: Record<string, string> = {
      白羊座: `
        ${line('M210 184c0-42 14-77 46-101', 12)}
        ${line('M302 184c0-42-14-77-46-101', 12)}
        ${line('M256 83c-12-20-38-26-56-12-14 11-16 31-4 44 12 14 32 14 45 2', 8)}
        ${line('M256 83c12-20 38-26 56-12 14 11 16 31 4 44-12 14-32 14-45 2', 8)}
        ${line('M184 292c14-34 40-54 72-54s58 20 72 54', 8)}
        ${line('M188 250c-28 0-52 22-52 50 0 24 18 42 42 42 18 0 34-10 42-25', 8)}
        ${line('M324 250c28 0 52 22 52 50 0 24-18 42-42 42-18 0-34-10-42-25', 8)}
        ${line('M214 312c12 14 27 22 42 22s30-8 42-22', 8)}
        ${fill('M232 314c0 20 10 38 24 52 14-14 24-32 24-52', 6)}
        ${ellipse(256, 410, 58, 15)}`,
      金牛座: `
        ${circle(256, 166, 34, 12)}
        ${line('M222 136c-20-8-34-24-36-48 24 2 44 18 52 42', 8)}
        ${line('M290 136c20-8 34-24 36-48-24 2-44 18-52 42', 8)}
        ${line('M194 262c-30-2-54 20-58 48 18-6 34-4 46 4', 8)}
        ${line('M318 262c30-2 54 20 58 48-18-6-34-4-46 4', 8)}
        ${fill('M186 286c0-34 32-62 70-62s70 28 70 62c0 32-22 62-70 62s-70-30-70-62z', 8)}
        ${circle(256, 352, 14, 6)}
        ${line('M236 332c12 8 28 8 40 0', 6)}
        ${ellipse(256, 410, 58, 15)}`,
      双子座: `
        ${line('M214 120h84M214 220h84', 12)}
        ${line('M226 120c8 26 8 74 0 100', 12)}
        ${line('M286 120c-8 26-8 74 0 100', 12)}
        ${fill('M180 254h38v118h-38z', 8)}
        ${fill('M294 254h38v118h-38z', 8)}
        ${line('M218 312c16-14 32-20 38-20 6 0 22 6 38 20', 6)}
        ${fill('M250 294l6-10 6 10-6 10z', 6)}
        ${dot(198, 310, 6)}
        ${dot(314, 310, 6)}
        ${ellipse(256, 410, 58, 15)}`,
      巨蟹座: `
        ${circle(224, 146, 22, 12)}
        ${circle(288, 198, 22, 12)}
        ${line('M292 124c-34-16-62-8-74 18', 12)}
        ${line('M220 220c34 16 62 8 74-18', 12)}
        ${fill('M196 300c0-34 26-56 60-56s60 22 60 56', 8)}
        ${line('M206 268c-26-6-48 6-58 28 16 4 28 10 38 22', 8)}
        ${line('M306 268c26-6 48 6 58 28-16 4-28 10-38 22', 8)}
        ${line('M216 322l-18 28M238 330l-12 30M274 330l12 30M296 322l18 28', 6)}
        ${ellipse(256, 410, 58, 15)}`,
      狮子座: `
        ${line('M214 138c-18-18-16-48 4-64 20-16 48-10 60 12 10 18 6 42-10 56', 12)}
        ${line('M266 142c18 0 34 14 34 32 0 14-8 26-20 32', 12)}
        ${line('M280 206c-18 2-28 16-28 32', 12)}
        ${fill('M256 236l16 20 24-8 10 24 26 0-4 26 20 16-16 20 8 24-24 10 0 26-26-4-16 20-20-16-24 8-10-24-26 0 4-26-20-16 16-20-8-24 24-10 0-26 26 4z', 6)}
        ${circle(256, 304, 58, 8)}
        ${dot(242, 298)}
        ${dot(270, 298)}
        ${line('M242 324c8 8 20 8 28 0', 6)}
        ${ellipse(256, 410, 58, 15)}`,
      处女座: `
        ${line('M198 220v-92', 12)}
        ${line('M234 220v-76c0-12 10-22 22-22 12 0 22 10 22 22v76', 12)}
        ${line('M198 148c0-14 10-26 24-26', 12)}
        ${line('M278 154c0-18 14-32 32-32 8 0 14 2 20 6', 12)}
        ${line('M278 188c8-4 16-6 24-6 18 0 30 12 30 28 0 18-14 30-30 30-10 0-20-4-26-12', 12)}
        ${fill('M256 262c-18 10-28 28-28 52 0 22 10 44 28 64 18-20 28-42 28-64 0-24-10-42-28-52z', 8)}
        ${line('M230 322c-18-10-34-28-42-50', 6)}
        ${line('M282 322c18-10 34-28 42-50', 6)}
        ${line('M256 262v108', 6)}
        ${ellipse(256, 382, 34, 10)}
        ${ellipse(256, 410, 58, 15)}`,
      天秤座: `
        ${line('M208 164h96M188 200h136', 12)}
        ${line('M208 164c0-26 21-47 48-47s48 21 48 47', 12)}
        ${line('M154 292c26-8 47-15 76-15h52c29 0 50 7 76 15', 8)}
        ${line('M238 294l18-22 18 22', 6)}
        ${line('M256 292v106', 12)}
        ${fill('M256 330c-18 20-18 44-10 68 4 11 8 20 10 30 2-10 6-19 10-30 8-24 8-48-10-68z', 6)}
        ${line('M188 296L154 378M188 296L202 378M324 296L310 378M324 296L358 378', 4)}
        ${fill('M128 378c10 20 34 30 50 30s40-10 50-30', 6)}
        ${line('M136 378h84M292 378h84', 6)}
        ${fill('M284 378c10 20 34 30 50 30s40-10 50-30', 6)}
        ${ellipse(256, 410, 58, 15)}`,
      天蝎座: `
        ${line('M206 220v-78M242 220v-78M278 220v-78', 12)}
        ${line('M206 156c0-16 14-28 30-28s30 12 30 28', 12)}
        ${line('M278 156c0-16 14-28 30-28s30 12 30 28v34', 12)}
        ${line('M338 190l-18 18M338 190l18 18', 12)}
        ${line('M198 290c0-18 16-34 34-34 16 0 24 8 24 24 0 10-6 18-16 22', 8)}
        ${line('M314 290c0-18-16-34-34-34-16 0-24 8-24 24 0 10 6 18 16 22', 8)}
        ${fill('M232 316c0 30 18 56 24 78 6-22 24-48 24-78', 8)}
        ${line('M256 394c18-2 32-14 42-32', 8)}
        ${line('M298 362c14-4 30 2 38 16-14 8-28 8-40 0', 8)}
        ${ellipse(256, 410, 58, 15)}`,
      射手座: `
        ${line('M212 208l88-88', 12)}
        ${line('M246 120h54v54M272 148l28-28', 12)}
        ${line('M222 178v38M202 196h38', 12)}
        ${line('M192 362c0-58 28-104 72-122', 8)}
        ${line('M320 362c0-58-28-104-72-122', 8)}
        ${line('M232 300l98-42', 12)}
        ${line('M330 258l-18-6M330 258l-8 18M232 300l-20-6M232 300l-10 18', 6)}
        ${line('M222 324c12 10 24 18 34 22M298 324c-12 10-24 18-34 22', 6)}
        ${ellipse(256, 410, 58, 15)}`,
      摩羯座: `
        ${line('M206 208v-64c0-12 10-22 22-22 12 0 22 10 22 22v64', 12)}
        ${line('M250 154c0-18 14-32 32-32 22 0 38 18 38 40 0 18-14 32-30 32-16 0-28 10-28 24 0 14 12 26 28 26 14 0 26-10 30-24', 12)}
        ${line('M190 286c6-30 28-52 66-52s60 22 66 52', 8)}
        ${line('M196 286c-24-10-38-30-36-56 26 6 44 22 52 44', 8)}
        ${line('M316 286c24-10 38-30 36-56-26 6-44 22-52 44', 8)}
        ${fill('M214 300c0 30 18 52 42 52s42-22 42-52', 8)}
        ${line('M222 352c10 16 20 30 34 42M290 352c-10 16-20 30-34 42', 6)}
        ${ellipse(256, 410, 58, 15)}`,
      水瓶座: `
        ${line('M196 148l28-18 28 18 28-18 28 18 28-18', 12)}
        ${line('M196 198l28-18 28 18 28-18 28 18 28-18', 12)}
        ${fill('M226 246c-12 10-20 30-20 50 0 40 22 68 50 90 28-22 50-50 50-90 0-20-8-40-20-50z', 8)}
        ${line('M234 246h44', 8)}
        ${line('M234 246c0-16 10-26 22-34 12 8 22 18 22 34', 8)}
        ${line('M230 302c14 8 30 8 52 0', 6)}
        ${line('M294 318c26 8 46 22 58 40', 8)}
        ${dot(318, 342, 4)}
        ${dot(340, 366, 4)}
        ${ellipse(256, 410, 58, 15)}`,
      双鱼座: `
        ${line('M206 172h100', 12)}
        ${line('M226 124c18 14 30 34 30 48s-12 34-30 48', 12)}
        ${line('M286 124c-18 14-30 34-30 48s12 34 30 48', 12)}
        ${fill('M184 304c18-24 46-34 72-30 22 4 46 22 52 46-24 10-52 10-74 0-22-10-42-28-50-16z', 8)}
        ${fill('M328 352c-18 24-46 34-72 30-22-4-46-22-52-46 24-10 52-10 74 0 22 10 42 28 50 16z', 8)}
        ${dot(222, 313, 4)}
        ${dot(290, 343, 4)}
        ${line('M174 304c-12 8-20 18-26 28 14 0 24 2 36 10', 6)}
        ${line('M338 352c12-8 20-18 26-28-14 0-24-2-36-10', 6)}
        ${ellipse(256, 410, 58, 15)}`,
    };

    return (map[signName] ?? map.天秤座).replace(/\s{2,}/g, ' ').trim();
  }

  private renderZodiacWheel(cx: number, cy: number, radius: number) {
    const spokes = Array.from({ length: 12 }, (_, index) => {
      const angle = -Math.PI / 2 + (Math.PI * 2 * index) / 12;
      const innerX = cx + Math.cos(angle) * (radius - 72);
      const innerY = cy + Math.sin(angle) * (radius - 72);
      const outerX = cx + Math.cos(angle) * radius;
      const outerY = cy + Math.sin(angle) * radius;

      return `<path d="M${innerX} ${innerY} L${outerX} ${outerY}" stroke="#FFFFFF" stroke-width="1" stroke-opacity="0.22" />`;
    }).join('');
    const markers = Array.from({ length: 12 }, (_, index) => {
      const angle = -Math.PI / 2 + (Math.PI * 2 * index) / 12;
      const x = cx + Math.cos(angle) * (radius - 34);
      const y = cy + Math.sin(angle) * (radius - 34);

      return `<circle cx="${x}" cy="${y}" r="3.5" fill="#FFFFFF" fill-opacity="0.45" />`;
    }).join('');

    return `
  <circle cx="${cx}" cy="${cy}" r="${radius}" fill="#FFFFFF" fill-opacity="0.13" stroke="#FFFFFF" stroke-width="1.4" stroke-opacity="0.32" />
  <circle cx="${cx}" cy="${cy}" r="${radius - 38}" fill="none" stroke="#FFFFFF" stroke-width="1.2" stroke-opacity="0.3" />
  <circle cx="${cx}" cy="${cy}" r="${radius - 78}" fill="none" stroke="#FFFFFF" stroke-width="1.2" stroke-opacity="0.22" />
  ${spokes}
  ${markers}`.trim();
  }

  private renderZodiacArchiveInfoCards(details: ZodiacPosterDetails) {
    const cards = [
      {
        label: '星象气质',
        value: details.temperament,
        icon: 'calendar',
      },
      {
        label: '能量倾向',
        value: details.energyTendency,
        icon: 'location',
      },
      {
        label: '守护元素',
        value: details.guardianElement,
        icon: 'wind',
      },
    ];
    const xPositions = [46, 336, 626];

    return cards
      .map((card, index) => {
        const x = xPositions[index];
        const valueFontSize = this.fitPosterFontSize(card.value, 32, 20, 126);
        const valueFitAttributes = this.buildSvgTextFitAttributes(
          card.value,
          valueFontSize,
          126,
        );

        return `
  <rect x="${x}" y="782" width="268" height="174" rx="24" fill="url(#zodiac-card)" stroke="#FFFFFF" stroke-width="2" filter="url(#archive-shadow)" />
  ${this.renderZodiacArchiveIcon(card.icon, x + 62, 870)}
  <text x="${x + 132}" y="848" font-size="25" font-weight="500" fill="#26366E" font-family="${ZODIAC_POSTER_FONT_FAMILY}">${this.escapeXml(
    card.label,
  )}</text>
  <text x="${x + 132}" y="902" font-size="${valueFontSize}" font-weight="680" fill="#14245A" font-family="${ZODIAC_POSTER_FONT_FAMILY}"${valueFitAttributes}>${this.escapeXml(
    card.value,
  )}</text>`.trim();
      })
      .join('');
  }

  private renderZodiacArchiveMetrics(details: ZodiacPosterDetails) {
    const metrics = [
      {
        label: '魅力指数',
        value: String(details.charmScore),
        icon: 'spark',
      },
      {
        label: '社交能量',
        value: String(details.socialScore),
        icon: 'people',
      },
      {
        label: '今日幸运色',
        value: details.luckyColor,
        icon: 'drop',
      },
    ];
    const xPositions = [78, 380, 682];

    return `
  <rect x="46" y="982" width="849" height="168" rx="28" fill="#FFFFFF" fill-opacity="0.76" stroke="#E7C78F" stroke-width="1.4" filter="url(#archive-shadow)" />
  ${metrics
    .map((metric, index) => {
      const x = xPositions[index];
      const valueFontSize =
        index === 2
          ? this.fitPosterFontSize(metric.value, 42, 26, 172)
          : this.fitPosterFontSize(metric.value, 56, 38, 112);
      const valueMaxWidth = index === 2 ? 172 : 112;
      const valueFitAttributes = this.buildSvgTextFitAttributes(
        metric.value,
        valueFontSize,
        valueMaxWidth,
      );
      const divider =
        index > 0
          ? `<path d="M${x - 44} 1020 V1114" stroke="#C8A76F" stroke-width="1.4" stroke-opacity="0.5" />`
          : '';

      return `
  ${divider}
  ${this.renderZodiacArchiveIcon(metric.icon, x, 1066, 32)}
  <text x="${x + 70}" y="1048" font-size="25" font-weight="500" fill="#26366E" font-family="${ZODIAC_POSTER_FONT_FAMILY}">${this.escapeXml(
    metric.label,
  )}</text>
  <text x="${x + 70}" y="1110" font-size="${valueFontSize}" font-weight="700" fill="#20247A" font-family="${ZODIAC_POSTER_FONT_FAMILY}"${valueFitAttributes}>${this.escapeXml(
    metric.value,
  )}</text>`.trim();
    })
    .join('')}`.trim();
  }

  private renderZodiacArchiveIcon(
    type: string,
    cx: number,
    cy: number,
    radius = 30,
  ) {
    const base = `
  <circle cx="${cx}" cy="${cy}" r="${radius}" fill="#FFFFFF" fill-opacity="0.78" stroke="#D4DDF8" stroke-width="2" />
  <circle cx="${cx}" cy="${cy}" r="${radius - 7}" fill="url(#zodiac-icon)" fill-opacity="0.82" />`;

    if (type === 'calendar') {
      return `
  ${base}
  <rect x="${cx - 13}" y="${cy - 10}" width="26" height="24" rx="2" fill="none" stroke="#FFFFFF" stroke-width="4" />
  <path d="M${cx - 7} ${cy - 17} V${cy - 7} M${cx + 7} ${cy - 17} V${cy - 7} M${cx - 13} ${cy - 2} H${cx + 13}" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" />`.trim();
    }

    if (type === 'location') {
      return `
  ${base}
  <path d="M${cx} ${cy + 18} C${cx - 17} ${cy - 1}, ${cx - 10} ${cy - 21}, ${cx} ${cy - 21} C${cx + 10} ${cy - 21}, ${cx + 17} ${cy - 1}, ${cx} ${cy + 18} Z" fill="#FFFFFF" />
  <circle cx="${cx}" cy="${cy - 7}" r="5" fill="#6E77D8" />`.trim();
    }

    if (type === 'wind') {
      return `
  ${base}
  <path d="M${cx - 18} ${cy - 6} H${cx + 8} C${cx + 22} ${cy - 6}, ${cx + 20} ${cy - 20}, ${cx + 8} ${cy - 18}" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" />
  <path d="M${cx - 18} ${cy + 5} H${cx + 18}" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" />
  <path d="M${cx - 8} ${cy + 16} H${cx + 10} C${cx + 22} ${cy + 16}, ${cx + 18} ${cy + 4}, ${cx + 8} ${cy + 6}" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" />`.trim();
    }

    if (type === 'people') {
      return `
  ${base}
  <circle cx="${cx - 8}" cy="${cy - 7}" r="7" fill="#FFFFFF" />
  <circle cx="${cx + 10}" cy="${cy - 5}" r="6" fill="#FFFFFF" />
  <path d="M${cx - 22} ${cy + 16} C${cx - 18} ${cy + 2}, ${cx - 2} ${cy + 1}, ${cx + 1} ${cy + 16}" fill="none" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" />
  <path d="M${cx + 1} ${cy + 15} C${cx + 4} ${cy + 5}, ${cx + 18} ${cy + 5}, ${cx + 22} ${cy + 15}" fill="none" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" />`.trim();
    }

    if (type === 'drop') {
      return `
  ${base}
  <path d="M${cx} ${cy - 20} C${cx + 20} ${cy + 6}, ${cx + 12} ${cy + 20}, ${cx} ${cy + 20} C${cx - 14} ${cy + 20}, ${cx - 20} ${cy + 6}, ${cx} ${cy - 20} Z" fill="#FFFFFF" />
  <path d="M${cx + 7} ${cy + 7} C${cx + 3} ${cy + 12}, ${cx - 6} ${cy + 12}, ${cx - 9} ${cy + 5}" fill="none" stroke="#7E91E8" stroke-width="3" stroke-linecap="round" />`.trim();
    }

    return `
  ${base}
  <path d="M${cx} ${cy - 20} L${cx + 8} ${cy - 5} L${cx + 24} ${cy} L${cx + 8} ${cy + 5} L${cx} ${cy + 22} L${cx - 8} ${cy + 5} L${cx - 24} ${cy} L${cx - 8} ${cy - 5} Z" fill="#FFFFFF" />`.trim();
  }

  private buildBaziPosterSvg(source: PosterRenderSource, layout: PosterLayout) {
    const details = this.resolveBaziPosterDetails(source);
    const scaleX = layout.width / 941;
    const scaleY = layout.height / 1672;
    const title = this.escapeXml(source.title || '我的八字命盘');
    const subtitle = this.escapeXml(
      source.subtitle || '根据出生日期与出生地生成的专属命理画像',
    );

    return `
<svg xmlns="http://www.w3.org/2000/svg" width="${layout.width}" height="${layout.height}" viewBox="0 0 ${layout.width} ${layout.height}">
  <defs>
    <linearGradient id="bazi-bg" x1="0%" x2="100%" y1="0%" y2="100%">
      <stop offset="0%" stop-color="#FAF0DF" />
      <stop offset="48%" stop-color="#FFFDF7" />
      <stop offset="100%" stop-color="#DBECE0" />
    </linearGradient>
    <linearGradient id="bazi-frame" x1="0%" x2="100%" y1="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.94" />
      <stop offset="56%" stop-color="#FFF8EA" stop-opacity="0.82" />
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0.9" />
    </linearGradient>
    <linearGradient id="bazi-title" x1="0%" x2="100%" y1="0%" y2="100%">
      <stop offset="0%" stop-color="#A9792C" />
      <stop offset="52%" stop-color="#6E4616" />
      <stop offset="100%" stop-color="#C3934D" />
    </linearGradient>
    <linearGradient id="bazi-ink" x1="10%" x2="88%" y1="8%" y2="92%">
      <stop offset="0%" stop-color="#315845" />
      <stop offset="52%" stop-color="#609A69" />
      <stop offset="100%" stop-color="#CDA35B" />
    </linearGradient>
    <linearGradient id="bazi-card" x1="0%" x2="100%" y1="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.9" />
      <stop offset="100%" stop-color="#FFF8EC" stop-opacity="0.78" />
    </linearGradient>
    <linearGradient id="purple-core" x1="16%" x2="86%" y1="8%" y2="92%">
      <stop offset="0%" stop-color="#D5AA6C" />
      <stop offset="54%" stop-color="#8F6B38" />
      <stop offset="100%" stop-color="#486D5B" />
    </linearGradient>
    <filter id="card-shadow" x="-20%" y="-20%" width="140%" height="150%">
      <feDropShadow dx="0" dy="16" stdDeviation="18" flood-color="#775C35" flood-opacity="0.14" />
    </filter>
    <filter id="title-shadow" x="-10%" y="-10%" width="120%" height="130%">
      <feDropShadow dx="0" dy="5" stdDeviation="5" flood-color="#D2B98E" flood-opacity="0.28" />
    </filter>
  </defs>
  <g transform="scale(${scaleX} ${scaleY})">
    <rect width="941" height="1672" fill="url(#bazi-bg)" />
    ${this.renderBaziTexture()}
    <circle cx="486" cy="195" r="164" fill="none" stroke="#DDBD84" stroke-width="2" stroke-opacity="0.26" />
    <circle cx="486" cy="195" r="128" fill="none" stroke="#DDBD84" stroke-width="2" stroke-opacity="0.18" />
    ${this.renderBaziBaguaWatermark(486, 195, 112)}
    <rect x="34" y="38" width="246" height="66" rx="32" ry="32" fill="#FFF8EA" fill-opacity="0.88" stroke="#E2C899" stroke-width="2" filter="url(#card-shadow)" />
    <circle cx="74" cy="71" r="39" fill="#FFF8EA" stroke="#E0BE7D" stroke-width="2" />
    ${this.renderBaziMiniTaiji(74, 71, 26)}
    <text x="122" y="82" font-size="30" font-weight="700" fill="#8A5E23" font-family="${POSTER_FONT_FAMILY}">${this.escapeXml(details.tagText)}</text>
    <text x="471" y="235" text-anchor="middle" font-size="76" font-weight="820" fill="url(#bazi-title)" font-family="${POSTER_FONT_FAMILY}" filter="url(#title-shadow)">${title}</text>
    <circle cx="770" cy="182" r="19" fill="#BD3F30" />
    <text x="770" y="176" text-anchor="middle" font-size="13" font-weight="700" fill="#FFFFFF" font-family="${POSTER_FONT_FAMILY}">命</text>
    <text x="770" y="193" text-anchor="middle" font-size="13" font-weight="700" fill="#FFFFFF" font-family="${POSTER_FONT_FAMILY}">理</text>
    <path d="M142 296 L205 296" stroke="#D4A24E" stroke-width="2" stroke-opacity="0.78" />
    <path d="M729 296 L792 296" stroke="#D4A24E" stroke-width="2" stroke-opacity="0.78" />
    <path d="M132 296 L142 286 L152 296 L142 306 Z" fill="#D4A24E" />
    <path d="M802 296 L792 286 L782 296 L792 306 Z" fill="#D4A24E" />
    <text x="471" y="308" text-anchor="middle" font-size="28" font-weight="520" fill="#4F4134" font-family="${POSTER_FONT_FAMILY}">${subtitle}</text>
    <rect x="60" y="374" width="821" height="952" rx="34" ry="34" fill="url(#bazi-card)" stroke="#E6C99C" stroke-width="1.5" filter="url(#card-shadow)" />
    ${this.renderBaziBirthRows(details)}
    ${this.renderBaziLandscapeMedallion()}
    ${this.renderBaziPillarPanel(details.pillars)}
    ${this.renderBaziCapsule(128, 948, 330, '#4F8B66', `五行偏向：${details.wuxingTrend}`, 'leaf')}
    ${this.renderBaziCapsule(486, 948, 326, '#4F8BA8', `喜用：${details.favorableElements}`, 'drop')}
    ${this.renderBaziElementCycle()}
    ${this.renderBaziAnalysisRows(details.analysis)}
    ${this.renderBaziFortunes(details.fortunes)}
    ${this.renderBaziLotus()}
    <text x="310" y="1396" text-anchor="middle" font-size="28" font-weight="520" fill="#4F4134" font-family="${POSTER_FONT_FAMILY}">长按识别小程序码</text>
    <text x="310" y="1440" text-anchor="middle" font-size="30" font-weight="760" fill="#2F7D5B" font-family="${POSTER_FONT_FAMILY}">查看完整八字报告</text>
    <rect x="210" y="1470" width="204" height="58" rx="29" fill="#FFF8EA" stroke="#D9A441" stroke-opacity="0.46" filter="url(#card-shadow)" />
    <circle cx="242" cy="1499" r="21" fill="#5F9B68" />
    <path d="M230 1505 C 238 1486, 258 1489, 253 1509 C 244 1516, 236 1513, 230 1505 Z" fill="#FFFFFF" fill-opacity="0.92" />
    <text x="329" y="1510" text-anchor="middle" font-size="27" font-weight="680" fill="#4F4134" font-family="${POSTER_FONT_FAMILY}">${this.escapeXml(details.brandLabel)}</text>
    <path d="M505 1374 L505 1546" stroke="#D9A441" stroke-width="2" stroke-opacity="0.34" />
    ${this.renderMiniProgramCode(source.miniProgramCodeDataUrl ?? null, 705, 1435)}
    <path d="M112 1584 C 260 1548, 406 1588, 538 1604 S 750 1594, 865 1546" fill="none" stroke="#CDA35B" stroke-width="6" stroke-opacity="0.42" />
    <text x="471" y="1624" text-anchor="middle" font-size="30" font-weight="560" fill="#8A5E23" font-family="${POSTER_FONT_FAMILY}">${this.escapeXml(details.bottomSlogan)}</text>
    <path d="M292 1614 L300 1602 L308 1614 L300 1626 Z" fill="#D9A441" />
    <path d="M632 1614 L640 1602 L648 1614 L640 1626 Z" fill="#D9A441" />
  </g>
</svg>`.trim();
  }

  private renderBaziTexture() {
    return `
  <path d="M12 344 C 102 260, 138 198, 112 124" fill="none" stroke="#D9A441" stroke-width="2" stroke-opacity="0.36" />
  <path d="M30 444 C 114 480, 168 520, 186 594" fill="none" stroke="#D9A441" stroke-width="2" stroke-opacity="0.22" />
  <path d="M744 74 C 830 116, 904 184, 934 154" fill="none" stroke="#D9A441" stroke-width="2" stroke-opacity="0.22" />
  <path d="M692 1278 C 754 1184, 832 1122, 944 1112 L944 1350 L690 1350 Z" fill="#AFCBC2" fill-opacity="0.34" />
  <path d="M0 1130 C 56 1028, 110 962, 174 1050 C 220 1112, 248 1164, 302 1208 L302 1360 L0 1360 Z" fill="#AFCBC2" fill-opacity="0.26" />
  <path d="M0 1508 C 142 1426, 258 1488, 396 1514 S 720 1548, 941 1456 L941 1672 L0 1672 Z" fill="#5F9B86" fill-opacity="0.52" />
  <path d="M-18 1536 C 150 1452, 290 1522, 444 1546 S 746 1546, 972 1482" fill="none" stroke="#E2C177" stroke-width="9" stroke-opacity="0.62" />
  <path d="M46 174 L56 154 L66 174 L56 194 Z" fill="#D9A441" fill-opacity="0.8" />
  <path d="M826 570 L834 554 L842 570 L834 586 Z" fill="#D9A441" fill-opacity="0.68" />
  <path d="M280 1588 L288 1576 L296 1588 L288 1600 Z" fill="#D9A441" fill-opacity="0.82" />
  ${this.renderBaziCloud(22, 552, 1.05, 0.28)}
  ${this.renderBaziCloud(706, 334, 0.9, 0.22)}
  ${this.renderBaziCloud(606, 604, 1.12, 0.28)}`.trim();
  }

  private resolveBaziPosterDetails(
    source: PosterRenderSource,
  ): BaziPosterDetails {
    const fallbackDayMaster =
      source.subtitle.match(/([甲乙丙丁戊己庚辛壬癸][木火土金水])日主/)?.[1] ??
      source.accentText.match(
        /([甲乙丙丁戊己庚辛壬癸][木火土金水])日主/,
      )?.[1] ??
      '乙木';
    const fallbackDominant =
      source.title.match(/([木火土金水])势/)?.[1] ??
      source.accentText.match(/([木火土金水])主轴/)?.[1] ??
      fallbackDayMaster[1] ??
      '木';
    const fallbackSupport =
      source.accentText.match(/([木火土金水])补位/)?.[1] ??
      ['水', '木', '火', '土', '金'].find(
        (item) => item !== fallbackDominant,
      ) ??
      '水';
    const details = source.baziPoster;

    return {
      tagText: details?.tagText || '八字分享',
      calendarText: details?.calendarText || '1996年10月21日 09:28',
      birthPlace: details?.birthPlace || '杭州',
      dayMaster: details?.dayMaster || fallbackDayMaster,
      pillars: this.normalizeBaziPillars(details?.pillars),
      wuxingTrend: details?.wuxingTrend || `${fallbackDominant}旺`,
      favorableElements:
        details?.favorableElements || `${fallbackSupport}${fallbackDominant}`,
      analysis: (details?.analysis?.length
        ? details.analysis
        : [
            `${fallbackDayMaster}日主，气质温和，有韧性`,
            `${fallbackDominant}${fallbackSupport}相生，学习力强`,
            `节奏建议：${fallbackDominant}主轴，${fallbackSupport}补位`,
          ]
      ).slice(0, 3),
      fortunes: (details?.fortunes?.length
        ? details.fortunes
        : [
            { label: '综合运势', value: 82, color: '#2F7D5B' },
            { label: '事业', value: 84, color: '#4B8FA8' },
            { label: '感情', value: 88, color: '#D96B5F' },
          ]
      ).slice(0, 3),
      brandLabel: details?.brandLabel || '八字运势',
      bottomSlogan: details?.bottomSlogan || '知命而后，更懂自己',
    };
  }

  private normalizeBaziPillars(pillars?: BaziPosterPillar[]) {
    const fallback = [
      { label: '年柱', stem: '丙', branch: '子' },
      { label: '月柱', stem: '丁', branch: '酉' },
      { label: '日柱', stem: '乙', branch: '卯' },
      { label: '时柱', stem: '辛', branch: '巳' },
    ];

    return fallback.map((item, index) => ({
      label: pillars?.[index]?.label || item.label,
      stem: pillars?.[index]?.stem || item.stem,
      branch: pillars?.[index]?.branch || item.branch,
    }));
  }

  private renderBaziBirthRows(details: BaziPosterDetails) {
    const rows = [
      {
        icon: 'calendar',
        label: `公历：${details.calendarText}`,
        color: '#4F8B66',
        y: 454,
      },
      {
        icon: 'location',
        label: `出生地：${details.birthPlace}`,
        color: '#D96B5F',
        y: 544,
      },
      {
        icon: 'leaf',
        label: `日主：${details.dayMaster}`,
        color: '#2F7D5B',
        y: 634,
      },
    ];

    return rows
      .map(
        (row) => `
  ${this.renderBaziInfoIcon(row.icon, 166, row.y, row.color)}
  <text x="226" y="${row.y + 12}" font-size="31" font-weight="580" fill="#372819" font-family="${POSTER_FONT_FAMILY}">${this.escapeXml(row.label)}</text>`,
      )
      .join('');
  }

  private renderBaziInfoIcon(
    type: string,
    cx: number,
    cy: number,
    color: string,
  ) {
    const body =
      type === 'calendar'
        ? `<rect x="${cx - 14}" y="${cy - 13}" width="28" height="27" rx="2" fill="none" stroke="${color}" stroke-width="4" /><path d="M${cx - 8} ${cy - 20} V${cy - 9} M${cx + 8} ${cy - 20} V${cy - 9} M${cx - 14} ${cy - 2} H${cx + 14}" stroke="${color}" stroke-width="4" stroke-linecap="round" />`
        : type === 'location'
          ? `<path d="M${cx} ${cy + 23} C${cx - 22} ${cy - 1}, ${cx - 14} ${cy - 25}, ${cx} ${cy - 25} C${cx + 14} ${cy - 25}, ${cx + 22} ${cy - 1}, ${cx} ${cy + 23} Z" fill="${color}" /><circle cx="${cx}" cy="${cy - 8}" r="6" fill="#FFFFFF" />`
          : `<path d="M${cx - 16} ${cy + 15} C${cx - 6} ${cy - 24}, ${cx + 26} ${cy - 22}, ${cx + 17} ${cy + 15} C${cx + 4} ${cy + 24}, ${cx - 7} ${cy + 22}, ${cx - 16} ${cy + 15} Z" fill="${color}" /><path d="M${cx - 2} ${cy + 10} L${cx + 13} ${cy - 12}" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" />`;

    return `
  <circle cx="${cx}" cy="${cy}" r="35" fill="#FFFFFF" fill-opacity="0.78" stroke="#E6C99C" stroke-width="1.5" filter="url(#card-shadow)" />
  ${body}`.trim();
  }

  private renderBaziLandscapeMedallion() {
    return `
  <circle cx="728" cy="535" r="108" fill="#F4EEDA" stroke="#E2A95B" stroke-width="2" />
  <circle cx="728" cy="535" r="98" fill="#EAF4EC" stroke="#FFFFFF" stroke-width="3" />
  <clipPath id="bazi-landscape-clip"><circle cx="728" cy="535" r="94" /></clipPath>
  <g clip-path="url(#bazi-landscape-clip)">
    <rect x="634" y="514" width="188" height="116" fill="#EAF4EC" />
    <path d="M628 594 C674 544, 704 546, 740 594 Z" fill="#AFCBC2" fill-opacity="0.66" />
    <path d="M688 592 C748 522, 794 548, 832 594 Z" fill="#C8D9CE" />
    <path d="M634 610 C686 586, 740 590, 822 604" fill="none" stroke="#8FB9B3" stroke-width="8" stroke-opacity="0.72" />
    <path d="M652 624 C708 602, 766 604, 822 620" fill="none" stroke="#BFD8D2" stroke-width="12" stroke-opacity="0.66" />
    <path d="M748 606 V532 M728 606 V556 M768 606 V556 M720 580 H776 M728 556 H768 M736 532 H760" stroke="#2F7D5B" stroke-width="5" stroke-linecap="round" />
    <path d="M684 602 C706 580, 728 580, 749 602" fill="none" stroke="#7DAAA4" stroke-width="4" />
    <path d="M696 416 C700 474, 676 492, 666 536 M734 412 C734 470, 714 490, 706 526 M774 426 C762 474, 748 494, 740 526" fill="none" stroke="#6BA371" stroke-width="3" stroke-linecap="round" stroke-opacity="0.75" />
  </g>
  ${this.renderBaziCloud(780, 594, 0.58, 0.46)}`.trim();
  }

  private renderBaziPillarPanel(pillars: BaziPosterPillar[]) {
    const x = 100;
    const y = 690;
    const width = 741;
    const height = 218;
    const columnWidth = width / 4;

    return `
  <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="22" ry="22" fill="#FFFFFF" fill-opacity="0.7" stroke="#E2C177" stroke-width="1.5" />
  ${pillars
    .map((pillar, index) => {
      const centerX = x + columnWidth * index + columnWidth / 2;
      const divider =
        index > 0
          ? `<path d="M${x + columnWidth * index} ${y + 18} V${y + height - 18}" stroke="#E0C99E" stroke-width="1.2" stroke-opacity="0.68" />`
          : '';

      return `
  ${divider}
  <text x="${centerX}" y="${y + 46}" text-anchor="middle" font-size="27" font-weight="700" fill="#8A5E23" font-family="${POSTER_FONT_FAMILY}">${this.escapeXml(pillar.label)}</text>
  <path d="M${centerX - 58} ${y + 70} H${centerX + 58}" stroke="#D9A441" stroke-width="1.2" stroke-opacity="0.5" />
  <path d="M${centerX} ${y + 61} L${centerX + 8} ${y + 70} L${centerX} ${y + 79} L${centerX - 8} ${y + 70} Z" fill="#D9A441" />
  <text x="${centerX}" y="${y + 132}" text-anchor="middle" font-size="58" font-weight="800" fill="${this.resolveBaziElementColor(pillar.stem)}" font-family="${POSTER_FONT_FAMILY}">${this.escapeXml(pillar.stem)}</text>
  <text x="${centerX}" y="${y + 192}" text-anchor="middle" font-size="58" font-weight="800" fill="${this.resolveBaziElementColor(pillar.branch)}" font-family="${POSTER_FONT_FAMILY}">${this.escapeXml(pillar.branch)}</text>`;
    })
    .join('')}`.trim();
  }

  private renderBaziCapsule(
    x: number,
    y: number,
    width: number,
    color: string,
    text: string,
    icon: 'leaf' | 'drop',
  ) {
    const iconMarkup =
      icon === 'drop'
        ? `<path d="M${x + 40} ${y + 15} C${x + 60} ${y + 40}, ${x + 50} ${y + 55}, ${x + 40} ${y + 55} C${x + 25} ${y + 55}, ${x + 18} ${y + 40}, ${x + 40} ${y + 15} Z" fill="#FFFFFF" />`
        : `<path d="M${x + 28} ${y + 43} C${x + 34} ${y + 18}, ${x + 58} ${y + 20}, ${x + 52} ${y + 48} C${x + 42} ${y + 58}, ${x + 34} ${y + 54}, ${x + 28} ${y + 43} Z" fill="#FFFFFF" />`;

    return `
  <rect x="${x}" y="${y}" width="${width}" height="62" rx="31" fill="#FFFFFF" fill-opacity="0.72" stroke="#D9A441" stroke-width="1" stroke-opacity="0.28" filter="url(#card-shadow)" />
  <circle cx="${x + 40}" cy="${y + 31}" r="25" fill="${color}" />
  ${iconMarkup}
  <text x="${x + 78}" y="${y + 42}" font-size="26" font-weight="700" fill="#4F4134" font-family="${POSTER_FONT_FAMILY}">${this.escapeXml(text)}</text>`.trim();
  }

  private renderBaziElementCycle() {
    const elements = ['木', '火', '土', '金', '水'];
    const cx = 214;
    const cy = 1156;
    const radius = 102;
    const points = elements.map((element, index) => {
      const angle = -Math.PI / 2 + (Math.PI * 2 * index) / elements.length;

      return {
        element,
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
      };
    });

    return `
  <circle cx="${cx}" cy="${cy}" r="132" fill="#FFFFFF" fill-opacity="0.54" stroke="#D9C28B" stroke-width="2" />
  <circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="#CFA65B" stroke-width="2" stroke-opacity="0.42" />
  ${points
    .map((point, index) => {
      const next = points[(index + 1) % points.length];
      return `<path d="M${point.x} ${point.y} L${next.x} ${next.y}" stroke="#D9A441" stroke-width="2" stroke-opacity="0.38" stroke-dasharray="5 7" />`;
    })
    .join('')}
  ${points
    .map(
      (point) => `
  <circle cx="${point.x}" cy="${point.y}" r="28" fill="${this.resolveBaziElementColor(point.element)}" filter="url(#card-shadow)" />
  <text x="${point.x}" y="${point.y + 10}" text-anchor="middle" font-size="28" font-weight="780" fill="#FFFFFF" font-family="${POSTER_FONT_FAMILY}">${point.element}</text>`,
    )
    .join('')}
  <circle cx="${cx}" cy="${cy}" r="48" fill="#EEF6EA" stroke="#E0C99E" stroke-width="2" />
  <path d="M${cx} ${cy + 34} V${cy - 8}" stroke="#4F8B66" stroke-width="6" stroke-linecap="round" />
  <path d="M${cx - 2} ${cy - 8} C${cx - 44} ${cy - 28}, ${cx - 34} ${cy - 58}, ${cx - 2} ${cy - 44} C${cx + 32} ${cy - 58}, ${cx + 44} ${cy - 26}, ${cx - 2} ${cy - 8} Z" fill="#6EA36F" />
  <path d="M${cx - 26} ${cy + 34} C${cx - 10} ${cy + 18}, ${cx + 12} ${cy + 18}, ${cx + 28} ${cy + 34}" fill="none" stroke="#6EA36F" stroke-width="5" stroke-linecap="round" />`.trim();
  }

  private renderBaziAnalysisRows(analysis: string[]) {
    const iconX = 396;
    const textX = 430;
    const dividerEndX = 826;

    return analysis
      .slice(0, 3)
      .map((item, index) => {
        const y = 1068 + index * 68;
        const color = ['#4F8B66', '#4B8FA8', '#D96B5F'][index] ?? '#4F8B66';
        const lineItems = this.splitTextByDisplayUnits(item, 15, 2);
        const lines = this.renderTextTspansFromLines(lineItems, 0, 28, textX);
        const dividerY = y + (lineItems.length > 1 ? 44 : 30);
        const divider =
          index < 2
            ? `<path d="M${textX} ${dividerY} H${dividerEndX}" stroke="#E0C99E" stroke-width="1" stroke-opacity="0.52" />`
            : '';

        return `
  <circle cx="${iconX}" cy="${y - 10}" r="20" fill="#FFFFFF" fill-opacity="0.68" stroke="#E0C99E" stroke-width="1" />
  <circle cx="${iconX}" cy="${y - 10}" r="10" fill="${color}" />
  <text x="${textX}" y="${y}" font-size="25" font-weight="560" fill="#4F4134" font-family="${POSTER_FONT_FAMILY}">${lines}</text>
  ${divider}`;
      })
      .join('');
  }

  private renderBaziFortunes(fortunes: BaziPosterFortune[]) {
    const normalized = fortunes.slice(0, 3);

    return `
  <rect x="368" y="1246" width="452" height="68" rx="20" fill="#FFFFFF" fill-opacity="0.72" stroke="#D9A441" stroke-width="1" stroke-opacity="0.3" />
  ${normalized
    .map((item, index) => {
      const x = 444 + index * 150;
      const divider =
        index > 0
          ? `<path d="M${x - 75} 1260 V1300" stroke="#D9A441" stroke-width="1" stroke-opacity="0.34" />`
          : '';

      return `
  ${divider}
  <text x="${x}" y="1274" text-anchor="middle" font-size="18" fill="#8D7E6C" font-family="${POSTER_FONT_FAMILY}">${this.escapeXml(item.label)}</text>
  <text x="${x}" y="1304" text-anchor="middle" font-size="31" font-weight="800" fill="${item.color ?? '#2F7D5B'}" font-family="${POSTER_FONT_FAMILY}">${this.escapeXml(String(item.value))}</text>`;
    })
    .join('')}`.trim();
  }

  private renderBaziBaguaWatermark(cx: number, cy: number, radius: number) {
    return Array.from({ length: 8 }, (_, index) => {
      const angle = (Math.PI * 2 * index) / 8 - Math.PI / 2;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      const rotate = (angle * 180) / Math.PI + 90;

      return `<g transform="translate(${x} ${y}) rotate(${rotate})" opacity="0.18">
  <path d="M-16 -8 H16 M-16 0 H16 M-16 8 H16" stroke="#D9A441" stroke-width="3" stroke-linecap="round" />
</g>`;
    }).join('');
  }

  private renderBaziMiniTaiji(cx: number, cy: number, radius: number) {
    return `
  <circle cx="${cx}" cy="${cy}" r="${radius}" fill="#FFF7EA" />
  <path d="M${cx} ${cy - radius} A${radius} ${radius} 0 0 0 ${cx} ${cy + radius} A${radius / 2} ${radius / 2} 0 0 1 ${cx} ${cy} A${radius / 2} ${radius / 2} 0 0 0 ${cx} ${cy - radius}" fill="#372819" />
  <path d="M${cx} ${cy - radius} A${radius} ${radius} 0 0 1 ${cx} ${cy + radius} A${radius / 2} ${radius / 2} 0 0 0 ${cx} ${cy} A${radius / 2} ${radius / 2} 0 0 1 ${cx} ${cy - radius}" fill="#FFFFFF" />
  <circle cx="${cx}" cy="${cy - radius / 2}" r="${radius * 0.11}" fill="#FFFFFF" />
  <circle cx="${cx}" cy="${cy + radius / 2}" r="${radius * 0.11}" fill="#372819" />`.trim();
  }

  private renderBaziCloud(
    x: number,
    y: number,
    scale: number,
    opacity: number,
  ) {
    return `
  <g transform="translate(${x} ${y}) scale(${scale})" opacity="${opacity}">
    <path d="M0 28 C22 4, 52 8, 62 30 C84 22, 114 32, 116 54 C88 50, 60 56, 28 52 C14 52, 4 42, 0 28 Z" fill="none" stroke="#D9A441" stroke-width="2.2" />
  </g>`.trim();
  }

  private renderBaziLotus() {
    return `
  <g transform="translate(100 1320) scale(1.06)" opacity="0.9">
    <path d="M0 0 C32 -54, 74 -52, 56 14 C34 44, 10 34, 0 0 Z" fill="#F2B9AF" />
    <path d="M0 0 C-32 -54, -74 -52, -56 14 C-34 44, -10 34, 0 0 Z" fill="#F5CEC6" />
    <path d="M0 2 C8 -72, 54 -78, 42 -2 C30 42, 8 48, 0 2 Z" fill="#F8D8D2" />
    <path d="M0 2 C-8 -72, -54 -78, -42 -2 C-30 42, -8 48, 0 2 Z" fill="#F8D8D2" />
    <path d="M0 -4 C-18 -74, 20 -96, 28 -12 C22 30, 4 40, 0 -4 Z" fill="#F7C6BD" />
    <circle cx="0" cy="20" r="20" fill="#D9A441" />
    <path d="M-98 120 C-42 70, 36 84, 106 112" fill="none" stroke="#5F9B86" stroke-width="7" stroke-opacity="0.7" />
  </g>`.trim();
  }

  private resolveBaziElementColor(value: string) {
    if ('甲乙寅卯木'.includes(value)) {
      return '#2F7D5B';
    }

    if ('丙丁巳午火'.includes(value)) {
      return '#C85748';
    }

    if ('戊己辰戌丑未土'.includes(value)) {
      return '#B9853A';
    }

    if ('庚辛申酉金'.includes(value)) {
      return '#C3934D';
    }

    if ('壬癸子亥水'.includes(value)) {
      return '#4B8FA8';
    }

    return '#2F7D5B';
  }

  private buildWallpaperSvg(input: WallpaperRenderInput) {
    const { layout, palette } = input;
    const [colorA, colorB, colorC] = palette;
    const titleTspans = this.renderTextTspans(input.title, 13, 0, 74, 84);
    const subtitleTspans = this.renderTextTspans(input.subtitle, 22, 0, 42, 84);
    const guidanceTspans = this.renderTextTspans(
      input.guidance,
      24,
      0,
      40,
      118,
    );
    const chipBlocks = this.renderChipBlocks(
      input.chips.slice(0, 4),
      84,
      86,
      layout.width - 168,
    );
    const backgroundLayer = input.backgroundDataUrl
      ? `<image href="${input.backgroundDataUrl}" x="0" y="0" width="${layout.width}" height="${layout.height}" preserveAspectRatio="xMidYMid slice" />`
      : this.buildAbstractBackground(
          layout.width,
          layout.height,
          colorA,
          colorB,
          colorC,
        );
    const cardY = Math.round(layout.height * 0.54);
    const cardHeight = Math.round(layout.height * 0.26);

    return `
<svg xmlns="http://www.w3.org/2000/svg" width="${layout.width}" height="${layout.height}" viewBox="0 0 ${layout.width} ${layout.height}">
  <defs>
    <linearGradient id="wallpaper-overlay" x1="0%" x2="100%" y1="0%" y2="100%">
      <stop offset="0%" stop-color="${colorA}" stop-opacity="0.62" />
      <stop offset="54%" stop-color="${colorB}" stop-opacity="0.22" />
      <stop offset="100%" stop-color="${colorC}" stop-opacity="0.5" />
    </linearGradient>
    <linearGradient id="glass" x1="0%" x2="100%" y1="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.76" />
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.32" />
    </linearGradient>
  </defs>
  ${backgroundLayer}
  <rect width="${layout.width}" height="${layout.height}" fill="url(#wallpaper-overlay)" />
  <rect x="56" y="56" width="${layout.width - 112}" height="${layout.height - 112}" rx="48" ry="48" fill="#06111d" fill-opacity="0.08" stroke="#ffffff" stroke-opacity="0.34" />
  ${chipBlocks}
  <text x="84" y="218" font-size="26" letter-spacing="6" fill="#f4fbff" font-family="${POSTER_FONT_FAMILY}">FORTUNE HUB WALLPAPER</text>
  <text x="84" y="342" font-size="70" font-weight="760" fill="#ffffff" font-family="${POSTER_FONT_FAMILY}">${titleTspans}</text>
  <text x="84" y="514" font-size="32" fill="#f8fbff" fill-opacity="0.96" font-family="${POSTER_FONT_FAMILY}">${subtitleTspans}</text>
  <rect x="84" y="${cardY}" width="${layout.width - 168}" height="${cardHeight}" rx="38" ry="38" fill="url(#glass)" stroke="#ffffff" stroke-opacity="0.24" />
  <text x="118" y="${cardY + 76}" font-size="32" fill="#142634" font-family="${POSTER_FONT_FAMILY}">${guidanceTspans}</text>
  <text x="84" y="${layout.height - 92}" font-size="25" fill="#ffffff" fill-opacity="0.88" font-family="${POSTER_FONT_FAMILY}">Generated by Fortune Hub</text>
</svg>`.trim();
  }

  private buildAbstractBackground(
    width: number,
    height: number,
    colorA: string,
    colorB: string,
    colorC: string,
  ) {
    return `
  <rect x="0" y="0" width="${width}" height="${height}" fill="${colorB}" />
  <circle cx="${Math.round(width * 0.18)}" cy="${Math.round(height * 0.16)}" r="${Math.round(width * 0.22)}" fill="${colorA}" fill-opacity="0.34" />
  <circle cx="${Math.round(width * 0.84)}" cy="${Math.round(height * 0.22)}" r="${Math.round(width * 0.24)}" fill="${colorC}" fill-opacity="0.2" />
  <circle cx="${Math.round(width * 0.78)}" cy="${Math.round(height * 0.84)}" r="${Math.round(width * 0.28)}" fill="${colorA}" fill-opacity="0.18" />
  <path d="M${Math.round(width * 0.08)} ${Math.round(height * 0.76)} C ${Math.round(width * 0.28)} ${Math.round(height * 0.64)}, ${Math.round(width * 0.48)} ${Math.round(height * 0.64)}, ${Math.round(width * 0.68)} ${Math.round(height * 0.76)} S ${Math.round(width * 0.92)} ${Math.round(height * 0.86)}, ${Math.round(width * 0.98)} ${Math.round(height * 0.72)}" fill="none" stroke="#ffffff" stroke-opacity="0.16" stroke-width="5" />`.trim();
  }

  private renderMetricBlocks(
    metrics: PosterMetric[],
    x: number,
    y: number,
    width: number,
    height: number,
  ) {
    if (!metrics.length) {
      return '';
    }

    const gap = 18;
    const itemWidth = Math.floor(
      (width - gap * (metrics.length - 1)) / metrics.length,
    );

    return metrics
      .map((metric, index) => {
        const currentX = x + index * (itemWidth + gap);
        const label = this.escapeXml(metric.label);
        const value = this.escapeXml(metric.value);
        const hint = this.renderTextTspans(
          metric.hint ?? '',
          10,
          0,
          28,
          currentX + 24,
        );

        return `
  <rect x="${currentX}" y="${y}" width="${itemWidth}" height="${height}" rx="30" ry="30" fill="#06111d" fill-opacity="0.2" stroke="#ffffff" stroke-opacity="0.16" />
  <text x="${currentX + 24}" y="${y + 42}" font-size="22" letter-spacing="3" fill="#f0f7ff" font-family="${POSTER_FONT_FAMILY}">${label}</text>
  <text x="${currentX + 24}" y="${y + 110}" font-size="58" font-weight="700" fill="#ffffff" font-family="${POSTER_FONT_FAMILY}">${value}</text>
  <text x="${currentX + 24}" y="${y + 146}" font-size="20" fill="#ffffff" fill-opacity="0.9" font-family="${POSTER_FONT_FAMILY}">${hint}</text>`.trim();
      })
      .join('');
  }

  private renderChipBlocks(
    chips: string[],
    x: number,
    y: number,
    width: number,
  ) {
    if (!chips.length) {
      return '';
    }

    let cursorX = x;
    let cursorY = y;
    const lineHeight = 52;
    const gap = 16;
    const parts: string[] = [];

    for (const chip of chips) {
      const label = this.escapeXml(chip);
      const chipWidth = Math.min(280, Math.max(112, chip.length * 26 + 36));

      if (cursorX + chipWidth > x + width) {
        cursorX = x;
        cursorY += lineHeight + gap;
      }

      parts.push(
        `
  <rect x="${cursorX}" y="${cursorY}" width="${chipWidth}" height="${lineHeight}" rx="20" ry="20" fill="#06111d" fill-opacity="0.18" stroke="#ffffff" stroke-opacity="0.14" />
  <text x="${cursorX + 18}" y="${cursorY + 33}" font-size="22" fill="#ffffff" fill-opacity="0.96" font-family="${POSTER_FONT_FAMILY}">${label}</text>`.trim(),
      );

      cursorX += chipWidth + gap;
    }

    return parts.join('');
  }

  private renderHighlightBlocks(
    lines: string[],
    x: number,
    y: number,
    width: number,
    rowHeight: number,
  ) {
    if (!lines.length) {
      return '';
    }

    return lines
      .map((line, index) => {
        const currentY = y + index * rowHeight;
        return `
  <circle cx="${x + 10}" cy="${currentY - 8}" r="6" fill="#ffffff" fill-opacity="0.86" />
  <text x="${x + 28}" y="${currentY}" font-size="28" fill="#ffffff" fill-opacity="0.98" font-family="${POSTER_FONT_FAMILY}">${this.escapeXml(
    line,
  )}</text>`.trim();
      })
      .join('');
  }

  private renderZodiacInfoCards(metrics: PosterMetric[]) {
    const normalized = [
      metrics[0] ?? {
        label: '幸运色',
        value: '雾光蓝',
        hint: '幸运色彩助力好运',
      },
      metrics[1] ?? {
        label: '幸运物',
        value: '木质书签',
        hint: '随身携带，带来灵感',
      },
      metrics[2] ?? {
        label: '行动签',
        value: '完成一个小目标',
        hint: '行动带来改变',
      },
    ];
    const cardWidth = 304;
    const cardHeight = 244;
    const gap = 22;
    const startX = 64;
    const y = 636;

    return normalized
      .map((metric, index) => {
        const x = startX + index * (cardWidth + gap);
        const label = this.escapeXml(metric.label);
        const valueLines = this.renderTextTspans(
          metric.value,
          index === 2 ? 8 : 7,
          0,
          42,
          x + 28,
        );
        const hintLines = this.renderTextTspans(
          metric.hint ?? '',
          10,
          0,
          30,
          x + 28,
        );

        return `
  <rect x="${x}" y="${y}" width="${cardWidth}" height="${cardHeight}" rx="26" ry="26" fill="#FFFFFF" fill-opacity="0.82" stroke="#FFFFFF" stroke-width="2" filter="url(#card-shadow)" />
  ${this.renderZodiacCardIcon(metric.label, x + 56, y + 56)}
  <text x="${x + 104}" y="${y + 66}" font-size="28" font-weight="640" fill="#657491" font-family="${POSTER_FONT_FAMILY}">${label}</text>
  <text x="${x + 28}" y="${y + 142}" font-size="34" font-weight="760" fill="#24344F" font-family="${POSTER_FONT_FAMILY}">${valueLines}</text>
  <text x="${x + 28}" y="${y + 204}" font-size="23" fill="#7C8AA4" font-family="${POSTER_FONT_FAMILY}">${hintLines}</text>`.trim();
      })
      .join('');
  }

  private renderZodiacKeywordTags(chips: string[]) {
    const normalized = (chips.length ? chips : ['目标', '责任', '耐力']).slice(
      0,
      3,
    );
    const startX = 64;
    const y = 918;
    const width = 304;
    const gap = 18;

    return normalized
      .map((chip, index) => {
        const x = startX + index * (width + gap);
        return `
  <rect x="${x}" y="${y}" width="${width}" height="82" rx="40" ry="40" fill="url(#blue-pill)" stroke="#FFFFFF" stroke-width="2" filter="url(#card-shadow)" />
  ${this.renderZodiacTagIcon(x + 82, y + 41, index)}
  <text x="${x + 160}" y="${y + 53}" text-anchor="middle" font-size="30" font-weight="720" fill="#3B6ECF" font-family="${POSTER_FONT_FAMILY}">${this.escapeXml(
    chip,
  )}</text>`.trim();
      })
      .join('');
  }

  private renderZodiacTitleLines(title: string) {
    const match = title.match(
      /^(白羊座|金牛座|双子座|巨蟹座|狮子座|处女座|天秤座|天蝎座|射手座|摩羯座|水瓶座|双鱼座)/,
    );
    const sign = match?.[1] ?? title.slice(0, 3);
    const secondLine = title.includes('运势') ? '今日运势' : '今日运势';

    return [
      `<tspan x="78" dy="0">${this.escapeXml(sign)}</tspan>`,
      `<tspan x="78" dy="96">${this.escapeXml(secondLine)}</tspan>`,
    ].join('');
  }

  private resolveZodiacPosterVisual(source: PosterRenderSource) {
    const sign = source.zodiacName ?? source.title;
    const visual = ZODIAC_POSTER_VISUALS[sign] ?? {
      glyph: source.zodiacGlyph ?? '✦',
      english: source.zodiacEnglish ?? 'Zodiac',
    };

    return {
      glyph: source.zodiacGlyph ?? visual.glyph,
      english: source.zodiacEnglish ?? visual.english,
    };
  }

  private renderZodiacStars() {
    const stars = [
      [760, 74, 14],
      [986, 86, 8],
      [914, 170, 30],
      [526, 172, 13],
      [650, 194, 9],
      [996, 252, 7],
      [484, 334, 15],
      [928, 412, 12],
      [724, 510, 7],
    ];

    return stars
      .map(
        ([x, y, size]) =>
          `<path d="M${x} ${y - size} L${x + size * 0.28} ${y - size * 0.28} L${x + size} ${y} L${x + size * 0.28} ${y + size * 0.28} L${x} ${y + size} L${x - size * 0.28} ${y + size * 0.28} L${x - size} ${y} L${x - size * 0.28} ${y - size * 0.28} Z" fill="#FFFFFF" fill-opacity="0.9" />`,
      )
      .join('');
  }

  private renderZodiacCardIcon(label: string, cx: number, cy: number) {
    const base = `<circle cx="${cx}" cy="${cy}" r="28" fill="#5DA9E9" fill-opacity="0.16" /><circle cx="${cx}" cy="${cy}" r="24" fill="#6D82FF" fill-opacity="0.72" />`;

    if (label.includes('物')) {
      return `
  ${base}
  <path d="M${cx - 13} ${cy - 2} H${cx + 13} V${cy + 15} H${cx - 13} Z" fill="none" stroke="#FFFFFF" stroke-width="5" stroke-linejoin="round" />
  <path d="M${cx - 17} ${cy - 9} H${cx + 17} V${cy - 2} H${cx - 17} Z" fill="none" stroke="#FFFFFF" stroke-width="5" stroke-linejoin="round" />
  <path d="M${cx} ${cy - 13} V${cy + 15}" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" />
  <path d="M${cx} ${cy - 11} C${cx - 17} ${cy - 25}, ${cx - 18} ${cy - 2}, ${cx} ${cy - 8} C${cx + 18} ${cy - 2}, ${cx + 17} ${cy - 25}, ${cx} ${cy - 11} Z" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" />`.trim();
    }

    if (label.includes('行动')) {
      return `
  ${base}
  <path d="M${cx - 17} ${cy + 11} L${cx + 18} ${cy - 15} L${cx + 8} ${cy + 17} L${cx} ${cy + 4} L${cx - 17} ${cy + 11} Z" fill="none" stroke="#FFFFFF" stroke-width="5" stroke-linejoin="round" stroke-linecap="round" />`.trim();
    }

    return `
  ${base}
  <circle cx="${cx}" cy="${cy}" r="13" fill="none" stroke="#FFFFFF" stroke-width="5" />
  <circle cx="${cx - 10}" cy="${cy - 12}" r="5" fill="#FFFFFF" />
  <circle cx="${cx + 12}" cy="${cy - 5}" r="4" fill="#FFFFFF" />
  <circle cx="${cx - 7}" cy="${cy + 13}" r="4" fill="#FFFFFF" />`.trim();
  }

  private renderZodiacTagIcon(cx: number, cy: number, index: number) {
    if (index === 1) {
      return `
  <path d="M${cx - 12} ${cy - 10} L${cx} ${cy - 18} L${cx + 12} ${cy - 10} V${cy + 7} C${cx + 5} ${cy + 17}, ${cx - 5} ${cy + 17}, ${cx - 12} ${cy + 7} Z" fill="#5F86E8" />
  <path d="M${cx - 5} ${cy} L${cx - 1} ${cy + 5} L${cx + 8} ${cy - 6}" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />`.trim();
    }

    if (index === 2) {
      return `
  <path d="M${cx - 16} ${cy + 14} L${cx - 4} ${cy - 14} L${cx + 20} ${cy + 14} Z" fill="#5F86E8" />
  <path d="M${cx - 2} ${cy - 2} L${cx + 8} ${cy - 11} L${cx + 18} ${cy - 2}" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />`.trim();
    }

    return `
  <circle cx="${cx}" cy="${cy}" r="19" fill="#5F86E8" />
  <circle cx="${cx}" cy="${cy}" r="10" fill="none" stroke="#FFFFFF" stroke-width="4" />
  <path d="M${cx + 7} ${cy - 7} L${cx + 17} ${cy - 17}" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" />
  <path d="M${cx + 12} ${cy - 18} H${cx + 18} V${cy - 12}" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" />`.trim();
  }

  private renderReminderIllustration() {
    return `
  <circle cx="186" cy="1136" r="82" fill="#94A8FF" fill-opacity="0.32" />
  <path d="M96 1192 L166 1086 L218 1162 L244 1128 L306 1192 Z" fill="#7390FF" fill-opacity="0.58" />
  <path d="M166 1086 L184 1148 L152 1128 Z" fill="#FFFFFF" fill-opacity="0.54" />
  <path d="M218 1162 L232 1184 L190 1184 Z" fill="#4D71DB" fill-opacity="0.3" />
  <path d="M160 1086 V1048 H206 L192 1067 L206 1086 Z" fill="#4D71DB" />
  <path d="M160 1048 V1092" stroke="#4D71DB" stroke-width="5" stroke-linecap="round" />
  <path d="M112 1114 L 122 1124 L 134 1116" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-opacity="0.9" />
  <path d="M274 1086 L 282 1100 L 296 1108 L 282 1116 L 274 1130 L 266 1116 L 252 1108 L 266 1100 Z" fill="#FFFFFF" fill-opacity="0.9" />`.trim();
  }

  private renderMiniProgramCode(
    codeDataUrl: string | null,
    cx: number,
    cy: number,
  ) {
    if (codeDataUrl) {
      const imageSize = 142;
      const imageX = cx - imageSize / 2;
      const imageY = cy - imageSize / 2;

      return `
  <circle cx="${cx}" cy="${cy}" r="84" fill="#FFFFFF" filter="url(#card-shadow)" />
  <circle cx="${cx}" cy="${cy}" r="68" fill="#F7F9FF" stroke="#E5EBFA" stroke-width="2" />
  <image href="${this.escapeXml(codeDataUrl)}" x="${imageX}" y="${imageY}" width="${imageSize}" height="${imageSize}" preserveAspectRatio="xMidYMid meet" />`.trim();
    }

    return this.renderMiniProgramCodePlaceholder(cx, cy);
  }

  private renderMiniProgramCodePlaceholder(cx: number, cy: number) {
    const modules = [
      [-40, -46, 10],
      [-14, -42, 8],
      [12, -36, 12],
      [-50, -18, 8],
      [-24, -16, 12],
      [2, -16, 8],
      [26, -8, 10],
      [-42, 10, 12],
      [-10, 14, 10],
      [18, 22, 8],
      [-30, 38, 8],
      [6, 44, 12],
    ];

    return `
  <circle cx="${cx}" cy="${cy}" r="84" fill="#FFFFFF" filter="url(#card-shadow)" />
  <circle cx="${cx}" cy="${cy}" r="62" fill="#F7F9FF" stroke="#E5EBFA" stroke-width="2" />
  ${modules
    .map(
      ([offsetX, offsetY, size]) =>
        `<rect x="${cx + offsetX}" y="${cy + offsetY}" width="${size}" height="${size}" rx="3" ry="3" fill="#2F3A4A" fill-opacity="0.82" />`,
    )
    .join('')}
  <circle cx="${cx}" cy="${cy}" r="23" fill="url(#purple-core)" />
  <path d="M${cx - 13} ${cy + 6} C${cx - 3} ${cy - 12}, ${cx + 14} ${cy - 8}, ${cx + 9} ${cy + 9} C${cx + 3} ${cy + 25}, ${cx - 14} ${cy + 21}, ${cx - 13} ${cy + 6} Z" fill="#FFFFFF" fill-opacity="0.9" />`.trim();
  }

  private renderTextTspans(
    text: string,
    maxChars: number,
    firstDy: number,
    nextDy: number,
    x: number,
  ) {
    return this.renderTextTspansFromLines(
      this.splitText(text, maxChars),
      firstDy,
      nextDy,
      x,
    );
  }

  private renderTextTspansFromLines(
    lines: string[],
    firstDy: number,
    nextDy: number,
    x: number,
  ) {
    return lines
      .map(
        (line, index) =>
          `<tspan x="${x}" dy="${index === 0 ? firstDy : nextDy}">${this.escapeXml(line)}</tspan>`,
      )
      .join('');
  }

  private splitText(text: string, maxChars: number) {
    const value = text.trim();

    if (!value) {
      return [''];
    }

    const lines: string[] = [];
    let current = '';

    for (const char of value) {
      current += char;
      if (current.length >= maxChars) {
        lines.push(current);
        current = '';
      }
    }

    if (current) {
      lines.push(current);
    }

    return lines.slice(0, 4);
  }

  private fitPosterFontSize(
    text: string,
    maxFontSize: number,
    minFontSize: number,
    maxWidth: number,
  ) {
    const units = Math.max(1, this.measurePosterTextUnits(text));
    const fitted = Math.floor(maxWidth / units);

    return Math.max(minFontSize, Math.min(maxFontSize, fitted));
  }

  private buildSvgTextFitAttributes(
    text: string,
    fontSize: number,
    maxWidth: number,
  ) {
    const estimatedWidth = this.measurePosterTextUnits(text) * fontSize;

    if (estimatedWidth <= maxWidth) {
      return '';
    }

    return ` textLength="${Math.round(maxWidth)}" lengthAdjust="spacingAndGlyphs"`;
  }

  private splitTextByDisplayUnits(
    text: string,
    maxUnits: number,
    maxLines: number,
  ) {
    const value = text.trim();

    if (!value) {
      return [''];
    }

    const chars = [...value];
    const lines: string[] = [];
    let current = '';
    let currentUnits = 0;

    for (const char of chars) {
      const charUnits = this.measurePosterTextUnits(char);

      if (current && currentUnits + charUnits > maxUnits) {
        const preferredBreakIndex = this.findPreferredTextBreakIndex(current);

        if (preferredBreakIndex > 0 && preferredBreakIndex < current.length) {
          lines.push(current.slice(0, preferredBreakIndex).trimEnd());
          current = current.slice(preferredBreakIndex).trimStart();
          currentUnits = this.measurePosterTextUnits(current);

          if (current && currentUnits + charUnits > maxUnits) {
            lines.push(current.trimEnd());
            current = '';
            currentUnits = 0;
          }
        } else {
          lines.push(current.trimEnd());
          current = '';
          currentUnits = 0;
        }

        if (lines.length >= maxLines) {
          break;
        }
      }

      if (!current && /\s/u.test(char)) {
        continue;
      }

      current += char;
      currentUnits += charUnits;
    }

    if (current && lines.length < maxLines) {
      lines.push(current.trimEnd());
    }

    const limitedLines = lines.slice(0, maxLines).filter(Boolean);

    return limitedLines.length ? limitedLines : [''];
  }

  private findPreferredTextBreakIndex(value: string) {
    const breakMarks = ['，', '。', '；', '：', ',', ';', ':', ' '];

    for (let index = value.length - 1; index >= 0; index -= 1) {
      if (breakMarks.includes(value[index])) {
        return index + 1;
      }
    }

    return -1;
  }

  private measurePosterTextUnits(value: string) {
    return [...value].reduce((total, char) => {
      if (/\s/u.test(char)) {
        return total + 0.32;
      }

      if (/[\u0000-\u007f]/u.test(char)) {
        return total + 0.58;
      }

      if (/[\u3000-\u303f\uff00-\uffef]/u.test(char)) {
        return total + 0.86;
      }

      return total + 1;
    }, 0);
  }

  private async renderPng(templateMarkup: string) {
    return sharp(Buffer.from(templateMarkup))
      .png({ compressionLevel: 9 })
      .toBuffer();
  }

  private toPngDataUrl(imageBuffer: Buffer) {
    return `data:image/png;base64,${imageBuffer.toString('base64')}`;
  }

  private escapeXml(value: string) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
