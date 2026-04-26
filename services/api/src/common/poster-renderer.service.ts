import { Injectable } from '@nestjs/common';
import sharp from 'sharp';

const POSTER_FONT_FAMILY =
  'Noto Sans CJK SC, Noto Sans SC, PingFang SC, Microsoft YaHei, Arial, sans-serif';

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
};

export type PosterLayout = {
  size: '1280x1280' | '1088x1472';
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
    const size =
      requestedSize ??
      (sourceType === 'today_index' || sourceType === 'zodiac_today'
        ? '1088x1472'
        : '1280x1280');

    if (size === '1088x1472') {
      return {
        size,
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
      layout.kind === 'portrait'
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

  async renderWallpaper(input: WallpaperRenderInput): Promise<RenderedPosterImage> {
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

  private buildSharePosterSvg(source: PosterRenderSource, backgroundDataUrl: string | null) {
    const [colorA, colorB, colorC] = this.resolveThemePalette(source.themeName);
    const titleLines = this.renderTextTspans(source.title, 12, 0, 74, 640);
    const subtitleLines = this.renderTextTspans(source.subtitle, 22, 0, 44, 520);
    const accentLines = this.renderTextTspans(source.accentText, 26, 0, 38, 460);
    const footerLines = this.renderTextTspans(source.footerText, 32, 0, 34, 540);
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
    const accentLines = this.renderTextTspans(source.accentText, 16, 0, 38, 118);
    const summaryLines = this.renderTextTspans(source.summary, 17, 0, 36, 120);
    const footerLines = this.renderTextTspans(source.footerText, 22, 0, 32, 148);
    const highlightTitle = this.escapeXml(source.highlightTitle ?? '今日提示');
    const metricBlocks = this.renderMetricBlocks(source.metrics, 120, 620, 848, 184);
    const chipBlocks = this.renderChipBlocks(source.chips.slice(0, 5), 120, 530, 848);
    const highlightBlocks = this.renderHighlightBlocks(
      source.highlightLines,
      160,
      1210,
      768,
      44,
    );
    const backgroundLayer = backgroundDataUrl
      ? `<image href="${backgroundDataUrl}" x="0" y="0" width="${layout.width}" height="${layout.height}" preserveAspectRatio="xMidYMid slice" />`
      : this.buildAbstractBackground(layout.width, layout.height, colorA, colorB, colorC);

    return `
<svg xmlns="http://www.w3.org/2000/svg" width="${layout.width}" height="${layout.height}" viewBox="0 0 ${layout.width} ${layout.height}">
  <defs>
    <linearGradient id="today-overlay" x1="0%" x2="100%" y1="0%" y2="100%">
      <stop offset="0%" stop-color="#07111d" stop-opacity="0.54" />
      <stop offset="48%" stop-color="${colorB}" stop-opacity="0.1" />
      <stop offset="100%" stop-color="#07111d" stop-opacity="0.68" />
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
  <rect x="44" y="44" width="1000" height="1384" rx="58" ry="58" fill="none" stroke="#ffffff" stroke-opacity="0.34" />
  <text x="88" y="132" font-size="26" letter-spacing="6" fill="#f1f7ff" font-family="${POSTER_FONT_FAMILY}" filter="url(#soft-text-shadow)">${this.escapeXml(
    source.eyebrowText,
  )}</text>
  <text x="88" y="238" font-size="72" font-weight="760" fill="#ffffff" font-family="${POSTER_FONT_FAMILY}" filter="url(#soft-text-shadow)">${titleLines}</text>
  <text x="88" y="382" font-size="30" fill="#f8fbff" fill-opacity="0.96" font-family="${POSTER_FONT_FAMILY}" filter="url(#soft-text-shadow)">${subtitleLines}</text>
  <rect x="88" y="434" width="912" height="74" rx="28" ry="28" fill="#06111d" fill-opacity="0.26" stroke="#ffffff" stroke-opacity="0.16" />
  <text x="118" y="482" font-size="28" fill="#ffffff" fill-opacity="0.98" font-family="${POSTER_FONT_FAMILY}">${accentLines}</text>
  ${chipBlocks}
  ${metricBlocks}
  <rect x="120" y="862" width="848" height="204" rx="34" ry="34" fill="url(#today-card)" stroke="#ffffff" stroke-opacity="0.2" />
  <text x="120" y="924" font-size="26" letter-spacing="3" fill="#eaf4ff" font-family="${POSTER_FONT_FAMILY}">TODAY SUMMARY</text>
  <text x="120" y="984" font-size="32" fill="#ffffff" fill-opacity="0.98" font-family="${POSTER_FONT_FAMILY}">${summaryLines}</text>
  <rect x="120" y="1098" width="848" height="216" rx="34" ry="34" fill="#06111d" fill-opacity="0.24" stroke="#ffffff" stroke-opacity="0.2" />
  <text x="160" y="1160" font-size="28" fill="#fefefe" font-family="${POSTER_FONT_FAMILY}">${highlightTitle}</text>
  ${highlightBlocks}
  <rect x="120" y="1332" width="848" height="80" rx="26" ry="26" fill="#06111d" fill-opacity="0.28" />
  <text x="148" y="1384" font-size="24" fill="#f7fbff" fill-opacity="0.94" font-family="${POSTER_FONT_FAMILY}">${footerLines}</text>
</svg>`.trim();
  }

  private buildWallpaperSvg(input: WallpaperRenderInput) {
    const { layout, palette } = input;
    const [colorA, colorB, colorC] = palette;
    const titleTspans = this.renderTextTspans(input.title, 13, 0, 74, 84);
    const subtitleTspans = this.renderTextTspans(input.subtitle, 22, 0, 42, 84);
    const guidanceTspans = this.renderTextTspans(input.guidance, 24, 0, 40, 118);
    const chipBlocks = this.renderChipBlocks(input.chips.slice(0, 4), 84, 86, layout.width - 168);
    const backgroundLayer = input.backgroundDataUrl
      ? `<image href="${input.backgroundDataUrl}" x="0" y="0" width="${layout.width}" height="${layout.height}" preserveAspectRatio="xMidYMid slice" />`
      : this.buildAbstractBackground(layout.width, layout.height, colorA, colorB, colorC);
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
    const itemWidth = Math.floor((width - gap * (metrics.length - 1)) / metrics.length);

    return metrics
      .map((metric, index) => {
        const currentX = x + index * (itemWidth + gap);
        const label = this.escapeXml(metric.label);
        const value = this.escapeXml(metric.value);
        const hint = this.renderTextTspans(metric.hint ?? '', 10, 0, 28, currentX + 24);

        return `
  <rect x="${currentX}" y="${y}" width="${itemWidth}" height="${height}" rx="30" ry="30" fill="#06111d" fill-opacity="0.24" stroke="#ffffff" stroke-opacity="0.2" />
  <text x="${currentX + 24}" y="${y + 42}" font-size="22" letter-spacing="3" fill="#f0f7ff" font-family="${POSTER_FONT_FAMILY}">${label}</text>
  <text x="${currentX + 24}" y="${y + 110}" font-size="58" font-weight="700" fill="#ffffff" font-family="${POSTER_FONT_FAMILY}">${value}</text>
  <text x="${currentX + 24}" y="${y + 146}" font-size="20" fill="#ffffff" fill-opacity="0.9" font-family="${POSTER_FONT_FAMILY}">${hint}</text>`.trim();
      })
      .join('');
  }

  private renderChipBlocks(chips: string[], x: number, y: number, width: number) {
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

      parts.push(`
  <rect x="${cursorX}" y="${cursorY}" width="${chipWidth}" height="${lineHeight}" rx="20" ry="20" fill="#06111d" fill-opacity="0.22" stroke="#ffffff" stroke-opacity="0.18" />
  <text x="${cursorX + 18}" y="${cursorY + 33}" font-size="22" fill="#ffffff" fill-opacity="0.96" font-family="${POSTER_FONT_FAMILY}">${label}</text>`.trim());

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
    return sharp(Buffer.from(templateMarkup)).png({ compressionLevel: 9 }).toBuffer();
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
