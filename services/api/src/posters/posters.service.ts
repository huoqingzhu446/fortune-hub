import {
  BadGatewayException,
  BadRequestException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'node:crypto';
import { Repository } from 'typeorm';
import {
  buildPublicApiFileContentUrl,
  extractFileIdFromFileUrl,
  normalizeFileServiceUrlToApiProxy,
} from '../common/file-url.util';
import { ImageGenerationService } from '../common/image-generation.service';
import {
  PosterMetric,
  PosterRendererService,
} from '../common/poster-renderer.service';
import { FortuneContentEntity } from '../database/entities/fortune-content.entity';
import { ReportTemplateEntity } from '../database/entities/report-template.entity';
import { PosterJobEntity } from '../database/entities/poster-job.entity';
import { ShareRecordEntity } from '../database/entities/share-record.entity';
import { UserEntity } from '../database/entities/user.entity';
import { LuckyService } from '../lucky/lucky.service';
import { ReportsService } from '../reports/reports.service';
import { ZodiacService } from '../zodiac/zodiac.service';
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
    private readonly imageGenerationService: ImageGenerationService,
    private readonly posterRendererService: PosterRendererService,
  ) {}

  async generatePoster(dto: GeneratePosterDto, user: UserEntity | null) {
    const source = await this.resolvePosterSource(dto, user);
    const layout = this.posterRendererService.resolvePosterLayout(dto.size, source.sourceType);
    const providerPrompt = this.buildProviderPrompt(source);
    const backgroundAsset = await this.resolvePosterBackground(
      providerPrompt,
      layout.size,
    );
    const rendered = await this.posterRendererService.renderPoster(
      source,
      backgroundAsset.backgroundImageDataUrl,
      layout,
    );
    const posterId = `poster_${randomBytes(10).toString('hex')}`;
    const provider = 'zhipu';
    const providerStatus = 'generated';
    const downloadFileName = `fortune-hub-${source.sourceType}-${posterId}.png`;

    if (!rendered.usedProviderBackground) {
      throw new BadGatewayException('智谱背景没有参与海报渲染，请稍后重试');
    }

    const fileUrl = await this.persistPosterFile(
      rendered.imageBuffer,
      downloadFileName,
    );
    const payload = {
      posterId,
      sourceType: source.sourceType,
      provider,
      providerStatus,
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
      downloadFileName,
      generatedAt: new Date().toISOString(),
      format: 'png',
      imageDataUrl: rendered.imageDataUrl,
      fileUrl,
    };
    const storedPayload = this.buildStoredPayload(payload);

    await this.shareRecordRepository.save(
      this.shareRecordRepository.create({
        posterId,
        userId: user?.id ?? null,
        recordId: source.recordId,
        sourceType: source.sourceType,
        sourceCode: source.sourceCode,
        posterTitle: source.title,
        provider,
        status: providerStatus,
        prompt: providerPrompt,
        payloadJson: storedPayload,
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
        poster: this.buildPublicImagePayload(poster.payloadJson ?? {}),
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
      job.resultJson = this.buildStoredPayload(poster);
      job.fileUrl = typeof poster.fileUrl === 'string' ? poster.fileUrl : null;
      job.finishedAt = new Date();
      job.errorMessage = null;
    } catch (error) {
      job.status = 'failed';
      job.errorMessage = this.buildPublicJobErrorMessage(error);
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
        this.resolveElementVisualKeyword(dominantElement),
        'abstract eastern energy field',
        'soft flowing light',
        'mist and star dust',
        'mineral texture',
        'large clean negative space',
      ].filter(Boolean),
      themeName: this.resolveTodayIndexThemeName(dominantElement),
      promptHint: '竖版社交分享背景，现代东方气质，轻灵能量流线、柔和留白和层次光影，不能出现任何可读文字或卡片版式。',
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
        ...this.resolveZodiacVisualKeywords(data.zodiac),
        this.resolveElementVisualKeyword(data.profile.element),
        'constellation arcs',
        'misty mountains',
        'soft celestial glow',
        'mineral texture',
        'large clean negative space',
      ],
      themeName: sharePoster.themeName,
      promptHint: '竖版无文字星象背景，只画星轨、山海、云雾、光线和抽象星座意象，避免标题牌、文字框、海报排版和数字。',
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
    const visualKeywords = this.buildVisualPromptKeywords(source);

    if (source.sourceType === 'today_index' || source.sourceType === 'zodiac_today') {
      return [
        '竖版微信分享背景插画，现代东方气质，通透高级，适合命理与运势产品分享。只生成纯背景，不生成成品海报。',
        `主题：${source.themeName}。`,
        `视觉元素：${visualKeywords.join('、')}。`,
        this.pickString(source.promptHint, this.resolvePosterPromptHint(source.sourceType))
          ? `额外风格要求：${this.pickString(source.promptHint, this.resolvePosterPromptHint(source.sourceType))}。`
          : '',
        '画面层次丰富但安静，包含星轨、流光、云雾、五行纹理或抽象山海意象，顶部和中下部有干净留白。',
        '不要设计版式，不要出现标题栏、信息卡片、按钮、纸张、标签、边框、表格、对话框、印章或人物脸部特写。',
        '绝对不要出现任何文字、汉字、英文字母、数字、logo、水印、二维码、签名和可读符号。',
        '整体偏封面感、治愈感、轻奢感，高清细节，适合后期叠加中文信息。',
      ]
        .filter(Boolean)
        .join(' ');
    }

    const templateHint = this.resolvePosterPromptHint(source.sourceType);

    return [
      '微信分享背景插画，现代东方气质，清透高级，适合内容类产品分享，只生成纯背景，不生成成品海报。',
      `主题：${source.themeName}。`,
      `视觉元素：${visualKeywords.join('、')}。`,
      this.pickString(source.promptHint, templateHint)
        ? `额外风格要求：${this.pickString(source.promptHint, templateHint)}。`
        : '',
      '画面需要有大面积留白，适合后续叠加中文标题和说明文案，但背景自身不能像海报模板。',
      '不要出现任何文字、汉字、英文字母、数字、logo、水印、二维码、边框、按钮、卡片文案和人物脸部特写。',
      '整体要有层次感、柔和渐变、半透明玻璃质感和轻微光晕。',
    ]
      .filter(Boolean)
      .join(' ');
  }

  private buildVisualPromptKeywords(source: PosterSource) {
    const blockedPattern =
      /[\u4e00-\u9fa5]{5,}|今日|气运|运势|指数|行动|建议|幸运|完成|目标|数字|分享|海报|卡片|标签|文案|标题/;
    const keywords = source.promptKeywords
      .map((keyword) => keyword.trim())
      .filter(Boolean)
      .filter((keyword) => !blockedPattern.test(keyword));

    if (keywords.length) {
      return keywords.slice(0, 10);
    }

    return ['soft celestial glow', 'mist', 'flowing light', 'large clean negative space'];
  }

  private resolveElementVisualKeyword(element: string) {
    if (element.includes('木')) {
      return 'fresh green wood element texture';
    }

    if (element.includes('火')) {
      return 'warm ember light texture';
    }

    if (element.includes('土')) {
      return 'earth stone mountain texture';
    }

    if (element.includes('金')) {
      return 'silver metal moonlight texture';
    }

    if (element.includes('水')) {
      return 'deep water mist texture';
    }

    return 'balanced five element texture';
  }

  private resolveZodiacVisualKeywords(zodiac: string) {
    const map: Record<string, string[]> = {
      白羊座: ['aries constellation', 'ram horn silhouette', 'morning sparks'],
      金牛座: ['taurus constellation', 'gentle bull silhouette', 'spring meadow light'],
      双子座: ['gemini constellation', 'twin star ribbons', 'airy light trails'],
      巨蟹座: ['cancer constellation', 'moonlit water', 'soft shell curve'],
      狮子座: ['leo constellation', 'golden mane light', 'sun halo'],
      处女座: ['virgo constellation', 'wheat and moonlight', 'quiet earth garden'],
      天秤座: ['libra constellation', 'balanced moon arc', 'soft scales silhouette'],
      天蝎座: ['scorpio constellation', 'deep night desert', 'mysterious red glow'],
      射手座: ['sagittarius constellation', 'arrow star trail', 'wide sky horizon'],
      摩羯座: ['capricorn constellation', 'mountain silhouette', 'quiet midnight stone'],
      水瓶座: ['aquarius constellation', 'flowing water light', 'future glass texture'],
      双鱼座: ['pisces constellation', 'two fish light trails', 'dreamy ocean mist'],
    };

    return map[zodiac] ?? ['constellation', 'soft star trail', 'misty sky'];
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
    prompt: string,
    size: string,
  ): Promise<PosterBackgroundAsset> {
    if (!this.imageGenerationService.isConfigured()) {
      throw new BadGatewayException('图片生成服务未配置，请稍后重试');
    }

    try {
      const providerImage = await this.imageGenerationService.generate({
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
      const diagnostic = this.extractProviderDiagnostic(error);
      console.warn('poster zhipu background failed', diagnostic);

      throw new BadGatewayException({
        message: '智谱海报背景生成失败，请稍后重试',
        error: 'ZhipuPosterBackgroundFailed',
        provider: 'zhipu',
        providerCode: diagnostic.providerCode,
        providerMessage: diagnostic.providerMessage,
        providerStatusCode: diagnostic.providerStatusCode,
        requestId: diagnostic.requestId,
      });
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

      return this.resolveUploadedFileUrl(payload?.contentUrl ?? payload?.url, payload?.id);
    } catch {
      return null;
    }
  }

  private resolveFileServiceUploadUrl() {
    const baseUrl = this.resolveFileServiceBaseUrl();

    if (!baseUrl) {
      return null;
    }

    return baseUrl.endsWith('/api')
      ? `${baseUrl}/files/upload`
      : `${baseUrl}/api/files/upload`;
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
      result: job.resultJson ? this.buildPublicImagePayload(job.resultJson) : null,
      fileUrl: job.fileUrl,
      errorMessage: job.errorMessage,
      startedAt: job.startedAt?.toISOString() ?? null,
      finishedAt: job.finishedAt?.toISOString() ?? null,
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
    };
  }

  private buildStoredPayload(payload: Record<string, unknown>) {
    const storedPayload = { ...payload };
    const imageDataUrl = storedPayload.imageDataUrl;
    delete storedPayload.svgMarkup;
    delete storedPayload.imageDataUrl;

    if (typeof payload.fileUrl === 'string' && payload.fileUrl) {
      return storedPayload;
    }

    return {
      ...storedPayload,
      imageDataUrl,
    };
  }

  private buildPublicImagePayload(payload: Record<string, unknown>) {
    const publicPayload = { ...payload };
    delete publicPayload.svgMarkup;

    if (typeof publicPayload.fileUrl === 'string') {
      publicPayload.fileUrl = this.resolveUploadedFileUrl(publicPayload.fileUrl);
    }

    if (
      typeof publicPayload.imageDataUrl === 'string' &&
      !publicPayload.imageDataUrl.startsWith('data:image/png;base64,')
    ) {
      delete publicPayload.imageDataUrl;
    }

    if (publicPayload.format === 'svg') {
      publicPayload.format = 'png';
    }

    if (typeof publicPayload.downloadFileName === 'string') {
      publicPayload.downloadFileName = publicPayload.downloadFileName.replace(/\.svg$/i, '.png');
    }

    return publicPayload;
  }

  private buildPublicJobErrorMessage(error: unknown) {
    if (error instanceof BadRequestException || error instanceof NotFoundException) {
      return this.extractErrorMessage(error, '海报生成失败');
    }

    return '图片生成失败，请稍后重试';
  }

  private extractProviderDiagnostic(error: unknown) {
    const providerError =
      error && typeof error === 'object'
        ? (error as { providerError?: unknown }).providerError
        : null;

    if (providerError && typeof providerError === 'object') {
      const payload = providerError as Record<string, unknown>;

      return {
        providerCode: this.pickDiagnosticValue(payload.providerCode),
        providerMessage: this.pickString(
          payload.providerMessage,
          this.extractErrorMessage(error, '智谱海报背景生成失败'),
        ),
        providerStatusCode: this.pickDiagnosticValue(payload.statusCode),
        requestId: this.pickDiagnosticValue(payload.requestId),
      };
    }

    if (error instanceof HttpException) {
      const response = error.getResponse();
      const payload =
        response && typeof response === 'object'
          ? (response as Record<string, unknown>)
          : {};

      return {
        providerCode: this.pickDiagnosticValue(payload.providerCode),
        providerMessage: this.pickString(
          payload.providerMessage,
          this.extractErrorMessage(error, '智谱海报背景生成失败'),
        ),
        providerStatusCode: this.pickDiagnosticValue(payload.providerStatusCode),
        requestId: this.pickDiagnosticValue(payload.requestId),
      };
    }

    return {
      providerCode: null,
      providerMessage: this.extractErrorMessage(error, '智谱海报背景生成失败'),
      providerStatusCode: null,
      requestId: null,
    };
  }

  private extractErrorMessage(error: unknown, fallback: string) {
    if (typeof error === 'string' && error.trim()) {
      return error.trim();
    }

    if (error instanceof HttpException) {
      const response = error.getResponse();

      if (typeof response === 'string' && response.trim()) {
        return response.trim();
      }

      if (response && typeof response === 'object') {
        const message = (response as { message?: unknown }).message;

        if (typeof message === 'string' && message.trim()) {
          return message.trim();
        }

        if (Array.isArray(message)) {
          const firstMessage = message.find(
            (item) => typeof item === 'string' && item.trim(),
          );

          if (typeof firstMessage === 'string') {
            return firstMessage.trim();
          }
        }
      }
    }

    if (error instanceof Error && error.message.trim()) {
      return error.message.trim();
    }

    return fallback;
  }

  private pickDiagnosticValue(value: unknown) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    return null;
  }

  private resolveFileServiceBaseUrl() {
    return this.configService.get<string>('FILE_SERVICE_BASE_URL')?.replace(/\/$/, '') ?? '';
  }

  private resolveUploadedFileUrl(contentUrl?: string | null, fileId?: string) {
    const publicApiBaseUrl = this.configService.get<string>('PUBLIC_API_BASE_URL');
    const resolvedFileId = fileId || (contentUrl ? extractFileIdFromFileUrl(contentUrl) : null);

    if (resolvedFileId) {
      return buildPublicApiFileContentUrl(resolvedFileId, publicApiBaseUrl);
    }

    if (!contentUrl) {
      return null;
    }

    return normalizeFileServiceUrlToApiProxy(contentUrl, {
      forceProxy: true,
      internalBaseUrl: this.resolveFileServiceBaseUrl(),
      publicApiBaseUrl,
    });
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
