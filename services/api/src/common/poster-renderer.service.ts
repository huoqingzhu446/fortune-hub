import { Injectable } from '@nestjs/common';
import sharp from 'sharp';

const POSTER_FONT_FAMILY =
  'WenQuanYi Zen Hei, Noto Sans CJK SC, Noto Sans SC, PingFang SC, Microsoft YaHei, DejaVu Sans, Arial, sans-serif';

const ZODIAC_POSTER_VISUALS: Record<
  string,
  {
    glyph: string;
    english: string;
  }
> = {
  白羊座: { glyph: '白羊', english: 'Aries' },
  金牛座: { glyph: '金牛', english: 'Taurus' },
  双子座: { glyph: '双子', english: 'Gemini' },
  巨蟹座: { glyph: '巨蟹', english: 'Cancer' },
  狮子座: { glyph: '狮子', english: 'Leo' },
  处女座: { glyph: '处女', english: 'Virgo' },
  天秤座: { glyph: '天秤', english: 'Libra' },
  天蝎座: { glyph: '天蝎', english: 'Scorpio' },
  射手座: { glyph: '射手', english: 'Sagittarius' },
  摩羯座: { glyph: '摩羯', english: 'Capricorn' },
  水瓶座: { glyph: '水瓶', english: 'Aquarius' },
  双鱼座: { glyph: '双鱼', english: 'Pisces' },
};

export type PosterMetric = {
  label: string;
  value: string;
  hint?: string;
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
  miniProgramCodeDataUrl?: string | null;
};

export type PosterLayout = {
  size: '1280x1280' | '1080x1440' | '1088x1472';
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
  resolvePosterLayout(
    requestedSize: PosterLayout['size'] | undefined,
    sourceType: string,
  ): PosterLayout {
    const prefersPortrait =
      sourceType === 'today_index' ||
      sourceType === 'zodiac_today' ||
      sourceType === 'bazi';
    const size = requestedSize ?? (prefersPortrait ? '1088x1472' : '1280x1280');

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
    const build = (background: string | null) =>
      layout.kind === 'portrait' && source.sourceType === 'zodiac_today'
        ? this.buildZodiacTodayPosterSvg(source, layout)
        : layout.kind === 'portrait' && source.sourceType === 'bazi'
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
    const visual = this.resolveZodiacPosterVisual(source);
    const titleLines = this.renderZodiacTitleLines(
      source.zodiacName ?? source.title,
    );
    const subtitleLines = this.renderTextTspans(source.subtitle, 13, 0, 46, 78);
    const reminderLines = this.renderTextTspans(
      source.summary ||
        source.highlightLines[0] ||
        '把任务拆小，把节奏放稳。今天的每一步都算数。',
      18,
      0,
      38,
      348,
    );
    const infoCards = this.renderZodiacInfoCards(source.metrics.slice(0, 3));
    const keywordTags = this.renderZodiacKeywordTags(source.chips.slice(0, 3));
    const energyValue = this.escapeXml(source.energyValue ?? '78');
    const highlightTitle = this.escapeXml(source.highlightTitle ?? '今日提醒');
    const frameWidth = layout.width - 56;
    const frameHeight = layout.height - 56;
    const footerY = layout.height - 166;
    const codeCenterX = layout.width - 154;
    const codeCenterY = footerY + 46;
    const waveY = layout.height - 230;
    const waveEndY = layout.height - 202;

    return `
<svg xmlns="http://www.w3.org/2000/svg" width="${layout.width}" height="${layout.height}" viewBox="0 0 ${layout.width} ${layout.height}">
  <defs>
    <linearGradient id="zodiac-bg" x1="0%" x2="100%" y1="0%" y2="100%">
      <stop offset="0%" stop-color="#F4F7FF" />
      <stop offset="54%" stop-color="#EEF2FF" />
      <stop offset="100%" stop-color="#FFFFFF" />
    </linearGradient>
    <linearGradient id="poster-frame" x1="0%" x2="100%" y1="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.94" />
      <stop offset="62%" stop-color="#F8FAFF" stop-opacity="0.82" />
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0.9" />
    </linearGradient>
    <linearGradient id="hero-card" x1="0%" x2="100%" y1="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.86" />
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0.58" />
    </linearGradient>
    <linearGradient id="purple-core" x1="16%" x2="86%" y1="8%" y2="92%">
      <stop offset="0%" stop-color="#C99DFF" />
      <stop offset="48%" stop-color="#A85CFF" />
      <stop offset="100%" stop-color="#5E7CFF" />
    </linearGradient>
    <linearGradient id="blue-pill" x1="0%" x2="100%" y1="0%" y2="100%">
      <stop offset="0%" stop-color="#EBF3FF" />
      <stop offset="100%" stop-color="#F7FAFF" />
    </linearGradient>
    <filter id="card-shadow" x="-20%" y="-20%" width="140%" height="150%">
      <feDropShadow dx="0" dy="16" stdDeviation="18" flood-color="#5D7FB8" flood-opacity="0.16" />
    </filter>
    <filter id="title-shadow" x="-10%" y="-10%" width="120%" height="130%">
      <feDropShadow dx="0" dy="6" stdDeviation="5" flood-color="#B6C7EE" flood-opacity="0.34" />
    </filter>
  </defs>
  <rect width="${layout.width}" height="${layout.height}" fill="url(#zodiac-bg)" />
  <rect x="-80" y="0" width="1240" height="270" fill="#5DA9E9" fill-opacity="0.14" />
  <path d="M62 450 C 270 274, 518 314, 728 478 S 982 584, 1040 394" fill="none" stroke="#A85CFF" stroke-opacity="0.2" stroke-width="2" />
  <path d="M450 116 C 594 188, 720 310, 960 236" fill="none" stroke="#5DA9E9" stroke-opacity="0.22" stroke-width="3" />
  ${this.renderZodiacStars()}
  <rect x="28" y="28" width="${frameWidth}" height="${frameHeight}" rx="56" ry="56" fill="url(#poster-frame)" stroke="#FFFFFF" stroke-width="2" filter="url(#card-shadow)" />
  <path d="M56 ${waveY} C 232 ${waveY - 52}, 388 ${waveY - 10}, 548 ${waveY + 40} S 884 ${waveY + 112}, 1024 ${waveEndY}" fill="none" stroke="#D7E5FF" stroke-width="7" stroke-opacity="0.58" />
  <text x="78" y="116" font-size="26" letter-spacing="8" fill="#8EA8F8" font-family="${POSTER_FONT_FAMILY}">ZODIAC TODAY</text>
  <path d="M326 107 L 414 107" stroke="#C5D5FF" stroke-width="2" />
  <path d="M434 98 L 440 108 L 450 114 L 440 120 L 434 130 L 428 120 L 418 114 L 428 108 Z" fill="#90A7F7" fill-opacity="0.72" />
  <text x="78" y="244" font-size="78" font-weight="760" fill="#25334B" font-family="${POSTER_FONT_FAMILY}" filter="url(#title-shadow)">${titleLines}</text>
  <path d="M82 392 L 112 360" stroke="#8AA5FF" stroke-width="3" stroke-linecap="round" />
  <text x="78" y="468" font-size="34" font-weight="600" fill="#42546F" font-family="${POSTER_FONT_FAMILY}">${subtitleLines}</text>
  <rect x="602" y="88" width="380" height="458" rx="64" ry="64" fill="url(#hero-card)" stroke="#FFFFFF" stroke-width="3" filter="url(#card-shadow)" />
  <path d="M614 333 C 720 244, 844 236, 962 318" fill="none" stroke="#FFFFFF" stroke-opacity="0.82" stroke-width="2" />
  <ellipse cx="800" cy="327" rx="212" ry="54" fill="none" stroke="#B9C5FF" stroke-width="2" stroke-opacity="0.58" transform="rotate(-17 800 327)" />
  <circle cx="792" cy="236" r="108" fill="url(#purple-core)" />
  <circle cx="792" cy="236" r="126" fill="#A85CFF" fill-opacity="0.12" />
  <text x="792" y="270" text-anchor="middle" font-size="84" font-weight="760" letter-spacing="3" fill="#FFFFFF" font-family="${POSTER_FONT_FAMILY}">${this.escapeXml(
    visual.glyph,
  )}</text>
  <text x="792" y="448" text-anchor="middle" font-size="104" font-weight="760" fill="#6B5BEF" font-family="${POSTER_FONT_FAMILY}">${energyValue}</text>
  <text x="792" y="498" text-anchor="middle" font-size="27" font-weight="600" fill="#7B83B2" font-family="${POSTER_FONT_FAMILY}">今日能量值</text>
  ${infoCards}
  ${keywordTags}
  <rect x="64" y="1038" width="952" height="190" rx="32" ry="32" fill="#FFFFFF" fill-opacity="0.78" stroke="#FFFFFF" stroke-width="2" filter="url(#card-shadow)" />
  ${this.renderReminderIllustration()}
  <text x="348" y="1110" font-size="35" font-weight="760" fill="#2F3A4A" font-family="${POSTER_FONT_FAMILY}">${highlightTitle}</text>
  <path d="M518 1087 L 526 1102 L 542 1110 L 526 1118 L 518 1134 L 510 1118 L 494 1110 L 510 1102 Z" fill="#A9B9FF" fill-opacity="0.82" />
  <text x="348" y="1164" font-size="30" font-weight="500" fill="#5D6A7F" font-family="${POSTER_FONT_FAMILY}">${reminderLines}</text>
  <rect x="64" y="${footerY}" width="86" height="86" rx="24" ry="24" fill="url(#purple-core)" />
  <path d="M88 ${footerY + 50} C 114 ${footerY + 18}, 142 ${footerY + 26}, 130 ${footerY + 54} C 118 ${footerY + 80}, 86 ${footerY + 76}, 88 ${footerY + 50} Z" fill="#FFFFFF" fill-opacity="0.88" />
  <circle cx="124" cy="${footerY + 37}" r="7" fill="#FFFFFF" />
  <text x="174" y="${footerY + 40}" font-size="30" font-weight="720" fill="#24344F" font-family="${POSTER_FONT_FAMILY}">星座今日 · Zodiac Today</text>
  <text x="174" y="${footerY + 81}" font-size="24" fill="#7E8DA6" font-family="${POSTER_FONT_FAMILY}">发现星座的力量，遇见更好的自己</text>
  <path d="M636 ${footerY + 10} L 636 ${footerY + 88}" stroke="#D6DEF2" stroke-width="2" />
  <text x="674" y="${footerY + 44}" font-size="27" font-weight="620" fill="#53617A" font-family="${POSTER_FONT_FAMILY}">扫码查看你的</text>
  <text x="674" y="${footerY + 82}" font-size="27" font-weight="620" fill="#53617A" font-family="${POSTER_FONT_FAMILY}">今日运势</text>
  ${this.renderMiniProgramCode(source.miniProgramCodeDataUrl ?? null, codeCenterX, codeCenterY)}
</svg>`.trim();
  }

  private buildBaziPosterSvg(source: PosterRenderSource, layout: PosterLayout) {
    const visual = this.resolveBaziPosterVisual(source);
    const titleLines = this.renderTextTspans(source.title, 7, 0, 92, 78);
    const subtitleLines = this.renderTextTspans(source.subtitle, 16, 0, 42, 78);
    const accentLines = this.renderTextTspans(source.accentText, 14, 0, 36, 82);
    const summaryLines = this.renderTextTspans(
      source.summary ||
        '把擅长的节奏作为启动方式，再给需要补位的一面留出空间。',
      20,
      0,
      38,
      342,
    );
    const footerY = layout.height - 166;
    const frameWidth = layout.width - 56;
    const frameHeight = layout.height - 56;
    const codeCenterX = layout.width - 154;
    const codeCenterY = footerY + 46;

    return `
<svg xmlns="http://www.w3.org/2000/svg" width="${layout.width}" height="${layout.height}" viewBox="0 0 ${layout.width} ${layout.height}">
  <defs>
    <linearGradient id="bazi-bg" x1="0%" x2="100%" y1="0%" y2="100%">
      <stop offset="0%" stop-color="#F9F2E8" />
      <stop offset="48%" stop-color="#EEF4EE" />
      <stop offset="100%" stop-color="#FFFDF7" />
    </linearGradient>
    <linearGradient id="bazi-frame" x1="0%" x2="100%" y1="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.94" />
      <stop offset="56%" stop-color="#FBF4E7" stop-opacity="0.82" />
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0.9" />
    </linearGradient>
    <linearGradient id="bazi-ink" x1="10%" x2="88%" y1="8%" y2="92%">
      <stop offset="0%" stop-color="#253B36" />
      <stop offset="52%" stop-color="#436D5A" />
      <stop offset="100%" stop-color="#C3934D" />
    </linearGradient>
    <linearGradient id="bazi-card" x1="0%" x2="100%" y1="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.86" />
      <stop offset="100%" stop-color="#FFF8EC" stop-opacity="0.62" />
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
  <rect width="${layout.width}" height="${layout.height}" fill="url(#bazi-bg)" />
  <rect x="-72" y="0" width="1220" height="286" fill="#D9B56F" fill-opacity="0.14" />
  <path d="M70 410 C 254 286, 452 314, 632 462 S 898 560, 1030 388" fill="none" stroke="#C3934D" stroke-opacity="0.24" stroke-width="3" />
  <path d="M58 1238 C 252 1182, 430 1224, 612 1282 S 882 1354, 1032 1266" fill="none" stroke="#DFCAA3" stroke-width="7" stroke-opacity="0.6" />
  ${this.renderBaziTexture()}
  <rect x="28" y="28" width="${frameWidth}" height="${frameHeight}" rx="56" ry="56" fill="url(#bazi-frame)" stroke="#FFFFFF" stroke-width="2" filter="url(#card-shadow)" />
  <text x="78" y="116" font-size="26" letter-spacing="8" fill="#9B7B49" font-family="${POSTER_FONT_FAMILY}">BAZI ENERGY MAP</text>
  <path d="M354 107 L 444 107" stroke="#D9BF8E" stroke-width="2" />
  <circle cx="462" cy="107" r="7" fill="#C3934D" fill-opacity="0.66" />
  <text x="78" y="244" font-size="78" font-weight="760" fill="#263B37" font-family="${POSTER_FONT_FAMILY}" filter="url(#title-shadow)">${titleLines}</text>
  <text x="78" y="464" font-size="32" font-weight="600" fill="#57675D" font-family="${POSTER_FONT_FAMILY}">${subtitleLines}</text>
  ${this.renderBaziEnergyPlate(visual, 800, 292)}
  <rect x="64" y="578" width="960" height="88" rx="38" ry="38" fill="#FFFFFF" fill-opacity="0.72" stroke="#FFFFFF" stroke-width="2" filter="url(#card-shadow)" />
  <text x="82" y="633" font-size="29" font-weight="680" fill="#4E5D54" font-family="${POSTER_FONT_FAMILY}">${accentLines}</text>
  ${this.renderBaziInfoCards(visual)}
  ${this.renderBaziTags(source.chips, visual)}
  <rect x="64" y="1038" width="960" height="190" rx="34" ry="34" fill="#FFFFFF" fill-opacity="0.78" stroke="#FFFFFF" stroke-width="2" filter="url(#card-shadow)" />
  ${this.renderBaziMountainMark()}
  <text x="342" y="1110" font-size="35" font-weight="760" fill="#263B37" font-family="${POSTER_FONT_FAMILY}">今日可借势</text>
  <path d="M516 1087 L 524 1102 L 540 1110 L 524 1118 L 516 1134 L 508 1118 L 492 1110 L 508 1102 Z" fill="#CDA35B" fill-opacity="0.82" />
  <text x="342" y="1164" font-size="30" font-weight="500" fill="#657268" font-family="${POSTER_FONT_FAMILY}">${summaryLines}</text>
  <rect x="64" y="${footerY}" width="86" height="86" rx="24" ry="24" fill="url(#bazi-ink)" />
  <path d="M90 ${footerY + 53} C 106 ${footerY + 23}, 142 ${footerY + 27}, 132 ${footerY + 55} C 122 ${footerY + 80}, 86 ${footerY + 78}, 90 ${footerY + 53} Z" fill="#FFFFFF" fill-opacity="0.88" />
  <path d="M105 ${footerY + 34} L 128 ${footerY + 58}" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" stroke-opacity="0.76" />
  <text x="174" y="${footerY + 40}" font-size="30" font-weight="720" fill="#263B37" font-family="${POSTER_FONT_FAMILY}">八字轻解 · Bazi Map</text>
  <text x="174" y="${footerY + 81}" font-size="24" fill="#7B887F" font-family="${POSTER_FONT_FAMILY}">把五行节奏翻译成今天能用的提醒</text>
  <path d="M636 ${footerY + 10} L 636 ${footerY + 88}" stroke="#E0D2B8" stroke-width="2" />
  <text x="674" y="${footerY + 44}" font-size="27" font-weight="620" fill="#5D665F" font-family="${POSTER_FONT_FAMILY}">扫码查看你的</text>
  <text x="674" y="${footerY + 82}" font-size="27" font-weight="620" fill="#5D665F" font-family="${POSTER_FONT_FAMILY}">八字解读</text>
  ${this.renderMiniProgramCode(source.miniProgramCodeDataUrl ?? null, codeCenterX, codeCenterY)}
</svg>`.trim();
  }

  private resolveBaziPosterVisual(source: PosterRenderSource) {
    const elementColors: Record<
      string,
      { main: string; pale: string; text: string }
    > = {
      木: { main: '#4F8B66', pale: '#DDEDE0', text: '#315E47' },
      火: { main: '#C96B50', pale: '#F6DDD1', text: '#874935' },
      土: { main: '#C3934D', pale: '#F4E7CC', text: '#765B34' },
      金: { main: '#8FA1AE', pale: '#E3EAF0', text: '#536471' },
      水: { main: '#4F7EA1', pale: '#DCE9F2', text: '#315A73' },
    };
    const dayMaster =
      source.subtitle.match(/([甲乙丙丁戊己庚辛壬癸])日主/)?.[1] ??
      source.accentText.match(/([甲乙丙丁戊己庚辛壬癸])日主/)?.[1] ??
      '甲';
    const dominant =
      source.title.match(/([木火土金水])势/)?.[1] ??
      source.accentText.match(/([木火土金水])主轴/)?.[1] ??
      '木';
    const support =
      source.accentText.match(/([木火土金水])补位/)?.[1] ??
      ['木', '火', '土', '金', '水'].find((item) => item !== dominant) ??
      '水';

    return {
      dayMaster,
      dominant,
      support,
      palette: elementColors[dominant] ?? elementColors.木,
    };
  }

  private renderBaziEnergyPlate(
    visual: ReturnType<PosterRendererService['resolveBaziPosterVisual']>,
    cx: number,
    cy: number,
  ) {
    const elements = ['木', '火', '土', '金', '水'];
    const points = elements.map((element, index) => {
      const angle = -Math.PI / 2 + (index * Math.PI * 2) / elements.length;
      const x = cx + Math.cos(angle) * 146;
      const y = cy + Math.sin(angle) * 146;
      const isDominant = element === visual.dominant;
      const isSupport = element === visual.support;
      return `
  <circle cx="${x}" cy="${y}" r="${isDominant ? 42 : 34}" fill="${isDominant ? visual.palette.main : isSupport ? '#D2A45B' : '#FFFFFF'}" fill-opacity="${isDominant ? 0.92 : isSupport ? 0.78 : 0.72}" stroke="#FFFFFF" stroke-width="3" filter="url(#card-shadow)" />
  <text x="${x}" y="${y + 11}" text-anchor="middle" font-size="${isDominant ? 34 : 28}" font-weight="760" fill="${isDominant || isSupport ? '#FFFFFF' : '#748076'}" font-family="${POSTER_FONT_FAMILY}">${element}</text>`.trim();
    });

    return `
  <rect x="${cx - 206}" y="${cy - 206}" width="412" height="412" rx="64" ry="64" fill="url(#bazi-card)" stroke="#FFFFFF" stroke-width="3" filter="url(#card-shadow)" />
  <circle cx="${cx}" cy="${cy}" r="158" fill="none" stroke="#D6C2A0" stroke-width="2" stroke-opacity="0.8" />
  <circle cx="${cx}" cy="${cy}" r="104" fill="none" stroke="#B7CDB8" stroke-width="2" stroke-opacity="0.66" />
  <path d="M${cx - 152} ${cy} C ${cx - 64} ${cy - 94}, ${cx + 80} ${cy - 94}, ${cx + 152} ${cy}" fill="none" stroke="#C3934D" stroke-opacity="0.24" stroke-width="4" />
  ${points.join('')}
  <circle cx="${cx}" cy="${cy}" r="76" fill="url(#bazi-ink)" />
  <circle cx="${cx}" cy="${cy}" r="96" fill="${visual.palette.main}" fill-opacity="0.12" />
  <text x="${cx}" y="${cy - 10}" text-anchor="middle" font-size="32" font-weight="620" fill="#FFFFFF" font-family="${POSTER_FONT_FAMILY}">日主</text>
  <text x="${cx}" y="${cy + 48}" text-anchor="middle" font-size="70" font-weight="760" fill="#FFFFFF" font-family="${POSTER_FONT_FAMILY}">${visual.dayMaster}</text>`.trim();
  }

  private renderBaziInfoCards(
    visual: ReturnType<PosterRendererService['resolveBaziPosterVisual']>,
  ) {
    const cards = [
      { label: '日主', value: `${visual.dayMaster}日`, hint: '自我启动方式' },
      { label: '主轴', value: `${visual.dominant}势`, hint: '当前更容易发力' },
      { label: '补位', value: `${visual.support}行`, hint: '需要温柔照顾' },
    ];

    return cards
      .map((card, index) => {
        const width = 304;
        const gap = 22;
        const x = 64 + index * (width + gap);
        const y = 704;
        return `
  <rect x="${x}" y="${y}" width="${width}" height="182" rx="28" ry="28" fill="#FFFFFF" fill-opacity="0.82" stroke="#FFFFFF" stroke-width="2" filter="url(#card-shadow)" />
  <text x="${x + 28}" y="${y + 52}" font-size="26" font-weight="620" fill="#7B887F" font-family="${POSTER_FONT_FAMILY}">${card.label}</text>
  <text x="${x + 28}" y="${y + 116}" font-size="44" font-weight="760" fill="#263B37" font-family="${POSTER_FONT_FAMILY}">${card.value}</text>
  <text x="${x + 28}" y="${y + 152}" font-size="23" fill="#8A948C" font-family="${POSTER_FONT_FAMILY}">${card.hint}</text>`.trim();
      })
      .join('');
  }

  private renderBaziTags(
    chips: string[],
    visual: ReturnType<PosterRendererService['resolveBaziPosterVisual']>,
  ) {
    const normalized = (
      chips.length
        ? chips
        : [`${visual.dominant}主轴`, `${visual.support}补位`, '顺势安排']
    ).slice(0, 3);

    return normalized
      .map((chip, index) => {
        const width = 304;
        const gap = 18;
        const x = 64 + index * (width + gap);
        const y = 918;
        return `
  <rect x="${x}" y="${y}" width="${width}" height="82" rx="40" ry="40" fill="${index === 0 ? visual.palette.pale : '#F7FAF5'}" stroke="#FFFFFF" stroke-width="2" filter="url(#card-shadow)" />
  <circle cx="${x + 74}" cy="${y + 41}" r="20" fill="${index === 0 ? visual.palette.main : '#C3934D'}" fill-opacity="0.86" />
  <text x="${x + 160}" y="${y + 53}" text-anchor="middle" font-size="29" font-weight="720" fill="${index === 0 ? visual.palette.text : '#7A6139'}" font-family="${POSTER_FONT_FAMILY}">${this.escapeXml(
    chip,
  )}</text>`.trim();
      })
      .join('');
  }

  private renderBaziTexture() {
    return `
  <path d="M162 158 C 242 110, 340 118, 412 178" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-opacity="0.58" />
  <path d="M742 74 C 830 116, 900 184, 1022 152" fill="none" stroke="#B7CDB8" stroke-width="3" stroke-opacity="0.45" />
  <path d="M180 488 C 292 436, 406 448, 520 526" fill="none" stroke="#C3934D" stroke-width="2" stroke-opacity="0.18" />
  <circle cx="958" cy="488" r="44" fill="#B7CDB8" fill-opacity="0.16" />
  <circle cx="164" cy="534" r="28" fill="#C3934D" fill-opacity="0.14" />
  <path d="M954 92 L 960 104 L 972 110 L 960 116 L 954 128 L 948 116 L 936 110 L 948 104 Z" fill="#C3934D" fill-opacity="0.58" />
  <path d="M506 128 L 512 140 L 524 146 L 512 152 L 506 164 L 500 152 L 488 146 L 500 140 Z" fill="#B7CDB8" fill-opacity="0.72" />`.trim();
  }

  private renderBaziMountainMark() {
    return `
  <circle cx="188" cy="1136" r="82" fill="#C3934D" fill-opacity="0.18" />
  <path d="M96 1192 L158 1092 L214 1164 L244 1128 L310 1192 Z" fill="#486D5B" fill-opacity="0.56" />
  <path d="M158 1092 L178 1148 L146 1128 Z" fill="#FFFFFF" fill-opacity="0.54" />
  <path d="M214 1164 L232 1184 L190 1184 Z" fill="#C3934D" fill-opacity="0.34" />
  <circle cx="188" cy="1136" r="44" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-opacity="0.78" />`.trim();
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
    return this.splitText(text, maxChars)
      .map(
        (line, index) =>
          `<tspan x="${x}" dy="${index === 0 ? firstDy : nextDy}">${this.escapeXml(
            line,
          )}</tspan>`,
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
