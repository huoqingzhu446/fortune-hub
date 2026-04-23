import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'node:crypto';
import { Repository } from 'typeorm';
import { FortuneContentEntity } from '../database/entities/fortune-content.entity';
import { ReportTemplateEntity } from '../database/entities/report-template.entity';
import { ShareRecordEntity } from '../database/entities/share-record.entity';
import { UserEntity } from '../database/entities/user.entity';
import { ReportsService } from '../reports/reports.service';
import { GeneratePosterDto } from './dto/generate-poster.dto';

type PosterSource = {
  sourceType: string;
  sourceCode: string | null;
  recordId: string | null;
  title: string;
  subtitle: string;
  accentText: string;
  footerText: string;
  summary: string;
  promptKeywords: string[];
  themeName: string;
  promptHint: string;
};

type ZhipuImageResponse = {
  data?: Array<{
    url?: string;
    b64_json?: string;
    base64?: string;
  }>;
  error?: {
    message?: string;
  };
};

type PosterBackgroundAsset = {
  provider: string;
  status: string;
  providerImageUrl: string | null;
  backgroundImageDataUrl: string | null;
};

@Injectable()
export class PostersService {
  constructor(
    @InjectRepository(ShareRecordEntity)
    private readonly shareRecordRepository: Repository<ShareRecordEntity>,
    @InjectRepository(FortuneContentEntity)
    private readonly fortuneContentRepository: Repository<FortuneContentEntity>,
    @InjectRepository(ReportTemplateEntity)
    private readonly reportTemplateRepository: Repository<ReportTemplateEntity>,
    private readonly reportsService: ReportsService,
    private readonly configService: ConfigService,
  ) {}

  async generatePoster(dto: GeneratePosterDto, user: UserEntity | null) {
    const source = await this.resolvePosterSource(dto, user);
    const zhipuKey = this.configService.get<string>('ZHIPU_API_KEY');
    const size = dto.size ?? '1280x1280';
    const providerPrompt = this.buildProviderPrompt(source);
    const backgroundAsset = await this.resolvePosterBackground(
      zhipuKey,
      providerPrompt,
      size,
    );
    const svgMarkup = this.buildPosterSvg(
      source,
      backgroundAsset.backgroundImageDataUrl,
    );
    const posterId = `poster_${randomBytes(10).toString('hex')}`;
    const payload = {
      posterId,
      title: source.title,
      subtitle: source.subtitle,
      accentText: source.accentText,
      footerText: source.footerText,
      themeName: source.themeName,
      providerImageUrl: backgroundAsset.providerImageUrl,
      providerPrompt,
      downloadFileName: `fortune-hub-${this.slugify(source.title)}-poster.svg`,
      generatedAt: new Date().toISOString(),
      format: 'svg',
      svgMarkup,
      imageDataUrl: `data:image/svg+xml;base64,${Buffer.from(svgMarkup).toString('base64')}`,
    };

    await this.shareRecordRepository.save(
      this.shareRecordRepository.create({
        posterId,
        userId: user?.id ?? null,
        recordId: source.recordId,
        sourceType: source.sourceType,
        sourceCode: source.sourceCode,
        posterTitle: source.title,
        provider: backgroundAsset.provider,
        status: backgroundAsset.status,
        prompt: providerPrompt,
        payloadJson: payload,
      }),
    );

    return {
      code: 0,
      message: 'ok',
      data: {
        poster: payload,
      },
      timestamp: new Date().toISOString(),
    };
  }

  async getPoster(posterId: string, user: UserEntity | null) {
    const poster = await this.shareRecordRepository.findOne({
      where: {
        posterId,
      },
    });

    if (!poster) {
      throw new NotFoundException('海报不存在');
    }

    if (poster.userId && user?.id !== poster.userId) {
      throw new NotFoundException('海报不存在或无权访问');
    }

    return {
      code: 0,
      message: 'ok',
      data: {
        poster: poster.payloadJson,
      },
      timestamp: new Date().toISOString(),
    };
  }

  private async resolvePosterSource(dto: GeneratePosterDto, user: UserEntity | null): Promise<PosterSource> {
    if (dto.recordId) {
      if (!user) {
        throw new BadRequestException('请先登录后再生成结果海报');
      }

      const record = await this.reportsService.getOwnedRecordOrThrow(dto.recordId, user.id);
      const report = await this.reportsService.buildReportPayload(record, user);

      return {
        sourceType: record.recordType,
        sourceCode: record.sourceCode,
        recordId: record.id,
        title: report.sharePoster.title,
        subtitle: report.sharePoster.subtitle,
        accentText: report.sharePoster.accentText,
        footerText: report.sharePoster.footerText,
        summary: report.summary,
        promptKeywords: [
          report.recordType,
          report.title,
          report.sharePoster.themeName,
          report.sharePoster.accentText,
        ],
        themeName: report.sharePoster.themeName,
        promptHint: '',
      };
    }

    if (dto.sourceType === 'lucky_sign' && dto.bizCode) {
      const sign = await this.fortuneContentRepository.findOne({
        where: {
          contentType: 'lucky_sign',
          bizCode: dto.bizCode,
          status: 'published',
        },
        order: {
          id: 'DESC',
        },
      });

      if (!sign) {
        throw new NotFoundException('幸运签不存在');
      }

      const content = this.asRecord(sign.contentJson);
      const signTag = this.pickString(content.tag, '今日幸运签');
      const template = await this.resolveTemplatePayload('share_poster', 'lucky_sign');
      const fallbackSubtitle = this.pickString(
        template.subtitle,
        `${signTag} · ${sign.summary ?? '今天适合顺势推进。'}`,
      );
      const fallbackAccentText = this.pickString(
        template.accentText,
        this.pickString(content.mantra, '先稳住节奏，再把今天推顺。'),
      );
      const fallbackFooterText = this.pickString(
        template.footerText,
        'Fortune Hub · 今日幸运签',
      );

      return {
        sourceType: 'lucky_sign',
        sourceCode: sign.bizCode,
        recordId: null,
        title: this.pickString(
          this.asRecord(content.sharePoster).title,
          this.pickString(template.title, sign.title),
        ),
        subtitle: this.pickString(
          this.asRecord(content.sharePoster).subtitle,
          fallbackSubtitle,
        ),
        accentText: this.pickString(
          this.asRecord(content.sharePoster).accentText,
          fallbackAccentText,
        ),
        footerText: this.pickString(
          this.asRecord(content.sharePoster).footerText,
          fallbackFooterText,
        ),
        summary: sign.summary ?? '今天适合顺势推进。',
        promptKeywords: [sign.title, signTag, sign.summary ?? '幸运签'],
        themeName: this.pickString(
          this.asRecord(content.sharePoster).themeName,
          this.pickString(template.themeName, 'fresh-mint'),
        ),
        promptHint: this.pickString(template.backgroundHint, ''),
      };
    }

    throw new BadRequestException('海报生成参数不完整');
  }

  private buildProviderPrompt(source: PosterSource) {
    const templateHint = this.resolvePosterPromptHint(source.sourceType);

    return [
      '微信分享海报背景插画，现代东方气质，清透高级，适合内容类产品分享。',
      `主题：${source.themeName}。`,
      `关键词：${source.promptKeywords.join('、')}。`,
      this.pickString(source.promptHint, templateHint)
        ? `额外风格要求：${this.pickString(source.promptHint, templateHint)}。`
        : '',
      '画面需要有大面积留白，适合后续叠加中文标题和说明文案。',
      '不要出现任何文字、logo、水印、人物脸部特写。',
      '整体要有层次感、柔和渐变、半透明玻璃质感和轻微光晕。',
    ]
      .filter(Boolean)
      .join(' ');
  }

  private resolvePosterPromptHint(sourceType: string) {
    // Keep it sync and lightweight: fall back safely when no template is configured.
    return '';
  }

  private async resolveTemplatePayload(templateType: string, bizCode: string) {
    const template = await this.reportTemplateRepository.findOne({
      where: {
        templateType,
        bizCode,
        status: 'published',
      },
      order: {
        sortOrder: 'ASC',
        updatedAt: 'DESC',
      },
    });

    return this.asRecord(template?.payloadJson);
  }

  private async generateBackgroundWithZhipu(apiKey: string, prompt: string, size: string) {
    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/images/generations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'glm-image',
        prompt,
        size,
      }),
    });

    const payload = (await response.json()) as ZhipuImageResponse;

    if (!response.ok || !payload.data?.length) {
      throw new BadGatewayException(
        payload.error?.message || '智普海报背景生成失败，请稍后再试',
      );
    }

    return payload.data[0];
  }

  private async resolvePosterBackground(
    apiKey: string | undefined,
    prompt: string,
    size: string,
  ): Promise<PosterBackgroundAsset> {
    if (!apiKey) {
      return {
        provider: 'builtin',
        status: 'fallback',
        providerImageUrl: null,
        backgroundImageDataUrl: null,
      };
    }

    try {
      const providerImage = await this.generateBackgroundWithZhipu(
        apiKey,
        prompt,
        size,
      );
      const backgroundImageDataUrl = await this.resolveProviderImageDataUrl(
        providerImage,
      );

      return {
        provider: 'zhipu',
        status: 'generated',
        providerImageUrl: providerImage.url ?? null,
        backgroundImageDataUrl,
      };
    } catch (error) {
      console.warn('poster background fallback to builtin', error);

      return {
        provider: 'builtin',
        status: 'fallback',
        providerImageUrl: null,
        backgroundImageDataUrl: null,
      };
    }
  }

  private async resolveProviderImageDataUrl(image: {
    url?: string;
    b64_json?: string;
    base64?: string;
  }) {
    if (image.b64_json) {
      return `data:image/png;base64,${image.b64_json}`;
    }

    if (image.base64) {
      return `data:image/png;base64,${image.base64}`;
    }

    if (!image.url) {
      throw new BadGatewayException('智普返回的图片地址无效');
    }

    try {
      const response = await fetch(image.url);
      const mimeType = response.headers.get('content-type') || 'image/png';
      const buffer = Buffer.from(await response.arrayBuffer());
      return `data:${mimeType};base64,${buffer.toString('base64')}`;
    } catch {
      return image.url;
    }
  }

  private buildPosterSvg(source: PosterSource, backgroundDataUrl: string | null) {
    const palette = this.resolveThemePalette(source.themeName);
    const [colorA, colorB, colorC] = palette;
    const titleLines = this.renderTextTspans(source.title, 12, 0, 74, 640);
    const subtitleLines = this.renderTextTspans(source.subtitle, 22, 0, 44, 520);
    const accentLines = this.renderTextTspans(source.accentText, 26, 0, 38, 460);
    const footerLines = this.renderTextTspans(source.footerText, 32, 0, 34, 540);
    const backgroundLayer = backgroundDataUrl
      ? `<image href="${backgroundDataUrl}" x="0" y="0" width="1280" height="1280" preserveAspectRatio="xMidYMid slice" />`
      : `
  <rect x="0" y="0" width="1280" height="1280" fill="${colorB}" />
  <circle cx="192" cy="220" r="220" fill="${colorA}" fill-opacity="0.34" />
  <circle cx="1100" cy="250" r="280" fill="${colorC}" fill-opacity="0.18" />
  <circle cx="980" cy="1020" r="300" fill="${colorA}" fill-opacity="0.18" />
  <circle cx="360" cy="980" r="240" fill="#ffffff" fill-opacity="0.12" />`.trim();

    return `
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="1280" viewBox="0 0 1280 1280">
  <defs>
    <linearGradient id="overlay" x1="0%" x2="100%" y1="0%" y2="100%">
      <stop offset="0%" stop-color="${colorA}" stop-opacity="0.82" />
      <stop offset="55%" stop-color="${colorB}" stop-opacity="0.48" />
      <stop offset="100%" stop-color="${colorC}" stop-opacity="0.72" />
    </linearGradient>
  </defs>
  ${backgroundLayer}
  <rect x="0" y="0" width="1280" height="1280" fill="url(#overlay)" />
  <circle cx="190" cy="170" r="190" fill="#ffffff" fill-opacity="0.24" />
  <circle cx="1060" cy="220" r="230" fill="#ffffff" fill-opacity="0.14" />
  <circle cx="980" cy="1060" r="260" fill="#ffffff" fill-opacity="0.16" />
  <rect x="84" y="84" width="1112" height="1112" rx="54" ry="54" fill="#0d1b27" fill-opacity="0.16" stroke="#ffffff" stroke-opacity="0.38" />
  <rect x="116" y="116" width="1048" height="1048" rx="44" ry="44" fill="#ffffff" fill-opacity="0.18" />
  <text x="152" y="200" font-size="30" letter-spacing="7" fill="#eff5fb" font-family="SF Pro Display, PingFang SC, sans-serif">FORTUNE HUB SHARE POSTER</text>
  <text x="152" y="360" font-size="84" font-weight="700" fill="#ffffff" font-family="SF Pro Display, PingFang SC, sans-serif">${titleLines}</text>
  <text x="152" y="560" font-size="34" fill="#ffffff" fill-opacity="0.94" font-family="SF Pro Text, PingFang SC, sans-serif">${subtitleLines}</text>
  <rect x="152" y="658" width="976" height="186" rx="34" ry="34" fill="#ffffff" fill-opacity="0.24" stroke="#ffffff" stroke-opacity="0.22" />
  <text x="188" y="724" font-size="30" fill="#fefefe" font-family="SF Pro Text, PingFang SC, sans-serif">${accentLines}</text>
  <rect x="152" y="928" width="976" height="148" rx="30" ry="30" fill="#0a1019" fill-opacity="0.18" />
  <text x="188" y="992" font-size="24" fill="#f7fbff" font-family="SF Pro Text, PingFang SC, sans-serif">${footerLines}</text>
  <text x="152" y="1136" font-size="24" fill="#ffffff" fill-opacity="0.88" font-family="SF Pro Display, PingFang SC, sans-serif">Generated by Fortune Hub</text>
</svg>`.trim();
  }

  private resolveThemePalette(themeName: string) {
    if (themeName.includes('amber') || themeName.includes('gold')) {
      return ['#e8b15b', '#f6d8a2', '#8b5f2a'];
    }

    if (themeName.includes('mint')) {
      return ['#8fd5bf', '#d6f5ee', '#4e8f7c'];
    }

    return ['#7aa8ff', '#dfe9ff', '#435c98'];
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

    return lines;
  }

  private escapeXml(value: string) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private slugify(value: string) {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/gi, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48);
  }

  private pickString(value: unknown, fallback: string) {
    return typeof value === 'string' && value.trim() ? value.trim() : fallback;
  }

  private asRecord(value: unknown) {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  }
}
