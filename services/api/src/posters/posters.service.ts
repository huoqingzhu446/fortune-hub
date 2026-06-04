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
  EmotionPosterAdvice,
  EmotionPosterDetails,
  EmotionPosterDimension,
  PosterMetric,
  PosterRendererService,
} from '../common/poster-renderer.service';
import { FortuneContentEntity } from '../database/entities/fortune-content.entity';
import { ReportTemplateEntity } from '../database/entities/report-template.entity';
import { PosterJobEntity } from '../database/entities/poster-job.entity';
import { ShareRecordEntity } from '../database/entities/share-record.entity';
import { UserEntity } from '../database/entities/user.entity';
import { UserRecordEntity } from '../database/entities/user-record.entity';
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
  eyebrowText: string;
  chips: string[];
  metrics: PosterMetric[];
  highlightTitle?: string;
  highlightLines: string[];
  zodiacName?: string;
  zodiacGlyph?: string;
  zodiacEnglish?: string;
  energyValue?: string;
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
      if (record.recordType === 'bazi') {
        throw new BadRequestException('当前审核版已下线该类分享海报');
      }
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
        title: emotionPoster ? '心理健康评测' : report.sharePoster.title,
        subtitle: emotionPoster ? emotionPoster.subtitle : report.sharePoster.subtitle,
        accentText: emotionPoster ? emotionPoster.keywords.join(' · ') : report.sharePoster.accentText,
        footerText: emotionPoster ? emotionPoster.supportSignal : report.sharePoster.footerText,
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
        chips: emotionPoster ? emotionPoster.keywords : [],
        metrics: emotionPoster
          ? emotionPoster.dimensions.slice(0, 3).map((item) => ({
              label: item.label,
              value: String(item.value),
              hint: item.hint,
            }))
          : [],
        highlightLines: [],
        emotionPoster,
      };
    }

    if (dto.sourceType) {
      throw new BadRequestException('当前审核版已下线该类分享海报');
    }

    throw new BadRequestException('海报生成参数不完整');
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

  private clampPosterScore(value: number, fallback: number) {
    if (!Number.isFinite(value)) {
      return fallback;
    }

    return Math.min(99, Math.max(60, Math.round(value)));
  }

  private buildVisualPromptKeywords(source: PosterSource) {
    const blockedPattern =
      /[\u4e00-\u9fa5]{5,}|今日|指数|行动|建议|完成|目标|数字|分享|海报|卡片|标签|文案|标题/;
    const keywords = source.promptKeywords
      .map((keyword) => keyword.trim())
      .filter(Boolean)
      .filter((keyword) => !blockedPattern.test(keyword));

    if (keywords.length) {
      return keywords.slice(0, 10);
    }

    return [
      'soft ambient glow',
      'mist',
      'flowing light',
      'large clean negative space',
    ];
  }

  private buildProviderPrompt(source: PosterSource) {
    const visualKeywords = this.buildVisualPromptKeywords(source);
    const colorMood = this.resolveProviderColorMood(source.themeName);
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
    if (sourceType === 'emotion') {
      return 'emotion-care-assessment-poster-941x1672-v1';
    }

    if (kind === 'portrait') {
      return 'portrait-share-template-v1';
    }

    return 'square-share-template-v1';
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
    const sourceType = this.pickString(input.sourceType, 'emotion');
    const allowedSourceTypes = new Set(['emotion', 'personality']);

    if (!allowedSourceTypes.has(sourceType)) {
      throw new BadRequestException('不支持的小程序码场景');
    }

    const sourceCode = this.pickString(input.sourceCode, '');
    const recordId = this.pickString(input.recordId, '');

    return {
      sourceType,
      sourceCode: sourceCode || null,
      recordId: recordId || null,
      title: '分享海报',
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
    if (source.sourceType === 'emotion' || source.sourceType === 'personality') {
      return 'pages/report/index';
    }

    return 'pages/index/index';
  }

  private resolveMiniProgramCodeQuery(
    source: PosterSource,
  ): Record<string, string> {
    if (source.sourceType === 'emotion' || source.sourceType === 'personality') {
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
