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
import {
  BaziPosterDetails,
  EmotionPosterAdvice,
  EmotionPosterDetails,
  EmotionPosterDimension,
  PosterMetric,
  PosterRendererService,
  ZodiacPosterDetails,
} from '../common/poster-renderer.service';
import { FortuneContentEntity } from '../database/entities/fortune-content.entity';
import { ReportTemplateEntity } from '../database/entities/report-template.entity';
import { PosterJobEntity } from '../database/entities/poster-job.entity';
import { ShareRecordEntity } from '../database/entities/share-record.entity';
import { UserEntity } from '../database/entities/user.entity';
import { UserRecordEntity } from '../database/entities/user-record.entity';
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
  zodiacName?: string;
  zodiacGlyph?: string;
  zodiacEnglish?: string;
  energyValue?: string;
  zodiacPoster?: ZodiacPosterDetails;
  baziPoster?: BaziPosterDetails;
  emotionPoster?: EmotionPosterDetails;
};

@Injectable()
export class PostersService {
  private cachedWechatAccessToken: { token: string; expireAt: number } | null =
    null;
  private readonly miniProgramCodeCache = new Map<
    string,
    { dataUrl: string; expireAt: number }
  >();

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
    private readonly posterRendererService: PosterRendererService,
  ) {}

  async generatePoster(dto: GeneratePosterDto, user: UserEntity | null) {
    const source = await this.resolvePosterSource(dto, user);
    const layout = this.posterRendererService.resolvePosterLayout(
      dto.size,
      source.sourceType,
    );
    const miniProgramCodeDataUrl =
      await this.resolveMiniProgramCodeDataUrl(source);
    const rendered = await this.posterRendererService.renderPoster(
      {
        ...source,
        miniProgramCodeDataUrl,
      },
      null,
      layout,
    );
    const posterId = `poster_${randomBytes(10).toString('hex')}`;
    const provider = 'template';
    const providerStatus = 'rendered';
    const templateId = this.resolvePosterTemplateId(
      source.sourceType,
      layout.kind,
    );
    const imageFormat = rendered.format ?? 'png';
    const imageMimeType = rendered.mimeType ?? 'image/png';
    const imageExtension = rendered.extension ?? imageFormat;
    const downloadFileName = `fortune-hub-${source.sourceType}-${posterId}.${imageExtension}`;

    const fileUrl = await this.persistPosterFile(
      rendered.imageBuffer,
      downloadFileName,
      imageMimeType,
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
      templateId,
      providerImageUrl: null,
      providerRequestId: null,
      providerError: null,
      providerPrompt: '',
      miniProgramCodeStatus: miniProgramCodeDataUrl
        ? 'embedded'
        : 'placeholder',
      width: layout.width,
      height: layout.height,
      size: layout.size,
      downloadFileName,
      generatedAt: new Date().toISOString(),
      format: imageFormat,
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
        prompt: templateId,
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

  async getMiniProgramCode(input: {
    sourceType?: string;
    sourceCode?: string;
    recordId?: string;
  }) {
    const source = this.resolveMiniProgramCodeSource(input);
    const dataUrl = await this.resolveMiniProgramCodeDataUrl(source);

    if (!dataUrl) {
      throw new NotFoundException('小程序码暂不可用');
    }

    return this.decodeImageDataUrl(dataUrl);
  }

  async createPosterJob(dto: GeneratePosterDto, user: UserEntity | null) {
    const job = await this.posterJobRepository.save(
      this.posterJobRepository.create({
        jobId: `poster_job_${randomBytes(10).toString('hex')}`,
        userId: user?.id ?? null,
        jobType: dto.recordId ? 'report_poster' : (dto.sourceType ?? 'poster'),
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
      const response = await this.generatePoster(
        job.requestJson as GeneratePosterDto,
        user,
      );
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

  private async resolvePosterSource(
    dto: GeneratePosterDto,
    user: UserEntity | null,
  ): Promise<PosterSource> {
    if (dto.recordId) {
      if (!user) {
        throw new BadRequestException('请先登录后再生成结果海报');
      }

      const record = await this.reportsService.getOwnedRecordOrThrow(
        dto.recordId,
        user.id,
      );
      const report = await this.reportsService.buildReportPayload(record, user);
      const baziPoster =
        record.recordType === 'bazi'
          ? this.buildBaziPosterDetails(this.asRecord(record.resultData))
          : undefined;
      const emotionPoster =
        record.recordType === 'emotion'
          ? this.buildEmotionPosterDetails(
              record,
              this.asRecord(record.resultData),
              user,
            )
          : undefined;

      return {
        sourceType: record.recordType,
        sourceCode: record.sourceCode,
        recordId: record.id,
        title: baziPoster
          ? '我的八字命盘'
          : emotionPoster
            ? '心理健康评测'
            : report.sharePoster.title,
        subtitle: baziPoster
          ? '根据出生日期与出生地生成的专属命理画像'
          : emotionPoster
            ? emotionPoster.subtitle
            : report.sharePoster.subtitle,
        accentText: baziPoster
          ? `${baziPoster.dayMaster}日主 · ${baziPoster.wuxingTrend} · 喜用${baziPoster.favorableElements}`
          : emotionPoster
            ? emotionPoster.keywords.join(' · ')
            : report.sharePoster.accentText,
        footerText: baziPoster
          ? baziPoster.bottomSlogan
          : emotionPoster
            ? emotionPoster.supportSignal
            : report.sharePoster.footerText,
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
        chips: emotionPoster
          ? emotionPoster.keywords
          : baziPoster
            ? [
                baziPoster.dayMaster,
                baziPoster.wuxingTrend,
                `喜用${baziPoster.favorableElements}`,
              ]
            : [],
        metrics: emotionPoster
          ? emotionPoster.dimensions.slice(0, 3).map((item) => ({
              label: item.label,
              value: String(item.value),
              hint: item.hint,
            }))
          : baziPoster
            ? baziPoster.fortunes.map((item) => ({
                label: item.label,
                value: String(item.value),
              }))
            : [],
        highlightLines: [],
        baziPoster,
        emotionPoster,
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

      return this.buildZodiacTodayPosterSource(zodiac, user);
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
      const template = await this.resolveTemplatePayload(
        'share_poster',
        'lucky_sign',
      );
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

  private async buildTodayIndexPosterSource(
    user: UserEntity,
  ): Promise<PosterSource> {
    const luckyToday = await this.luckyService.getToday(user);
    const luckyData = luckyToday.data;
    const primaryRecommendation = luckyData.recommendations[0] ?? null;
    const dominantElement = this.pickString(
      luckyData.profile.dominantElement,
      this.resolveDominantElementFromUser(user),
    );
    const subjectName = this.pickString(
      user.nickname ?? '',
      user.zodiac ?? '今日',
    );
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
    ].filter(
      (item, index, array) => Boolean(item) && array.indexOf(item) === index,
    );

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
      promptHint:
        '竖版社交分享背景，现代东方气质，轻灵能量流线、柔和留白和层次光影，不能出现任何可读文字或卡片版式。',
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
          value: this.truncateText(
            primaryRecommendation?.title ?? `${dominantElement}能量`,
            8,
          ),
          hint: this.truncateText(
            primaryRecommendation?.supportiveFocus ??
              luckyData.profile.guidance,
            22,
          ),
        },
      ],
      highlightTitle: '今天更适合',
      highlightLines: highlightLines
        .slice(0, 3)
        .map((item) => this.truncateText(item, 28)),
    };
  }

  private async buildZodiacTodayPosterSource(
    zodiac: string,
    user: UserEntity | null,
  ): Promise<PosterSource> {
    const response = await this.zodiacService.getTodayFortune(zodiac);
    const data = response.data;
    const sharePoster = data.sharePoster;
    const zodiacPoster = this.buildZodiacPosterDetails(data, user);

    return {
      sourceType: 'zodiac_today',
      sourceCode: data.zodiac,
      recordId: null,
      title: '星运档案',
      subtitle: zodiacPoster.subtitle,
      accentText: `${zodiacPoster.signName} · ${zodiacPoster.keywords.join(' · ')}`,
      footerText: '长按识别小程序码，查看你的专属星运报告',
      summary: zodiacPoster.quote,
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
      promptHint:
        '竖版无文字星座档案背景，只画月光、星轨、星盘、柔云、星座符号光影和浅蓝紫氛围，避免标题牌、文字框、海报排版和数字。',
      eyebrowText: 'ZODIAC ARCHIVE',
      chips: zodiacPoster.keywords,
      metrics: [
        {
          label: '星象气质',
          value: zodiacPoster.temperament,
        },
        {
          label: '能量倾向',
          value: zodiacPoster.energyTendency,
        },
        {
          label: '守护元素',
          value: zodiacPoster.guardianElement,
        },
        {
          label: '魅力指数',
          value: String(zodiacPoster.charmScore),
        },
        {
          label: '社交能量',
          value: String(zodiacPoster.socialScore),
        },
        {
          label: '今日幸运色',
          value: zodiacPoster.luckyColor,
        },
      ],
      highlightTitle: '星座档案',
      highlightLines: [
        zodiacPoster.quote,
        data.action.title,
        data.dayparts[0]?.hint ?? '',
      ]
        .filter(
          (item, index, array) =>
            Boolean(item) && array.indexOf(item) === index,
        )
        .slice(0, 3),
      zodiacName: data.zodiac,
      zodiacGlyph: this.resolveZodiacGlyph(data.zodiac),
      zodiacEnglish: this.resolveZodiacEnglishName(data.zodiac),
      energyValue: String(data.score.overall),
      zodiacPoster,
    };
  }

  private buildEmotionPosterDetails(
    record: UserRecordEntity,
    resultData: Record<string, unknown>,
    user: UserEntity,
  ): EmotionPosterDetails {
    const rawScore = Number(resultData.score ?? record.score ?? 0);
    const scoreRange = this.parseEmotionScoreRange(
      this.pickString(resultData.scoreRangeLabel, ''),
      Number.isFinite(rawScore) ? rawScore : 0,
    );
    const riskLevel = this.pickString(
      resultData.riskLevel,
      record.resultLevel ?? 'watch',
    );
    const posterScore = this.resolveEmotionPosterScore(
      scoreRange.score,
      scoreRange.maxScore,
      riskLevel,
    );
    const testTitle = this.pickString(
      resultData.testTitle,
      this.pickString(record.sourceCode, '心理健康评测'),
    );
    const resultTitle = this.pickString(
      resultData.title,
      record.resultTitle || '心理健康自检',
    );
    const summary = this.truncateText(
      this.pickString(
        resultData.summary,
        this.pickString(resultData.primarySuggestion, '每一次自我观察，都是成长的开始。'),
      ),
      56,
    );
    const supportSignal = this.truncateText(
      this.pickString(
        resultData.supportSignal,
        '结果仅用于日常自我观察，请按现实支持优先。',
      ),
      56,
    );
    const nickname = this.truncateText(
      this.pickString(user.nickname, '心灵探索者'),
      8,
    );
    const completedAt = this.pickString(
      resultData.completedAt,
      record.createdAt?.toISOString?.() ?? new Date().toISOString(),
    );

    return {
      nickname,
      avatarInitial: nickname.slice(0, 1) || '心',
      completedDate: this.formatPosterDate(completedAt),
      testTitle,
      resultTitle,
      score: posterScore,
      scoreLabel: `${posterScore}/100`,
      statusLabel: this.resolveEmotionPosterStatusLabel(riskLevel),
      subtitle: this.resolveEmotionPosterSubtitle(riskLevel),
      summary,
      supportSignal,
      keywords: this.resolveEmotionPosterKeywords(riskLevel, posterScore),
      dimensions: this.buildEmotionPosterDimensions(
        posterScore,
        riskLevel,
        this.pickString(record.sourceCode, ''),
      ),
      adviceItems: this.buildEmotionPosterAdviceItems(resultData, riskLevel),
      footerTags: ['专业', '科学', '隐私', '可靠'],
    };
  }

  private parseEmotionScoreRange(value: string, fallbackScore: number) {
    const match = value.match(/(-?\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/);
    const score = match ? Number(match[1]) : fallbackScore;
    const maxScore = match ? Number(match[2]) : 15;

    return {
      score: Number.isFinite(score) ? score : 0,
      maxScore: Number.isFinite(maxScore) && maxScore > 0 ? maxScore : 15,
    };
  }

  private resolveEmotionPosterScore(
    score: number,
    maxScore: number,
    riskLevel: string,
  ) {
    if (maxScore > 0 && Number.isFinite(score)) {
      return this.clampEmotionPosterValue(96 - (score / maxScore) * 50);
    }

    const fallback: Record<string, number> = {
      steady: 88,
      watch: 76,
      support: 64,
      urgent: 50,
    };

    return fallback[riskLevel] ?? 76;
  }

  private resolveEmotionPosterStatusLabel(riskLevel: string) {
    const map: Record<string, string> = {
      steady: '状态良好',
      watch: '需要关照',
      support: '建议支持',
      urgent: '优先求助',
    };

    return map[riskLevel] ?? '持续观察';
  }

  private resolveEmotionPosterSubtitle(riskLevel: string) {
    if (riskLevel === 'steady') {
      return '每一次自我观察，都是成长的开始';
    }

    if (riskLevel === 'urgent') {
      return '先把安全与现实支持放在第一位';
    }

    if (riskLevel === 'support') {
      return '看见自己的消耗，及时获得支持';
    }

    return '照顾当下的自己，就是恢复的开始';
  }

  private resolveEmotionPosterKeywords(riskLevel: string, posterScore: number) {
    if (riskLevel === 'urgent') {
      return ['安全', '支持', '陪伴'];
    }

    if (riskLevel === 'support') {
      return ['安顿', '支持', '修复'];
    }

    if (riskLevel === 'watch') {
      return ['觉察', '平衡', '恢复'];
    }

    return posterScore >= 88
      ? ['自信', '平衡', '成长']
      : ['稳定', '自洽', '成长'];
  }

  private buildEmotionPosterDimensions(
    posterScore: number,
    riskLevel: string,
    sourceCode: string,
  ): EmotionPosterDimension[] {
    const isAnxiety = sourceCode.includes('anxiety');
    const needsSupport = riskLevel === 'support' || riskLevel === 'urgent';

    return [
      {
        label: '情绪状态',
        value: this.clampEmotionPosterValue(
          posterScore +
            (riskLevel === 'steady' ? 2 : riskLevel === 'urgent' ? -6 : 0),
        ),
        hint: riskLevel === 'steady' ? '情绪稳定，积极乐观' : '留意波动，温和安顿',
      },
      {
        label: '压力管理',
        value: this.clampEmotionPosterValue(posterScore + (isAnxiety ? -5 : 2)),
        hint: isAnxiety ? '先降节奏，减少消耗' : '压力可控，继续复盘',
      },
      {
        label: '社交关系',
        value: this.clampEmotionPosterValue(
          posterScore + (needsSupport ? -7 : 3),
        ),
        hint: needsSupport ? '主动连接现实支持' : '人际支持较为稳定',
      },
      {
        label: '自我认知',
        value: this.clampEmotionPosterValue(posterScore + 8),
        hint: '完成自检，觉察更清晰',
      },
      {
        label: '生活习惯',
        value: this.clampEmotionPosterValue(
          posterScore + (riskLevel === 'steady' ? 4 : -3),
        ),
        hint: '优先睡眠、饮食与恢复',
      },
    ];
  }

  private buildEmotionPosterAdviceItems(
    resultData: Record<string, unknown>,
    riskLevel: string,
  ): EmotionPosterAdvice[] {
    const candidates = [
      this.pickString(resultData.primarySuggestion, ''),
      ...this.pickStringArray(resultData.relaxSteps, []),
      this.pickString(resultData.supportSignal, ''),
    ]
      .map((item) => this.truncateText(item, 28))
      .filter((item, index, array) => item && array.indexOf(item) === index);
    const fallback =
      riskLevel === 'steady'
        ? [
            '继续保持作息、饮食和基础运动节奏。',
            '把今天最重要的一件事做完，减少额外分心。',
            '给自己留 10 分钟安静呼吸或散步时间。',
            '记录一次让你感觉稳定的小事。',
          ]
        : [
            '先把今天最耗能的一件事拆成更小的一步。',
            '找一个信任的人，说出最近最累的一件事。',
            '给自己留 10 分钟安静呼吸或散步时间。',
            '如果状态持续影响生活，优先联系专业支持。',
          ];
    const lines = (candidates.length ? candidates : fallback).slice(0, 4);

    return lines.map((line, index) => ({
      title: this.resolveEmotionAdviceTitle(line, index),
      text: line,
      icon: this.resolveEmotionAdviceIcon(line, index),
    }));
  }

  private resolveEmotionAdviceTitle(value: string, index: number) {
    if (/睡眠|作息|吃饭|饮食|休息/.test(value)) {
      return '保持规律作息';
    }

    if (/信任|聊|联系|支持|家人|朋友|专业/.test(value)) {
      return '表达真实感受';
    }

    if (/呼吸|散步|运动|拉伸|走动|放松/.test(value)) {
      return '适度运动放松';
    }

    if (/写|目标|任务|一步|动作|完成/.test(value)) {
      return '拆小当前任务';
    }

    return (
      ['照顾当下自己', '表达真实感受', '适度运动放松', '持续自我成长'][
        index
      ] ?? '持续自我成长'
    );
  }

  private resolveEmotionAdviceIcon(
    value: string,
    index: number,
  ): EmotionPosterAdvice['icon'] {
    if (/睡眠|作息|吃饭|饮食|休息/.test(value)) {
      return 'rest';
    }

    if (/信任|聊|联系|支持|家人|朋友|专业/.test(value)) {
      return 'talk';
    }

    if (/呼吸|散步|运动|拉伸|走动|放松/.test(value)) {
      return 'move';
    }

    if (/写|目标|任务|一步|动作|完成/.test(value)) {
      return 'task';
    }

    return (['rest', 'talk', 'move', 'growth'] as const)[index] ?? 'growth';
  }

  private clampEmotionPosterValue(value: number) {
    if (!Number.isFinite(value)) {
      return 76;
    }

    return Math.min(96, Math.max(42, Math.round(value)));
  }

  private formatPosterDate(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value || '今日';
    }

    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${date.getFullYear()}.${month}.${day}`;
  }

  private buildZodiacPosterDetails(
    data: Record<string, unknown>,
    user: UserEntity | null,
  ): ZodiacPosterDetails {
    const zodiac = this.pickString(data.zodiac, '星座');
    const profile = this.asRecord(data.profile);
    const score = this.asRecord(data.score);
    const lucky = this.asRecord(data.lucky);
    const theme = this.asRecord(data.theme);
    const overallScore = Number(score.overall ?? 86);
    const loveScore = Number(score.love ?? overallScore);
    const careerScore = Number(score.career ?? overallScore);
    const keywords = this.resolveZodiacPosterKeywords(
      zodiac,
      Array.isArray(profile.keywords)
        ? profile.keywords
            .map((item) => (typeof item === 'string' ? item.trim() : ''))
            .filter(Boolean)
        : [],
    );
    const elementLabel = this.resolveZodiacPosterElementLabel(
      this.pickString(profile.element, ''),
    );

    return {
      tagText: '星运档案',
      subtitle: '根据出生日期与出生地生成你的星座画像',
      signName: zodiac,
      englishName: this.resolveZodiacEnglishName(zodiac),
      glyph: this.resolveZodiacGlyph(zodiac),
      keywords,
      temperament: this.resolveZodiacTemplateTemperament(zodiac, keywords),
      energyTendency: this.resolveZodiacTemplateEnergyTendency(zodiac),
      guardianElement: this.resolveZodiacTemplateGuardianElement(elementLabel),
      birthday: this.formatZodiacPosterBirthday(user?.birthday ?? ''),
      birthPlace: this.resolveZodiacPosterBirthPlace(user),
      elementLabel,
      charmScore: this.clampPosterScore(loveScore + 6, 92),
      socialScore: this.clampPosterScore(
        (loveScore + careerScore) / 2 + 4,
        88,
      ),
      luckyColor: this.truncateText(
        this.pickString(lucky.color, '雾蓝').replace(/霾粉蓝/g, '蓝'),
        6,
      ),
      quote: this.resolveZodiacPosterQuote(
        zodiac,
        this.pickString(theme.summary, ''),
      ),
    };
  }

  private formatZodiacPosterBirthday(value: string) {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (!match) {
      return value || '待完善';
    }

    return `${match[1]}.${match[2]}.${match[3]}`;
  }

  private resolveZodiacPosterBirthPlace(user: UserEntity | null) {
    const preferences = this.asRecord(user?.preferencesJson);

    return this.pickString(
      preferences.birthPlace,
      this.pickString(
        preferences.birthCity,
        this.pickString(preferences.city, '待完善'),
      ),
    );
  }

  private resolveZodiacPosterElementLabel(value: string) {
    const normalized = value
      ? value.includes('象')
        ? value
        : `${value}象`
      : '风象';

    return normalized.endsWith('星座') ? normalized : `${normalized}星座`;
  }

  private resolveZodiacPosterKeywords(
    zodiac: string,
    fallbackKeywords: string[],
  ) {
    const map: Record<string, string[]> = {
      白羊座: ['热烈', '勇气', '开端'],
      金牛座: ['稳定', '质感', '积累'],
      双子座: ['灵动', '表达', '连接'],
      巨蟹座: ['温柔', '守护', '安全感'],
      狮子座: ['明亮', '自信', '热忱'],
      处女座: ['细致', '秩序', '纯净'],
      天秤座: ['优雅', '平衡', '和谐'],
      天蝎座: ['深邃', '敏锐', '专注'],
      射手座: ['自由', '探索', '乐观'],
      摩羯座: ['稳定', '坚韧', '长期'],
      水瓶座: ['独立', '创新', '理性'],
      双鱼座: ['浪漫', '共情', '想象'],
    };

    return (map[zodiac] ?? fallbackKeywords ?? ['星光', '节奏', '好运'])
      .filter(Boolean)
      .slice(0, 3);
  }

  private resolveZodiacTemplateTemperament(
    zodiac: string,
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

    return map[zodiac] ?? keywords.slice(0, 2).join('') ?? '星光流动';
  }

  private resolveZodiacTemplateEnergyTendency(zodiac: string) {
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

    return map[zodiac] ?? '顺势调整';
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

  private resolveZodiacPosterQuote(zodiac: string, fallback: string) {
    const map: Record<string, string> = {
      白羊座: '你像破晓火光一样明亮直接，勇气会替你打开新的局面。',
      金牛座: '你像春日原野一样安定丰盈，慢慢来反而更接近想要的答案。',
      双子座: '你像风里的讯息一样轻盈灵动，好奇心会带你找到新的连接。',
      巨蟹座: '你像月光下的海湾一样柔软可靠，温柔里藏着坚定的力量。',
      狮子座: '你像盛夏阳光一样自带光芒，真诚表达会让世界看见你。',
      处女座: '你像清晨微光一样细致清醒，秩序感会让复杂慢慢变简单。',
      天秤座: '你像秋夜微风一样温柔而有分寸，理性与浪漫恰到好处。',
      天蝎座: '你像深夜星河一样敏锐专注，越安静越能看见关键答案。',
      射手座: '你像远方地平线一样开阔明朗，自由感会带来新的可能。',
      摩羯座: '你像冬夜山脊一样沉稳坚定，长期主义会把努力变成底气。',
      水瓶座: '你像清冷星光一样独立清醒，新的视角会让旧问题松动。',
      双鱼座: '你像梦境海潮一样柔软浪漫，直觉会带你靠近真正的心愿。',
    };

    const quote = (map[zodiac] ?? fallback).trim();

    if (quote.length <= 34) {
      return quote;
    }

    return quote.slice(0, 34).replace(/[，。、；：,.+\s]+$/u, '');
  }

  private buildBaziPosterDetails(
    resultData: Record<string, unknown>,
  ): BaziPosterDetails {
    const chart = this.asRecord(resultData.chart);
    const baseProfile = this.asRecord(resultData.baseProfile);
    const inputSnapshot = this.asRecord(resultData.inputSnapshot);
    const dominantElement = this.asRecord(resultData.dominantElement);
    const supportElement = this.asRecord(resultData.supportElement);
    const dayMasterAnalysis = this.asRecord(resultData.dayMasterAnalysis);
    const yearPillar = this.pickString(chart.yearPillar, '丙子');
    const monthPillar = this.pickString(chart.monthPillar, '丁酉');
    const dayPillar = this.pickString(chart.dayPillar, '乙卯');
    const hourPillar = this.pickString(chart.hourPillar, '辛巳');
    const dayStem = this.pickString(
      dayMasterAnalysis.dayStem,
      dayPillar[0] ?? '乙',
    );
    const dayElement = this.pickString(
      dayMasterAnalysis.dayElement,
      this.resolveBaziElementFromChar(dayStem),
    );
    const dominantName = this.pickString(dominantElement.name, dayElement);
    const supportName = this.pickString(supportElement.name, '水');
    const favorableElements = this.resolveBaziFavorableElements(
      dayMasterAnalysis,
      supportName,
      dayElement,
    );
    const birthday = this.pickString(
      inputSnapshot.birthday,
      this.pickString(baseProfile.birthday, '1996-10-21'),
    );
    const birthTime = this.pickString(
      inputSnapshot.birthTime,
      this.pickString(baseProfile.birthTime, '09:28'),
    );
    const birthPlace = this.pickString(
      inputSnapshot.birthPlace,
      this.pickString(baseProfile.birthPlace, '杭州'),
    );
    const supportScore = Number(dayMasterAnalysis.supportScore ?? 6);
    const pressureScore = Number(dayMasterAnalysis.pressureScore ?? 4);
    const balanceScore = Number(dayMasterAnalysis.balanceScore ?? 0);
    const dominantValue = Number(dominantElement.value ?? 4);
    const supportValue = Number(supportElement.value ?? 2);

    return {
      tagText: '八字分享',
      calendarText: this.formatBaziCalendarText(birthday, birthTime),
      birthPlace,
      dayMaster: `${dayStem}${dayElement}`,
      pillars: [
        this.buildBaziPosterPillar('年柱', yearPillar),
        this.buildBaziPosterPillar('月柱', monthPillar),
        this.buildBaziPosterPillar('日柱', dayPillar),
        this.buildBaziPosterPillar('时柱', hourPillar),
      ],
      wuxingTrend: `${dominantName}旺`,
      favorableElements,
      analysis: [
        this.buildBaziPosterAnalysisLine(
          `${dayStem}${dayElement}日主，${this.resolveBaziDayMasterPosterTrait(dayElement)}`,
        ),
        this.buildBaziPosterAnalysisLine(
          `${dominantName}${supportName}相生，${this.resolveBaziSupportPosterTrait(supportName)}`,
        ),
        this.buildBaziPosterAnalysisLine(
          this.resolveBaziRhythmPosterLine(dominantName, supportName),
        ),
      ],
      fortunes: [
        {
          label: '综合运势',
          value: this.clampPosterScore(
            78 + dominantValue * 2 + balanceScore,
            82,
          ),
          color: '#2F7D5B',
        },
        {
          label: '事业',
          value: this.clampPosterScore(76 + supportScore * 2, 84),
          color: '#4B8FA8',
        },
        {
          label: '感情',
          value: this.clampPosterScore(
            82 + supportValue * 2 - pressureScore,
            88,
          ),
          color: '#D96B5F',
        },
      ],
      brandLabel: '八字运势',
      bottomSlogan: '知命而后，更懂自己',
    };
  }

  private buildBaziPosterPillar(label: string, pillar: string) {
    return {
      label,
      stem: pillar[0] || '乙',
      branch: pillar[1] || '卯',
    };
  }

  private formatBaziCalendarText(birthday: string, birthTime: string) {
    const match = birthday.match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (!match) {
      return [birthday, birthTime].filter(Boolean).join(' ');
    }

    return `${match[1]}年${Number(match[2])}月${Number(match[3])}日 ${birthTime}`;
  }

  private resolveBaziFavorableElements(
    dayMasterAnalysis: Record<string, unknown>,
    supportName: string,
    dayElement: string,
  ) {
    const usefulElements = Array.isArray(dayMasterAnalysis.usefulElements)
      ? dayMasterAnalysis.usefulElements
          .map((item) => this.pickString(this.asRecord(item).name, ''))
          .filter(Boolean)
      : [];
    const merged = [...usefulElements, supportName, dayElement].filter(
      (item, index, array) => item && array.indexOf(item) === index,
    );

    return merged.slice(0, 2).join('') || `${supportName}${dayElement}`;
  }

  private resolveBaziDayMasterPosterTrait(dayElement: string) {
    const traits: Record<string, string> = {
      木: '气质温和，有韧性',
      火: '表达直接，行动有热度',
      土: '重视稳定，善承接',
      金: '判断清晰，边界感强',
      水: '感受敏锐，善观察',
    };

    return traits[dayElement] ?? '气质稳定';
  }

  private resolveBaziSupportPosterTrait(element: string) {
    const traits: Record<string, string> = {
      木: '延展力强',
      火: '行动力强',
      土: '承接力强',
      金: '判断力强',
      水: '学习力强',
    };

    return traits[element] ?? '适应力强';
  }

  private resolveBaziRhythmPosterLine(
    dominantName: string,
    supportName: string,
  ) {
    const dominant = this.resolveBaziSingleElement(dominantName, '木');
    const support = this.resolveBaziSingleElement(supportName, '水');

    return `节奏建议：${dominant}主轴，${support}补位`;
  }

  private buildBaziPosterAnalysisLine(value: string) {
    const maxUnits = 15;
    const normalized = value.replace(/\s+/g, '').trim();

    if (this.measureBaziPosterTextUnits(normalized) <= maxUnits) {
      return normalized;
    }

    let output = '';

    for (const char of normalized) {
      if (this.measureBaziPosterTextUnits(`${output}${char}`) > maxUnits) {
        break;
      }

      output += char;
    }

    return output.replace(/[，。、；：,.+\s]+$/u, '');
  }

  private resolveBaziSingleElement(value: string, fallback: string) {
    return ['木', '火', '土', '金', '水'].find((item) =>
      value.includes(item),
    ) ?? fallback;
  }

  private measureBaziPosterTextUnits(value: string) {
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

  private resolveBaziElementFromChar(value: string) {
    if ('甲乙寅卯木'.includes(value)) {
      return '木';
    }

    if ('丙丁巳午火'.includes(value)) {
      return '火';
    }

    if ('戊己辰戌丑未土'.includes(value)) {
      return '土';
    }

    if ('庚辛申酉金'.includes(value)) {
      return '金';
    }

    if ('壬癸子亥水'.includes(value)) {
      return '水';
    }

    return '木';
  }

  private clampPosterScore(value: number, fallback: number) {
    if (!Number.isFinite(value)) {
      return fallback;
    }

    return Math.min(99, Math.max(60, Math.round(value)));
  }

  private buildProviderPrompt(source: PosterSource) {
    const visualKeywords = this.buildVisualPromptKeywords(source);
    const colorMood = this.resolveProviderColorMood(source.themeName);

    if (
      source.sourceType === 'today_index' ||
      source.sourceType === 'zodiac_today'
    ) {
      return [
        '竖版微信分享背景插画，现代东方气质，通透高级，适合命理与运势产品分享。只生成纯背景，不生成成品海报。',
        `色彩氛围：${colorMood}。`,
        `视觉元素：${visualKeywords.join('、')}。`,
        this.pickString(
          source.promptHint,
          this.resolvePosterPromptHint(source.sourceType),
        )
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
      `色彩氛围：${colorMood}。`,
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

  private resolvePosterTemplateId(
    sourceType: string,
    kind: 'square' | 'portrait',
  ) {
    if (sourceType === 'zodiac_today') {
      return 'zodiac-archive-poster-941x1672-v1';
    }

    if (sourceType === 'today_index') {
      return 'today-index-template-v1';
    }

    if (sourceType === 'bazi') {
      return 'bazi-share-poster-941x1672-v1';
    }

    if (sourceType === 'emotion') {
      return 'emotion-care-assessment-poster-941x1672-v1';
    }

    if (kind === 'portrait') {
      return 'portrait-share-template-v1';
    }

    return 'square-share-template-v1';
  }

  private resolveZodiacGlyph(zodiac: string) {
    const map: Record<string, string> = {
      白羊座: '♈',
      金牛座: '♉',
      双子座: '♊',
      巨蟹座: '♋',
      狮子座: '♌',
      处女座: '♍',
      天秤座: '♎',
      天蝎座: '♏',
      射手座: '♐',
      摩羯座: '♑',
      水瓶座: '♒',
      双鱼座: '♓',
    };

    return map[zodiac] ?? '✦';
  }

  private resolveZodiacEnglishName(zodiac: string) {
    const map: Record<string, string> = {
      白羊座: 'Aries',
      金牛座: 'Taurus',
      双子座: 'Gemini',
      巨蟹座: 'Cancer',
      狮子座: 'Leo',
      处女座: 'Virgo',
      天秤座: 'Libra',
      天蝎座: 'Scorpio',
      射手座: 'Sagittarius',
      摩羯座: 'Capricorn',
      水瓶座: 'Aquarius',
      双鱼座: 'Pisces',
    };

    return map[zodiac] ?? 'Zodiac';
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

    return [
      'soft celestial glow',
      'mist',
      'flowing light',
      'large clean negative space',
    ];
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
      金牛座: [
        'taurus constellation',
        'gentle bull silhouette',
        'spring meadow light',
      ],
      双子座: [
        'gemini constellation',
        'twin star ribbons',
        'airy light trails',
      ],
      巨蟹座: ['cancer constellation', 'moonlit water', 'soft shell curve'],
      狮子座: ['leo constellation', 'golden mane light', 'sun halo'],
      处女座: [
        'virgo constellation',
        'wheat and moonlight',
        'quiet earth garden',
      ],
      天秤座: [
        'libra constellation',
        'balanced moon arc',
        'soft scales silhouette',
      ],
      天蝎座: [
        'scorpio constellation',
        'deep night desert',
        'mysterious red glow',
      ],
      射手座: [
        'sagittarius constellation',
        'arrow star trail',
        'wide sky horizon',
      ],
      摩羯座: [
        'capricorn constellation',
        'mountain silhouette',
        'quiet midnight stone',
      ],
      水瓶座: [
        'aquarius constellation',
        'flowing water light',
        'future glass texture',
      ],
      双鱼座: [
        'pisces constellation',
        'two fish light trails',
        'dreamy ocean mist',
      ],
    };

    return map[zodiac] ?? ['constellation', 'soft star trail', 'misty sky'];
  }

  private resolveProviderColorMood(themeName: string) {
    if (themeName.includes('sage') || themeName.includes('stone')) {
      return '灰蓝夜空、岩石灰、低饱和绿色、柔和月光、安静高级';
    }

    if (themeName.includes('amber') || themeName.includes('gold')) {
      return '暖金色、浅琥珀、柔和米白、晨光质感';
    }

    if (themeName.includes('sunset') || themeName.includes('ember')) {
      return '落日橙、柔粉、深玫瑰暗部、温暖余晖';
    }

    if (themeName.includes('sand') || themeName.includes('earth')) {
      return '大地色、岩层纹理、柔沙色、低饱和暖光';
    }

    if (themeName.includes('silver') || themeName.includes('metal')) {
      return '银蓝月光、冷灰、细腻金属光泽、清透暗部';
    }

    if (themeName.includes('ocean') || themeName.includes('water')) {
      return '深海蓝、雾白、水面微光、流动感';
    }

    if (themeName.includes('mint')) {
      return '薄荷绿、浅青、柔白光、清新空气感';
    }

    return '深蓝灰、柔白光、低饱和渐变、安静留白';
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

  private async resolveMiniProgramCodeDataUrl(source: PosterSource) {
    if (
      this.configService.get<string>(
        'POSTER_MINI_PROGRAM_CODE_ENABLED',
        'true',
      ) === 'false'
    ) {
      return null;
    }

    const staticCodeUrl = this.pickString(
      this.configService.get<string>('POSTER_MINI_PROGRAM_CODE_URL') ??
        this.configService.get<string>('WECHAT_MINI_PROGRAM_CODE_URL'),
      '',
    );

    if (staticCodeUrl) {
      try {
        const staticCodeDataUrl =
          await this.resolveImageReferenceDataUrl(staticCodeUrl);

        if (staticCodeDataUrl) {
          return staticCodeDataUrl;
        }
      } catch (error) {
        return this.handleMiniProgramCodeError(error);
      }
    }

    const appId = this.configService.get<string>('WECHAT_APP_ID');
    const appSecret = this.configService.get<string>('WECHAT_APP_SECRET');

    if (!appId || !appSecret) {
      return null;
    }

    const path = this.resolveMiniProgramCodePath(source);
    const envVersion = this.resolveMiniProgramEnvVersion();
    const cacheKey = [path, envVersion].join('|');
    const cached = this.miniProgramCodeCache.get(cacheKey);

    if (cached && cached.expireAt > Date.now()) {
      return cached.dataUrl;
    }

    try {
      const accessToken = await this.getWechatAccessToken(appId, appSecret);
      const response = await this.fetchWithTimeout(
        `https://api.weixin.qq.com/wxa/getwxacode?access_token=${encodeURIComponent(accessToken)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            path,
            env_version: envVersion,
            width: this.resolveMiniProgramCodeWidth(),
            auto_color: false,
            line_color: {
              r: 47,
              g: 58,
              b: 74,
            },
            is_hyaline: false,
          }),
        },
        12000,
        '小程序码生成超时',
      );
      const dataUrl = await this.readWechatCodeResponse(response);
      const cacheTtlSeconds = this.resolveMiniProgramCodeCacheTtlSeconds();

      this.miniProgramCodeCache.set(cacheKey, {
        dataUrl,
        expireAt: Date.now() + cacheTtlSeconds * 1000,
      });

      return dataUrl;
    } catch (error) {
      return this.handleMiniProgramCodeError(error);
    }
  }

  private resolveMiniProgramCodeSource(input: {
    sourceType?: string;
    sourceCode?: string;
    recordId?: string;
  }): PosterSource {
    const sourceType = this.pickString(input.sourceType, 'divination');
    const allowedSourceTypes = new Set([
      'divination',
      'today_index',
      'zodiac_today',
      'lucky_sign',
      'bazi',
      'emotion',
      'personality',
    ]);

    if (!allowedSourceTypes.has(sourceType)) {
      throw new BadRequestException('不支持的小程序码场景');
    }

    const sourceCode = this.pickString(input.sourceCode, '');
    const recordId = this.pickString(input.recordId, '');

    return {
      sourceType,
      sourceCode: sourceCode || null,
      recordId: recordId || null,
      title: '今日占卜结果',
      subtitle: '',
      accentText: '',
      footerText: '',
      summary: '',
      promptKeywords: [],
      themeName: '',
      promptHint: '',
      eyebrowText: '',
      chips: [],
      metrics: [],
      highlightLines: [],
      zodiacName: sourceCode || undefined,
    };
  }

  private decodeImageDataUrl(dataUrl: string) {
    const match = dataUrl.match(/^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i);

    if (!match) {
      throw new BadGatewayException('小程序码图片格式错误');
    }

    return {
      mimeType: match[1],
      buffer: Buffer.from(match[2], 'base64'),
    };
  }

  private async resolveImageReferenceDataUrl(reference: string) {
    if (/^data:image\/[a-z0-9.+-]+;base64,/i.test(reference)) {
      return reference;
    }

    if (!/^https?:\/\//i.test(reference)) {
      return null;
    }

    const response = await this.fetchWithTimeout(
      reference,
      undefined,
      8000,
      '小程序码图片下载超时',
    );

    if (!response.ok) {
      throw new BadGatewayException('小程序码图片下载失败');
    }

    return this.readImageResponseAsDataUrl(response, '小程序码图片格式错误');
  }

  private async readWechatCodeResponse(response: Response) {
    const body = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get('content-type') ?? '';
    const looksLikeJson =
      contentType.includes('json') || body.toString('utf8', 0, 1) === '{';

    if (looksLikeJson) {
      const payload = JSON.parse(body.toString('utf8')) as {
        errcode?: number;
        errmsg?: string;
      };

      throw new BadGatewayException(payload.errmsg || '微信小程序码生成失败');
    }

    if (!response.ok) {
      throw new BadGatewayException('微信小程序码生成失败');
    }

    const mimeType = contentType.startsWith('image/')
      ? contentType.split(';')[0]
      : 'image/png';

    return `data:${mimeType};base64,${body.toString('base64')}`;
  }

  private async readImageResponseAsDataUrl(
    response: Response,
    fallbackError: string,
  ) {
    const contentType = response.headers.get('content-type') ?? '';

    if (!contentType.startsWith('image/')) {
      throw new BadGatewayException(fallbackError);
    }

    const body = Buffer.from(await response.arrayBuffer());
    const mimeType = contentType.split(';')[0];

    return `data:${mimeType};base64,${body.toString('base64')}`;
  }

  private async getWechatAccessToken(appId: string, appSecret: string) {
    if (
      this.cachedWechatAccessToken &&
      this.cachedWechatAccessToken.expireAt > Date.now()
    ) {
      return this.cachedWechatAccessToken.token;
    }

    const url = new URL('https://api.weixin.qq.com/cgi-bin/token');
    url.searchParams.set('grant_type', 'client_credential');
    url.searchParams.set('appid', appId);
    url.searchParams.set('secret', appSecret);

    const response = await this.fetchWithTimeout(
      url.toString(),
      undefined,
      12000,
      '微信 access_token 获取超时',
    );
    const result = (await response.json()) as {
      access_token?: string;
      expires_in?: number;
      errmsg?: string;
    };

    if (!response.ok || !result.access_token) {
      throw new BadGatewayException(
        result.errmsg || '微信 access_token 获取失败',
      );
    }

    this.cachedWechatAccessToken = {
      token: result.access_token,
      expireAt:
        Date.now() +
        Math.max(300, Number(result.expires_in ?? 7200) - 300) * 1000,
    };

    return result.access_token;
  }

  private handleMiniProgramCodeError(error: unknown) {
    if (
      this.configService.get<string>(
        'POSTER_MINI_PROGRAM_CODE_REQUIRED',
        'false',
      ) === 'true'
    ) {
      throw new BadGatewayException(
        this.extractErrorMessage(error, '小程序码生成失败'),
      );
    }

    return null;
  }

  private resolveMiniProgramCodePath(source: PosterSource) {
    const configuredPath = this.pickString(
      this.configService.get<string>(
        `POSTER_${source.sourceType.toUpperCase()}_WXACODE_PATH`,
      ),
      '',
    );

    if (configuredPath) {
      return this.normalizeMiniProgramPath(
        this.renderMiniProgramPathTemplate(configuredPath, source),
      );
    }

    const legacyPage = this.pickString(
      this.configService.get<string>(
        `POSTER_${source.sourceType.toUpperCase()}_WXACODE_PAGE`,
      ),
      '',
    );

    const page = legacyPage
      ? this.normalizeMiniProgramPage(legacyPage)
      : this.resolveDefaultMiniProgramPage(source);
    const query: Record<string, string> =
      this.resolveMiniProgramCodeQuery(source);

    return this.normalizeMiniProgramPath(
      this.appendMiniProgramQuery(page, query),
    );
  }

  private resolveDefaultMiniProgramPage(source: PosterSource) {
    if (source.sourceType === 'zodiac_today') {
      return 'pages/zodiac/index';
    }

    if (source.sourceType === 'lucky_sign') {
      return 'pages/lucky/sign/index';
    }

    if (source.sourceType === 'divination') {
      return 'pages/divination/index/index';
    }

    if (
      source.sourceType === 'bazi' ||
      source.sourceType === 'emotion' ||
      source.sourceType === 'personality'
    ) {
      return 'pages/report/index';
    }

    return 'pages/index/index';
  }

  private resolveMiniProgramCodeQuery(
    source: PosterSource,
  ): Record<string, string> {
    if (source.sourceType === 'zodiac_today') {
      return {
        zodiac: source.sourceCode ?? source.zodiacName ?? '',
      };
    }

    if (source.sourceType === 'lucky_sign') {
      return {
        bizCode: source.sourceCode ?? '',
      };
    }

    if (source.sourceType === 'divination') {
      return {
        source: 'share_poster',
        ...(source.recordId ? { recordId: source.recordId } : {}),
      };
    }

    if (
      source.sourceType === 'bazi' ||
      source.sourceType === 'emotion' ||
      source.sourceType === 'personality'
    ) {
      return {
        recordId: source.recordId ?? '',
      };
    }

    return {
      source: source.sourceType,
    };
  }

  private renderMiniProgramPathTemplate(
    template: string,
    source: PosterSource,
  ) {
    return template
      .replace(/\{sourceType\}/g, source.sourceType)
      .replace(/\{sourceCode\}/g, encodeURIComponent(source.sourceCode ?? ''))
      .replace(/\{recordId\}/g, encodeURIComponent(source.recordId ?? ''))
      .replace(
        /\{zodiac\}/g,
        encodeURIComponent(source.zodiacName ?? source.sourceCode ?? ''),
      )
      .slice(0, 1024);
  }

  private normalizeMiniProgramPage(page: string) {
    return page.replace(/^\/+/, '').split('?')[0];
  }

  private appendMiniProgramQuery(page: string, query: Record<string, string>) {
    const params = Object.entries(query)
      .filter(([key, value]) => key !== 'scancode_time' && value.trim())
      .map(
        ([key, value]) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
      );

    if (!params.length) {
      return page;
    }

    return `${page}?${params.join('&')}`;
  }

  private normalizeMiniProgramPath(path: string) {
    const normalized = path.trim().replace(/^\/+/, '');
    const [route, ...queryParts] = normalized.split('?');
    const query = queryParts.join('?');

    if (!query) {
      const resolvedPath = (route || 'pages/index/index').slice(0, 1024);
      this.assertValidMiniProgramPath(resolvedPath);
      return resolvedPath;
    }

    const filteredQuery = query
      .split('&')
      .filter((part) => {
        const [rawKey] = part.split('=');
        return this.safeDecodeURIComponent(rawKey) !== 'scancode_time';
      })
      .join('&');

    const resolvedPath = `${route || 'pages/index/index'}${filteredQuery ? `?${filteredQuery}` : ''}`.slice(
      0,
      1024,
    );
    this.assertValidMiniProgramPath(resolvedPath);

    return resolvedPath;
  }

  private assertValidMiniProgramPath(path: string) {
    if (/^[a-z][a-z0-9+.-]*:/i.test(path) || path.includes('//')) {
      throw new BadRequestException('小程序码 path 不能包含协议或外链地址');
    }

    if (path.includes('#')) {
      throw new BadRequestException('小程序码 path 不能包含 hash 片段');
    }

    const [route, query = ''] = path.split('?');

    if (!route || route.includes('..') || !/^[A-Za-z0-9_/-]+$/.test(route)) {
      throw new BadRequestException('小程序码 path 路由格式不正确');
    }

    if (!route.startsWith('pages/')) {
      throw new BadRequestException('小程序码 path 必须指向 pages 目录');
    }

    if (query) {
      for (const part of query.split('&')) {
        if (!part) {
          continue;
        }

        const [rawKey] = part.split('=');
        const key = this.safeDecodeURIComponent(rawKey);

        if (!key || key === 'scancode_time' || !/^[A-Za-z0-9_-]+$/.test(key)) {
          throw new BadRequestException('小程序码 path 查询参数格式不正确');
        }
      }
    }

    if (
      this.configService.get<string>('POSTER_WXACODE_STRICT_PATH', 'false') ===
      'true'
    ) {
      const allowedPages = this.resolveAllowedMiniProgramPages();

      if (!allowedPages.has(route)) {
        throw new BadRequestException('小程序码 path 不在允许页面列表中');
      }
    }
  }

  private resolveAllowedMiniProgramPages() {
    const configuredPages = this.pickString(
      this.configService.get<string>('POSTER_WXACODE_ALLOWED_PAGES'),
      '',
    );
    const pages = configuredPages
      ? configuredPages.split(',')
      : [
          'pages/index/index',
          'pages/zodiac/index',
          'pages/lucky/sign/index',
          'pages/divination/index/index',
          'pages/report/index',
        ];

    return new Set(
      pages
        .map((page) => this.normalizeMiniProgramPage(page.trim()))
        .filter(Boolean),
    );
  }

  private resolveMiniProgramEnvVersion() {
    const envVersion = this.pickString(
      this.configService.get<string>('WECHAT_MINI_PROGRAM_ENV_VERSION'),
      'release',
    );

    return ['release', 'trial', 'develop'].includes(envVersion)
      ? envVersion
      : 'release';
  }

  private resolveMiniProgramCodeWidth() {
    const width = Number(
      this.configService.get<string>('WECHAT_WXACODE_WIDTH', '430'),
    );

    if (!Number.isFinite(width)) {
      return 430;
    }

    return Math.min(1280, Math.max(280, Math.round(width)));
  }

  private resolveMiniProgramCodeCacheTtlSeconds() {
    const ttl = Number(
      this.configService.get<string>(
        'POSTER_MINI_PROGRAM_CODE_CACHE_TTL_SECONDS',
        '21600',
      ),
    );

    if (!Number.isFinite(ttl) || ttl <= 0) {
      return 21600;
    }

    return Math.min(86400, Math.round(ttl));
  }

  private async persistPosterFile(
    imageBuffer: Buffer,
    fileName: string,
    mimeType = 'image/png',
  ) {
    const uploadUrl = this.resolveFileServiceUploadUrl();

    if (!uploadUrl) {
      return null;
    }

    const token = this.configService.get<string>('FILE_SERVICE_TOKEN');
    const formData = new FormData();
    const blob = new Blob([new Uint8Array(imageBuffer)], {
      type: mimeType,
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
      const payload = (await response.json().catch(() => null)) as {
        id?: string;
        contentUrl?: string;
        url?: string;
      } | null;

      if (!response.ok) {
        return null;
      }

      return this.resolveUploadedFileUrl(
        payload?.contentUrl ?? payload?.url,
        payload?.id,
      );
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
      result: job.resultJson
        ? this.buildPublicImagePayload(job.resultJson)
        : null,
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
      publicPayload.fileUrl = this.resolveUploadedFileUrl(
        publicPayload.fileUrl,
      );
    }

    if (
      typeof publicPayload.imageDataUrl === 'string' &&
      !/^data:image\/(?:png|jpe?g|webp);base64,/i.test(
        publicPayload.imageDataUrl,
      )
    ) {
      delete publicPayload.imageDataUrl;
    }

    if (publicPayload.format === 'svg') {
      publicPayload.format = 'png';
    }

    if (typeof publicPayload.downloadFileName === 'string') {
      publicPayload.downloadFileName = publicPayload.downloadFileName.replace(
        /\.svg$/i,
        '.png',
      );
    }

    return publicPayload;
  }

  private buildPublicJobErrorMessage(error: unknown) {
    if (
      error instanceof BadRequestException ||
      error instanceof NotFoundException
    ) {
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
        providerStatusCode: this.pickDiagnosticValue(
          payload.providerStatusCode,
        ),
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
          const messages = message as unknown[];
          const firstMessage = messages.find(
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
    return (
      this.configService
        .get<string>('FILE_SERVICE_BASE_URL')
        ?.replace(/\/$/, '') ?? ''
    );
  }

  private resolveUploadedFileUrl(contentUrl?: string | null, fileId?: string) {
    const publicApiBaseUrl = this.configService.get<string>(
      'PUBLIC_API_BASE_URL',
    );
    const resolvedFileId =
      fileId || (contentUrl ? extractFileIdFromFileUrl(contentUrl) : null);

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

  private pickStringArray(value: unknown, fallback: string[]) {
    if (!Array.isArray(value)) {
      return fallback;
    }

    const items = value
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter(Boolean);

    return items.length ? items : fallback;
  }

  private safeDecodeURIComponent(value: string) {
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }

  private asRecord(value: unknown) {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  }
}
