import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'node:crypto';
import sharp from 'sharp';
import { Repository } from 'typeorm';
import { ZhipuImageService } from '../common/zhipu-image.service';
import { FortuneContentEntity } from '../database/entities/fortune-content.entity';
import { ReportTemplateEntity } from '../database/entities/report-template.entity';
import { PosterJobEntity } from '../database/entities/poster-job.entity';
import { ShareRecordEntity } from '../database/entities/share-record.entity';
import { UserEntity } from '../database/entities/user.entity';
import { LuckyService } from '../lucky/lucky.service';
import { ReportsService } from '../reports/reports.service';
import { ZodiacService } from '../zodiac/zodiac.service';
import { GeneratePosterDto } from './dto/generate-poster.dto';

type PosterMetric = {
  label: string;
  value: string;
  hint?: string;
};

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
  eyebrowText: string;
  chips: string[];
  metrics: PosterMetric[];
  highlightTitle?: string;
  highlightLines: string[];
};

type PosterBackgroundAsset = {
  provider: string;
  status: string;
  providerImageUrl: string | null;
  backgroundImageDataUrl: string | null;
  providerRequestId?: string | null;
  providerError?: string | null;
};

type PosterLayout = {
  size: '1280x1280' | '1088x1472';
  width: number;
  height: number;
  kind: 'square' | 'portrait';
};

@Injectable()
export class PostersService {
  constructor(
    @InjectRepository(ShareRecordEntity)
    private readonly shareRecordRepository: Repository<ShareRecordEntity>,
    @InjectRepository(PosterJobEntity)
    private readonly posterJobRepository: Repository<PosterJobEntity>,
    @InjectRepository(FortuneContentEntity)
    private readonly fortuneContentRepository: Repository<FortuneContentEntity>,
    @InjectRepository(ReportTemplateEntity)
    private readonly reportTemplateRepository: Repository<ReportTemplateEntity>,
    private readonly reportsService: ReportsService,
    private readonly luckyService: LuckyService,
    private readonly zodiacService: ZodiacService,
    private readonly configService: ConfigService,
    private readonly zhipuImageService: ZhipuImageService,
  ) {}

  async generatePoster(dto: GeneratePosterDto, user: UserEntity | null) {
    const source = await this.resolvePosterSource(dto, user);
    const zhipuKey = this.configService.get<string>('ZHIPU_API_KEY');
    const layout = this.resolvePosterLayout(dto.size, source.sourceType);
    const providerPrompt = this.buildProviderPrompt(source);
    const backgroundAsset = await this.resolvePosterBackground(
      zhipuKey,
      providerPrompt,
      layout.size,
    );
    let svgMarkup =
      layout.kind === 'portrait'
        ? this.buildTodayIndexPosterSvg(
            source,
            backgroundAsset.backgroundImageDataUrl,
            layout,
          )
        : this.buildPosterSvg(source, backgroundAsset.backgroundImageDataUrl);
    let imageBuffer: Buffer;

    try {
      imageBuffer = await this.renderPosterPng(svgMarkup);
    } catch (error) {
      console.warn('poster png render fallback to builtin background', error);
      svgMarkup =
        layout.kind === 'portrait'
          ? this.buildTodayIndexPosterSvg(source, null, layout)
          : this.buildPosterSvg(source, null);
      imageBuffer = await this.renderPosterPng(svgMarkup);
    }
    const posterId = `poster_${randomBytes(10).toString('hex')}`;
    const fileUrl = await this.persistPosterFile(
      imageBuffer,
      `fortune-hub-${this.slugify(source.title)}-poster.png`,
    );
    const payload = {
      posterId,
      sourceType: source.sourceType,
      title: source.title,
      subtitle: source.subtitle,
      accentText: source.accentText,
      footerText: source.footerText,
      themeName: source.themeName,
      providerImageUrl: backgroundAsset.providerImageUrl,
      providerRequestId: backgroundAsset.providerRequestId ?? null,
      providerError: backgroundAsset.providerError ?? null,
      providerPrompt,
      width: layout.width,
      height: layout.height,
      size: layout.size,
      downloadFileName: `fortune-hub-${this.slugify(source.title)}-poster.png`,
      generatedAt: new Date().toISOString(),
      format: 'png',
      svgMarkup,
      imageDataUrl: `data:image/png;base64,${imageBuffer.toString('base64')}`,
      fileUrl,
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
        fileUrl,
        storageProvider: fileUrl ? 'file-service' : 'inline',
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

  async createPosterJob(dto: GeneratePosterDto, user: UserEntity | null) {
    const job = await this.posterJobRepository.save(
      this.posterJobRepository.create({
        jobId: `poster_job_${randomBytes(10).toString('hex')}`,
        userId: user?.id ?? null,
        jobType: dto.recordId ? 'report_poster' : dto.sourceType ?? 'poster',
        status: 'queued',
        requestJson: dto as Record<string, unknown>,
        resultJson: null,
        fileUrl: null,
        errorMessage: null,
        startedAt: null,
        finishedAt: null,
      }),
    );

    void this.processPosterJob(job.jobId, user).catch((error) => {
      console.warn('poster job failed', error);
    });

    return {
      code: 0,
      message: 'ok',
      data: {
        job: this.serializeJob(job),
      },
      timestamp: new Date().toISOString(),
    };
  }

  async getPosterJob(jobId: string, user: UserEntity | null) {
    const job = await this.posterJobRepository.findOne({
      where: { jobId },
    });

    if (!job || (job.userId && job.userId !== user?.id)) {
      throw new NotFoundException('海报任务不存在或无权访问');
    }

    return {
      code: 0,
      message: 'ok',
      data: {
        job: this.serializeJob(job),
      },
      timestamp: new Date().toISOString(),
    };
  }

  private async processPosterJob(jobId: string, user: UserEntity | null) {
    const job = await this.posterJobRepository.findOne({ where: { jobId } });

    if (!job) {
      return;
    }

    job.status = 'processing';
    job.startedAt = new Date();
    await this.posterJobRepository.save(job);

    try {
      const response = await this.generatePoster(job.requestJson as GeneratePosterDto, user);
      const poster = response.data.poster as Record<string, unknown>;
      job.status = 'completed';
      job.resultJson = poster;
      job.fileUrl = typeof poster.fileUrl === 'string' ? poster.fileUrl : null;
      job.finishedAt = new Date();
      job.errorMessage = null;
    } catch (error) {
      job.status = 'failed';
      job.errorMessage = error instanceof Error ? error.message : '海报生成失败';
      job.finishedAt = new Date();
    }

    await this.posterJobRepository.save(job);
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
        eyebrowText: 'FORTUNE HUB SHARE POSTER',
        chips: [],
        metrics: [],
        highlightLines: [],
      };
    }

    if (dto.sourceType === 'today_index') {
      if (!user) {
        throw new BadRequestException('请先登录后再生成今日分享图');
      }

      if (!user.birthday || !user.zodiac) {
        throw new BadRequestException('请先完善生日资料后再生成今日分享图');
      }

      return this.buildTodayIndexPosterSource(user);
    }

    if (dto.sourceType === 'zodiac_today') {
      const zodiac = this.pickString(dto.bizCode, user?.zodiac ?? '');

      if (!zodiac) {
        throw new BadRequestException('请先选择星座后再生成星座分享图');
      }

      return this.buildZodiacTodayPosterSource(zodiac);
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
        eyebrowText: 'FORTUNE HUB SHARE POSTER',
        chips: [],
        metrics: [],
        highlightLines: [],
      };
    }

    throw new BadRequestException('海报生成参数不完整');
  }

  private async buildTodayIndexPosterSource(user: UserEntity): Promise<PosterSource> {
    const luckyToday = await this.luckyService.getToday(user);
    const luckyData = luckyToday.data;
    const primaryRecommendation = luckyData.recommendations[0] ?? null;
    const dominantElement = this.pickString(
      luckyData.profile.dominantElement,
      this.resolveDominantElementFromUser(user),
    );
    const subjectName = this.pickString(user.nickname ?? '', user.zodiac ?? '今日');
    const shortBaziSummary = this.truncateText(
      this.pickString(
        user.baziSummary ?? '',
        `${dominantElement}元素较强，今天适合稳住节奏后再推进重点事项。`,
      ),
      34,
    );
    const highlightLines = [
      shortBaziSummary,
      primaryRecommendation?.supportiveFocus ?? luckyData.profile.guidance,
      ...luckyData.actionTips.slice(0, 2),
    ].filter((item, index, array) => Boolean(item) && array.indexOf(item) === index);

    return {
      sourceType: 'today_index',
      sourceCode: this.getTodaySourceCode(),
      recordId: null,
      title: `${subjectName}的今日用户指数`,
      subtitle: this.truncateText(
        `${user.zodiac} · ${dominantElement}元素主导 · ${shortBaziSummary}`,
        48,
      ),
      accentText: `${luckyData.sign.tag} · ${this.truncateText(luckyData.sign.mantra, 22)}`,
      footerText: `今日幸运指数 ${luckyData.scores.today.value} · 年度走势 ${luckyData.scores.annual.value}`,
      summary: this.truncateText(
        primaryRecommendation?.highlight ?? luckyData.sign.summary,
        36,
      ),
      promptKeywords: [
        user.zodiac ?? '',
        dominantElement,
        luckyData.sign.tag,
        primaryRecommendation?.title ?? '',
        primaryRecommendation?.category ?? '',
        '星座气运',
        '五行能量',
        '社交分享海报',
      ].filter(Boolean),
      themeName: this.resolveTodayIndexThemeName(dominantElement),
      promptHint: `竖版社交分享图，现代东方气质，结合${user.zodiac}、${dominantElement}元素与轻灵能量流线，适合叠加指数卡片、标签和两到三条行动提示，画面丰富但不要拥挤。`,
      eyebrowText: 'TODAY FORTUNE INDEX',
      chips: [
        `${user.zodiac}运势`,
        `${dominantElement}元素`,
        luckyData.sign.tag,
        primaryRecommendation?.title ?? '今日好运提示',
        user.birthTime ? `${user.birthTime} 出生` : '未填写出生时辰',
      ],
      metrics: [
        {
          label: luckyData.scores.today.label,
          value: luckyData.scores.today.value,
          hint: luckyData.scores.today.hint,
        },
        {
          label: luckyData.scores.annual.label,
          value: luckyData.scores.annual.value,
          hint: luckyData.scores.annual.hint,
        },
        {
          label: '今日重点',
          value: this.truncateText(primaryRecommendation?.title ?? `${dominantElement}能量`, 8),
          hint: this.truncateText(
            primaryRecommendation?.supportiveFocus ?? luckyData.profile.guidance,
            22,
          ),
        },
      ],
      highlightTitle: '今天更适合',
      highlightLines: highlightLines.slice(0, 3).map((item) => this.truncateText(item, 28)),
    };
  }

  private async buildZodiacTodayPosterSource(zodiac: string): Promise<PosterSource> {
    const response = await this.zodiacService.getTodayFortune(zodiac);
    const data = response.data;
    const topDimensions = [...data.dimensions]
      .sort((left, right) => right.score - left.score)
      .slice(0, 3);
    const sharePoster = data.sharePoster;

    return {
      sourceType: 'zodiac_today',
      sourceCode: data.zodiac,
      recordId: null,
      title: this.truncateText(sharePoster.title, 18),
      subtitle: this.truncateText(sharePoster.subtitle, 42),
      accentText: this.truncateText(sharePoster.accentText, 24),
      footerText: this.truncateText(sharePoster.footerText, 42),
      summary: this.truncateText(data.theme.summary, 40),
      promptKeywords: [
        data.zodiac,
        data.profile.element,
        data.profile.modality,
        data.theme.title,
        data.action.title,
        data.lucky.color,
        '星座今日气运',
        '星轨',
      ],
      themeName: sharePoster.themeName,
      promptHint: `竖版星座气运分享图，突出${data.zodiac}、今日指数${data.score.overall}和行动签，适合叠加四象限指数与时间节奏。`,
      eyebrowText: 'ZODIAC TODAY',
      chips: [
        `${data.zodiac}`,
        `今日 ${data.score.overall}`,
        data.lucky.color,
        data.lucky.item,
        data.compatibility.bestMatch,
      ],
      metrics: topDimensions.map((item) => ({
        label: item.label,
        value: String(item.score),
        hint: this.truncateText(item.title, 12),
      })),
      highlightTitle: '今日行动签',
      highlightLines: [
        data.action.title,
        data.action.description,
        data.dayparts[0]?.hint ?? '',
      ]
        .filter(Boolean)
        .slice(0, 3)
        .map((item) => this.truncateText(item, 28)),
    };
  }

  private buildProviderPrompt(source: PosterSource) {
    if (source.sourceType === 'today_index' || source.sourceType === 'zodiac_today') {
      return [
        '微信社交分享图背景插画，竖版海报，现代东方气质，通透高级，适合命理与运势产品分享。',
        `主题：${source.themeName}。`,
        `关键词：${source.promptKeywords.join('、')}。`,
        this.pickString(source.promptHint, this.resolvePosterPromptHint(source.sourceType))
          ? `额外风格要求：${this.pickString(source.promptHint, this.resolvePosterPromptHint(source.sourceType))}。`
          : '',
        '画面层次需要丰富，包含星轨、流光、云雾、五行纹理或抽象山海意象，但不要杂乱。',
        '中上部保留标题区，中部保留 3 个信息卡片位置，下半部保留行动建议区。',
        '不要出现任何文字、logo、水印、二维码和人物脸部特写。',
        '整体偏封面感、治愈感、轻奢感，适合高清保存后分享给微信好友。',
      ]
        .filter(Boolean)
        .join(' ');
    }

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
    if (sourceType === 'today_index') {
      return '竖版分享图，画面要有星轨、流光、轻雾与东方能量纹理，兼顾高级感和社交传播质感。';
    }

    if (sourceType === 'zodiac_today') {
      return '竖版星座分享图，画面要有清晰星轨、星象符号感、透明能量流线和安静留白，适合叠加今日气运指数。';
    }

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
        providerRequestId: null,
        providerError: '未配置 ZHIPU_API_KEY',
      };
    }

    try {
      const providerImage = await this.zhipuImageService.generateImage({
        prompt,
        size,
        purpose: '海报背景',
      });

      return {
        provider: 'zhipu',
        status: 'generated',
        providerImageUrl: providerImage.providerImageUrl,
        backgroundImageDataUrl: providerImage.imageDataUrl,
        providerRequestId: providerImage.requestId,
        providerError: null,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '智谱海报背景生成失败';
      console.warn('poster background fallback to builtin', errorMessage);

      return {
        provider: 'builtin',
        status: 'fallback',
        providerImageUrl: null,
        backgroundImageDataUrl: null,
        providerRequestId: null,
        providerError: errorMessage,
      };
    }
  }

  private async persistPosterFile(imageBuffer: Buffer, fileName: string) {
    const uploadUrl = this.resolveFileServiceUploadUrl();

    if (!uploadUrl) {
      return null;
    }

    const token = this.configService.get<string>('FILE_SERVICE_TOKEN');
    const formData = new FormData();
    const blob = new Blob([new Uint8Array(imageBuffer)], {
      type: 'image/png',
    });

    formData.append('appCode', 'fortune-hub');
    formData.append('bizType', 'share-poster');
    formData.append('visibility', 'public');
    formData.append('file', blob, fileName);

    try {
      const response = await this.fetchWithTimeout(
        uploadUrl,
        {
          method: 'POST',
          headers: token ? { 'x-file-service-token': token } : undefined,
          body: formData,
        },
        12000,
        '海报文件上传超时，已保留内联图片',
      );
      const payload = (await response.json().catch(() => null)) as
        | {
            id?: string;
            contentUrl?: string;
            url?: string;
          }
        | null;

      if (!response.ok) {
        return null;
      }

      return payload?.contentUrl ?? payload?.url ?? null;
    } catch {
      return null;
    }
  }

  private resolveFileServiceUploadUrl() {
    const baseUrl = this.configService.get<string>('FILE_SERVICE_BASE_URL');

    if (!baseUrl) {
      return null;
    }

    const normalized = baseUrl.replace(/\/$/, '');
    return normalized.endsWith('/api')
      ? `${normalized}/files/upload`
      : `${normalized}/api/files/upload`;
  }

  private async fetchWithTimeout(
    input: string,
    init: RequestInit | undefined,
    timeoutMs: number,
    timeoutMessage: string,
  ) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      return await fetch(input, {
        ...(init ?? {}),
        signal: controller.signal,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new BadGatewayException(timeoutMessage);
      }

      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  private serializeJob(job: PosterJobEntity) {
    return {
      jobId: job.jobId,
      userId: job.userId,
      jobType: job.jobType,
      status: job.status,
      request: job.requestJson ?? {},
      result: job.resultJson ?? null,
      fileUrl: job.fileUrl,
      errorMessage: job.errorMessage,
      startedAt: job.startedAt?.toISOString() ?? null,
      finishedAt: job.finishedAt?.toISOString() ?? null,
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
    };
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
  <text x="152" y="200" font-size="30" letter-spacing="7" fill="#eff5fb" font-family="SF Pro Display, PingFang SC, sans-serif">${this.escapeXml(
    source.eyebrowText,
  )}</text>
  <text x="152" y="360" font-size="84" font-weight="700" fill="#ffffff" font-family="SF Pro Display, PingFang SC, sans-serif">${titleLines}</text>
  <text x="152" y="560" font-size="34" fill="#ffffff" fill-opacity="0.94" font-family="SF Pro Text, PingFang SC, sans-serif">${subtitleLines}</text>
  <rect x="152" y="658" width="976" height="186" rx="34" ry="34" fill="#ffffff" fill-opacity="0.24" stroke="#ffffff" stroke-opacity="0.22" />
  <text x="188" y="724" font-size="30" fill="#fefefe" font-family="SF Pro Text, PingFang SC, sans-serif">${accentLines}</text>
  <rect x="152" y="928" width="976" height="148" rx="30" ry="30" fill="#0a1019" fill-opacity="0.18" />
  <text x="188" y="992" font-size="24" fill="#f7fbff" font-family="SF Pro Text, PingFang SC, sans-serif">${footerLines}</text>
  <text x="152" y="1136" font-size="24" fill="#ffffff" fill-opacity="0.88" font-family="SF Pro Display, PingFang SC, sans-serif">Generated by Fortune Hub</text>
</svg>`.trim();
  }

  private buildTodayIndexPosterSvg(
    source: PosterSource,
    backgroundDataUrl: string | null,
    layout: PosterLayout,
  ) {
    const palette = this.resolveThemePalette(source.themeName);
    const [colorA, colorB, colorC] = palette;
    const titleLines = this.renderTextTspans(source.title, 10, 0, 78, 120);
    const subtitleLines = this.renderTextTspans(source.subtitle, 18, 0, 42, 120);
    const accentLines = this.renderTextTspans(source.accentText, 16, 0, 38, 120);
    const summaryLines = this.renderTextTspans(source.summary, 17, 0, 36, 120);
    const footerLines = this.renderTextTspans(source.footerText, 22, 0, 32, 120);
    const highlightTitle = this.escapeXml(source.highlightTitle ?? '今日提示');
    const metricBlocks = this.renderMetricBlocks(source.metrics, 120, 620, 848, 184);
    const chipBlocks = this.renderChipBlocks(source.chips.slice(0, 5), 120, 530, 848);
    const highlightBlocks = this.renderHighlightBlocks(
      source.highlightLines,
      160,
      1140,
      768,
      58,
    );
    const backgroundLayer = backgroundDataUrl
      ? `<image href="${backgroundDataUrl}" x="0" y="0" width="${layout.width}" height="${layout.height}" preserveAspectRatio="xMidYMid slice" />`
      : `
  <rect x="0" y="0" width="${layout.width}" height="${layout.height}" fill="${colorB}" />
  <circle cx="180" cy="200" r="220" fill="${colorA}" fill-opacity="0.34" />
  <circle cx="920" cy="250" r="260" fill="${colorC}" fill-opacity="0.18" />
  <circle cx="860" cy="1280" r="320" fill="${colorA}" fill-opacity="0.18" />
  <circle cx="240" cy="1210" r="250" fill="#ffffff" fill-opacity="0.11" />`.trim();

    return `
<svg xmlns="http://www.w3.org/2000/svg" width="${layout.width}" height="${layout.height}" viewBox="0 0 ${layout.width} ${layout.height}">
  <defs>
    <linearGradient id="today-overlay" x1="0%" x2="100%" y1="0%" y2="100%">
      <stop offset="0%" stop-color="${colorA}" stop-opacity="0.88" />
      <stop offset="56%" stop-color="${colorB}" stop-opacity="0.44" />
      <stop offset="100%" stop-color="${colorC}" stop-opacity="0.78" />
    </linearGradient>
    <linearGradient id="today-card" x1="0%" x2="100%" y1="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.3" />
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.14" />
    </linearGradient>
    <filter id="today-blur">
      <feGaussianBlur stdDeviation="12" />
    </filter>
  </defs>
  ${backgroundLayer}
  <rect x="0" y="0" width="${layout.width}" height="${layout.height}" fill="url(#today-overlay)" />
  <circle cx="164" cy="176" r="160" fill="#ffffff" fill-opacity="0.18" />
  <circle cx="928" cy="144" r="168" fill="#ffffff" fill-opacity="0.14" />
  <circle cx="984" cy="1320" r="210" fill="#ffffff" fill-opacity="0.12" />
  <path d="M108 352 C 248 266, 418 250, 592 322 S 894 424, 996 354" fill="none" stroke="#ffffff" stroke-opacity="0.16" stroke-width="4" />
  <rect x="56" y="56" width="976" height="1360" rx="52" ry="52" fill="#081320" fill-opacity="0.16" stroke="#ffffff" stroke-opacity="0.34" />
  <rect x="84" y="84" width="920" height="1304" rx="42" ry="42" fill="url(#today-card)" />
  <text x="120" y="152" font-size="28" letter-spacing="6" fill="#f1f7ff" font-family="SF Pro Display, PingFang SC, sans-serif">${this.escapeXml(
    source.eyebrowText,
  )}</text>
  <text x="120" y="270" font-size="72" font-weight="700" fill="#ffffff" font-family="SF Pro Display, PingFang SC, sans-serif">${titleLines}</text>
  <text x="120" y="410" font-size="30" fill="#f8fbff" fill-opacity="0.96" font-family="SF Pro Text, PingFang SC, sans-serif">${subtitleLines}</text>
  <rect x="120" y="438" width="848" height="70" rx="24" ry="24" fill="#09121c" fill-opacity="0.16" />
  <text x="120" y="484" font-size="28" fill="#ffffff" fill-opacity="0.98" font-family="SF Pro Text, PingFang SC, sans-serif">${accentLines}</text>
  ${chipBlocks}
  ${metricBlocks}
  <rect x="120" y="862" width="848" height="204" rx="34" ry="34" fill="#0c1724" fill-opacity="0.18" stroke="#ffffff" stroke-opacity="0.18" />
  <text x="120" y="924" font-size="26" letter-spacing="3" fill="#eaf4ff" font-family="SF Pro Display, PingFang SC, sans-serif">TODAY SUMMARY</text>
  <text x="120" y="984" font-size="32" fill="#ffffff" fill-opacity="0.98" font-family="SF Pro Text, PingFang SC, sans-serif">${summaryLines}</text>
  <rect x="120" y="1098" width="848" height="216" rx="34" ry="34" fill="#ffffff" fill-opacity="0.16" stroke="#ffffff" stroke-opacity="0.18" />
  <text x="160" y="1160" font-size="28" fill="#fefefe" font-family="SF Pro Display, PingFang SC, sans-serif">${highlightTitle}</text>
  ${highlightBlocks}
  <rect x="120" y="1332" width="848" height="80" rx="26" ry="26" fill="#08111a" fill-opacity="0.18" />
  <text x="120" y="1384" font-size="24" fill="#f7fbff" fill-opacity="0.94" font-family="SF Pro Text, PingFang SC, sans-serif">${footerLines}</text>
</svg>`.trim();
  }

  private renderMetricBlocks(metrics: PosterMetric[], x: number, y: number, width: number, height: number) {
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
  <rect x="${currentX}" y="${y}" width="${itemWidth}" height="${height}" rx="30" ry="30" fill="#ffffff" fill-opacity="0.18" stroke="#ffffff" stroke-opacity="0.18" />
  <text x="${currentX + 24}" y="${y + 42}" font-size="22" letter-spacing="3" fill="#f0f7ff" font-family="SF Pro Display, PingFang SC, sans-serif">${label}</text>
  <text x="${currentX + 24}" y="${y + 110}" font-size="58" font-weight="700" fill="#ffffff" font-family="SF Pro Display, PingFang SC, sans-serif">${value}</text>
  <text x="${currentX + 24}" y="${y + 146}" font-size="20" fill="#ffffff" fill-opacity="0.9" font-family="SF Pro Text, PingFang SC, sans-serif">${hint}</text>`.trim();
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
  <rect x="${cursorX}" y="${cursorY}" width="${chipWidth}" height="${lineHeight}" rx="20" ry="20" fill="#ffffff" fill-opacity="0.18" stroke="#ffffff" stroke-opacity="0.16" />
  <text x="${cursorX + 18}" y="${cursorY + 33}" font-size="22" fill="#ffffff" fill-opacity="0.96" font-family="SF Pro Text, PingFang SC, sans-serif">${label}</text>`.trim());

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
  <text x="${x + 28}" y="${currentY}" font-size="28" fill="#ffffff" fill-opacity="0.98" font-family="SF Pro Text, PingFang SC, sans-serif">${this.escapeXml(
    line,
  )}</text>`.trim();
      })
      .join('');
  }

  private resolveThemePalette(themeName: string) {
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

  private resolvePosterLayout(
    requestedSize: GeneratePosterDto['size'],
    sourceType: string,
  ): PosterLayout {
    const size = requestedSize ?? (
      sourceType === 'today_index' || sourceType === 'zodiac_today'
        ? '1088x1472'
        : '1280x1280'
    );

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

  private async renderPosterPng(svgMarkup: string) {
    return sharp(Buffer.from(svgMarkup)).png({ compressionLevel: 9 }).toBuffer();
  }

  private resolveTodayIndexThemeName(dominantElement: string) {
    const mapping: Record<string, string> = {
      木: 'verdant-mint',
      火: 'sunset-ember',
      土: 'earth-sand',
      金: 'moon-silver',
      水: 'ocean-water',
    };

    return mapping[dominantElement] ?? 'verdant-mint';
  }

  private resolveDominantElementFromUser(user: UserEntity) {
    const entries = Object.entries(user.fiveElements ?? {});

    if (!entries.length) {
      return '木';
    }

    return entries.sort((left, right) => right[1] - left[1])[0][0];
  }

  private getTodaySourceCode() {
    return new Date().toISOString().slice(0, 10);
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

  private truncateText(value: string, maxLength: number) {
    const normalized = value.trim();

    if (!normalized || normalized.length <= maxLength) {
      return normalized;
    }

    return `${normalized.slice(0, Math.max(0, maxLength - 1))}…`;
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
