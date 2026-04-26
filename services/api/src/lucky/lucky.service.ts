import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'node:crypto';
import { IsNull, Repository } from 'typeorm';
import { ImageGenerationService } from '../common/image-generation.service';
import { PosterRendererService, WallpaperLayout } from '../common/poster-renderer.service';
import { AppConfigEntity } from '../database/entities/app-config.entity';
import { FortuneContentEntity } from '../database/entities/fortune-content.entity';
import { LuckyItemEntity } from '../database/entities/lucky-item.entity';
import { PosterJobEntity } from '../database/entities/poster-job.entity';
import { UserRecordEntity } from '../database/entities/user-record.entity';
import { UserEntity } from '../database/entities/user.entity';
import { GenerateLuckyWallpaperDto } from './dto/generate-lucky-wallpaper.dto';
import { LUCKY_ITEM_SEEDS, LUCKY_SIGN_SEEDS } from './lucky.constants';

type LuckySignContent = {
  tag?: string;
  interpretation?: string;
  mantra?: string;
  favorableWindow?: string;
  goodFor?: string;
  avoid?: string;
  suggestions?: string[];
  accent?: string;
};

type LuckyItemContent = {
  category?: string;
  elements?: string[];
  zodiacs?: string[];
  useMoment?: string;
  styleHint?: string;
  recommendationReason?: string;
  palette?: string[];
  wallpaperPrompt?: string;
};

type LuckyRecentSignals = {
  personality?: {
    key: string | null;
    label: string | null;
    title: string;
    completedAt: string;
  };
  emotion?: {
    riskLevel: string | null;
    title: string;
    completedAt: string;
  };
  bazi?: {
    dominantElement: string | null;
    title: string;
    completedAt: string;
  };
};

type LuckyRecommendationRule = {
  personalityKeys: string[];
  emotionLevels: string[];
  supportiveFocus: string;
  focusTags: string[];
};

type LuckyRecommendationPolicy = {
  maxItems: number;
  wallpaperThemeCount: number;
};

type LuckyRecommendationConfig = {
  defaultBaseScore: number;
  elementBoost: number;
  zodiacBoost: number;
  baziBoost: number;
  personalityBoost: number;
  emotionBoost: number;
  emotionSteadyBoost: number;
  rules: Record<string, LuckyRecommendationRule>;
};

const DEFAULT_PALETTE = ['#d7f0e6', '#edf8f6', '#9ccdb7'];
const DEFAULT_RECOMMENDATION_POLICY: LuckyRecommendationPolicy = {
  maxItems: 3,
  wallpaperThemeCount: 2,
};

const RECOMMENDATION_RULES: Record<string, LuckyRecommendationRule> = {
  'item-mint-notebook': {
    personalityKeys: ['drive', 'spark'],
    emotionLevels: ['steady', 'watch'],
    supportiveFocus: '适合把灵感、待办和心绪重新收拢，先让今天恢复一点轻快的秩序感。',
    focusTags: ['轻量推进', '整理思路'],
  },
  'item-metal-pen': {
    personalityKeys: ['drive', 'clarity', 'balance'],
    emotionLevels: ['steady'],
    supportiveFocus: '更适合需要做决定、划重点和建立边界感的时候。',
    focusTags: ['清晰判断', '建立边界'],
  },
  'item-amber-cup': {
    personalityKeys: ['warmth', 'empathy', 'balance'],
    emotionLevels: ['watch', 'support', 'urgent'],
    supportiveFocus: '更偏向补能、缓压和慢下来，适合先把身体和情绪放回稳定区。',
    focusTags: ['补能缓压', '稳定情绪'],
  },
  'item-crystal-tray': {
    personalityKeys: ['balance', 'clarity'],
    emotionLevels: ['watch', 'support'],
    supportiveFocus: '通过整理空间来帮助心绪归位，适合需要恢复秩序感的时候。',
    focusTags: ['空间整理', '恢复秩序'],
  },
  'item-ocean-scarf': {
    personalityKeys: ['warmth', 'spark', 'empathy'],
    emotionLevels: ['steady', 'watch'],
    supportiveFocus: '适合轻社交、表达和连接，让今天的状态更柔和也更有流动感。',
    focusTags: ['轻社交', '表达连接'],
  },
  'item-forest-perfume': {
    personalityKeys: ['balance', 'clarity', 'drive'],
    emotionLevels: ['watch', 'support', 'urgent'],
    supportiveFocus: '适合找回专注、沉静和边界感，先把注意力慢慢拉回自己身上。',
    focusTags: ['专注沉静', '找回边界'],
  },
};

const DEFAULT_RECOMMENDATION_CONFIG: LuckyRecommendationConfig = {
  defaultBaseScore: 68,
  elementBoost: 12,
  zodiacBoost: 9,
  baziBoost: 6,
  personalityBoost: 8,
  emotionBoost: 10,
  emotionSteadyBoost: 4,
  rules: RECOMMENDATION_RULES,
};

@Injectable()
export class LuckyService {
  constructor(
    @InjectRepository(FortuneContentEntity)
    private readonly fortuneContentRepository: Repository<FortuneContentEntity>,
    @InjectRepository(LuckyItemEntity)
    private readonly luckyItemRepository: Repository<LuckyItemEntity>,
    @InjectRepository(AppConfigEntity)
    private readonly appConfigRepository: Repository<AppConfigEntity>,
    @InjectRepository(UserRecordEntity)
    private readonly userRecordRepository: Repository<UserRecordEntity>,
    @InjectRepository(PosterJobEntity)
    private readonly posterJobRepository: Repository<PosterJobEntity>,
    private readonly configService: ConfigService,
    private readonly imageGenerationService: ImageGenerationService,
    private readonly posterRendererService: PosterRendererService,
  ) {}

  async getToday(user: UserEntity | null) {
    await this.ensureSeedData();
    const recommendationPolicy = await this.resolveRecommendationPolicy();

    const sign = await this.resolveTodaySign();
    const signals = await this.resolveRecentSignals(user);
    const dominantElement = this.resolveDominantElement(user, signals.bazi?.dominantElement ?? null);
    const recommendations = await this.resolveRecommendations(
      user,
      signals,
      dominantElement,
      recommendationPolicy.maxItems,
    );
    const todayLuckyScore = this.buildTodayLuckyScore(user, dominantElement);
    const annualLuckyScore = this.buildAnnualLuckyScore(user, dominantElement);
    const signContent = this.readSignContent(sign);

    return this.buildEnvelope({
      profile: {
        personalized: Boolean(user),
        nickname: user?.nickname ?? null,
        zodiac: user?.zodiac ?? null,
        dominantElement,
        guidance: this.buildGuidance(user, signals, dominantElement),
      },
      scores: {
        today: {
          label: '今日幸运指数',
          value: String(todayLuckyScore),
          hint: this.buildScoreHint(todayLuckyScore),
        },
        annual: {
          label: '年度幸运指数',
          value: String(annualLuckyScore),
          hint: this.buildAnnualHint(annualLuckyScore),
        },
      },
      sign: {
        bizCode: sign.bizCode,
        title: sign.title,
        summary: sign.summary ?? '今天适合留一点缓冲，再做坚定决定。',
        tag: signContent.tag ?? '今日吉签',
        mantra: signContent.mantra ?? '稳住节奏，好运会慢慢靠近。',
        accent: signContent.accent ?? 'mint',
        themeKey: this.resolveDailyThemeKey(
          this.readSharePoster(sign, signContent).themeName,
        ),
      },
      actionTips: signContent.suggestions ?? [
        '先完成最重要的一小步，再决定下一步。',
        '给自己留一点回看空间，会更容易做出清晰判断。',
      ],
      recommendations,
      wallpaperThemes: recommendations.slice(0, recommendationPolicy.wallpaperThemeCount).map((item, index) => ({
        id: `${item.bizCode}-wallpaper`,
        sourceBizCode: item.bizCode,
        title: `${item.title} 壁纸主题`,
        prompt: item.wallpaperPrompt,
        palette: item.palette,
        mood: index === 0 ? '主推' : '备选',
      })),
    });
  }

  async getTodaySignSnapshot() {
    await this.ensureSeedData();
    const sign = await this.resolveTodaySign();
    const content = this.readSignContent(sign);
    const sharePoster = this.readSharePoster(sign, content);

    return {
      bizCode: sign.bizCode,
      title: sign.title,
      summary: sign.summary ?? '把节奏放慢一点，今天更适合温柔但清晰的推进。',
      tag: content.tag ?? '今日吉签',
      themeName: sharePoster.themeName,
    };
  }

  async getSignDetail(bizCode: string, user: UserEntity | null) {
    await this.ensureSeedData();

    const sign = await this.fortuneContentRepository.findOne({
      where: {
        contentType: 'lucky_sign',
        bizCode,
        status: 'published',
      },
      order: {
        publishDate: 'DESC',
        id: 'DESC',
      },
    });

    if (!sign) {
      throw new NotFoundException('幸运签暂未开放');
    }

    const content = this.readSignContent(sign);
    const sharePoster = this.readSharePoster(sign, content);

    return this.buildEnvelope({
      profile: {
        personalized: Boolean(user),
        zodiac: user?.zodiac ?? null,
        dominantElement: this.resolveDominantElement(user, null),
      },
      sign: {
        bizCode: sign.bizCode,
        title: sign.title,
        summary: sign.summary ?? '先稳住节奏，再顺势推进。',
        tag: content.tag ?? '今日吉签',
        interpretation:
          content.interpretation ?? '今天更适合在柔和中保持明确，让判断回到自己手里。',
        mantra: content.mantra ?? '先稳住自己，再打开好运。',
        favorableWindow: content.favorableWindow ?? '今天的平稳时段',
        goodFor: content.goodFor ?? '适合做轻量而清晰的推进。',
        avoid: content.avoid ?? '避免在疲惫或情绪化时做重大决定。',
        suggestions: content.suggestions ?? [],
        sharePoster,
        themeKey: this.resolveDailyThemeKey(sharePoster.themeName),
      },
    });
  }

  async getYearlyDetail(user: UserEntity | null, year?: number) {
    await this.ensureSeedData();
    const targetYear = year && year >= 2024 ? year : new Date().getFullYear();
    const signals = await this.resolveRecentSignals(user);
    const dominantElement = this.resolveDominantElement(user, signals.bazi?.dominantElement ?? null);
    const config = await this.resolveYearlyConfig();
    const annualLuckyScore = this.buildAnnualLuckyScore(user, dominantElement);
    const themeKey = this.resolveThemeKeyByElement(dominantElement);

    return this.buildEnvelope({
      year: targetYear,
      profile: {
        personalized: Boolean(user),
        nickname: user?.nickname ?? null,
        zodiac: user?.zodiac ?? null,
        dominantElement,
      },
      score: {
        label: '年度幸运指数',
        value: String(annualLuckyScore),
        hint: this.buildAnnualHint(annualLuckyScore),
      },
      theme: {
        title: this.pickString(config.title, `${targetYear} 年度幸运节奏`),
        summary: this.pickString(
          config.summary,
          `这一年适合围绕${dominantElement}元素，把优势沉淀成可持续的日常节奏。`,
        ),
        themeKey,
      },
      quarters: this.pickObjectArray(config.quarters).slice(0, 4).map((item, index) => ({
        label: this.pickString(item.label, `Q${index + 1}`),
        title: this.pickString(item.title, ['整理基础', '主动推进', '复盘调频', '沉淀成果'][index] ?? '年度节奏'),
        summary: this.pickString(
          item.summary,
          `这一阶段适合把${dominantElement}元素的优势放进更具体的行动里。`,
        ),
      })),
      annualFocus: [
        `${dominantElement}元素主轴`,
        signals.personality?.label ? `${signals.personality.label}节奏` : '稳定输出',
        signals.emotion?.riskLevel ? this.buildEmotionTag(signals.emotion.riskLevel) : '长期复盘',
      ],
    });
  }

  async getRecommendations(user: UserEntity | null) {
    await this.ensureSeedData();
    const policy = await this.resolveRecommendationPolicy();
    const signals = await this.resolveRecentSignals(user);
    const dominantElement = this.resolveDominantElement(user, signals.bazi?.dominantElement ?? null);
    const recommendations = await this.resolveRecommendations(
      user,
      signals,
      dominantElement,
      policy.maxItems,
    );

    return this.buildEnvelope({
      profile: {
        personalized: Boolean(user),
        zodiac: user?.zodiac ?? null,
        dominantElement,
      },
      themeKey: this.resolveThemeKeyByElement(dominantElement),
      items: recommendations,
    });
  }

  async generateWallpaper(input: GenerateLuckyWallpaperDto, user: UserEntity | null) {
    await this.ensureSeedData();

    const sourceItem =
      typeof input.sourceBizCode === 'string' && input.sourceBizCode
        ? await this.luckyItemRepository.findOne({
            where: {
              bizCode: input.sourceBizCode,
              status: 'published',
            },
            order: {
              sortOrder: 'ASC',
              id: 'DESC',
            },
          })
        : null;

    const sourceContent = sourceItem ? this.readItemContent(sourceItem) : null;
    const signals = await this.resolveRecentSignals(user);
    const dominantElement = this.resolveDominantElement(user, signals.bazi?.dominantElement ?? null);
    const title = this.pickString(input.title, sourceItem?.title, '今日幸运壁纸');
    const prompt = this.pickString(
      input.prompt,
      sourceContent?.wallpaperPrompt,
      'clean apple style wallpaper, airy composition, soft daylight',
    );
    const palette = this.normalizePalette(input.palette ?? sourceContent?.palette ?? DEFAULT_PALETTE);
    const mood = this.pickString(input.mood, '主推');
    const layout = this.posterRendererService.resolveWallpaperLayout(input.aspectRatio);
    const subtitle = this.buildWallpaperSubtitle(user, signals, dominantElement);
    const guidance = this.buildWallpaperGuidance(user, signals, sourceItem?.title ?? title);
    const chips = this.buildWallpaperChips(user, dominantElement, signals, mood);
    const wallpaperPrompt = this.buildProviderWallpaperPrompt({
      title,
      prompt,
      mood,
      palette,
      guidance,
      chips,
    });
    const providerAsset = await this.resolveWallpaperImage(
      wallpaperPrompt,
      {
        layout,
        title,
        subtitle,
        guidance,
        chips,
        palette,
      },
      title,
    );
    const payload = {
      title,
      subtitle,
      guidance,
      prompt,
      palette,
      mood,
      aspectRatio: layout.aspectRatio,
      width: layout.width,
      height: layout.height,
      format: providerAsset.format,
      provider: providerAsset.provider,
      providerStatus: providerAsset.status,
      providerImageUrl: providerAsset.providerImageUrl,
      providerRequestId: providerAsset.providerRequestId,
      providerError: providerAsset.providerError,
      fileUrl: providerAsset.fileUrl,
      generatedAt: new Date().toISOString(),
      downloadFileName: `fortune-hub-${this.slugify(title)}-wallpaper.${providerAsset.extension}`,
      imageDataUrl: providerAsset.imageDataUrl,
    };

    return this.buildEnvelope({
      wallpaper: this.buildPublicImagePayload(payload),
    });
  }

  async createWallpaperJob(input: GenerateLuckyWallpaperDto, user: UserEntity | null) {
    const job = await this.posterJobRepository.save(
      this.posterJobRepository.create({
        jobId: `wallpaper_job_${randomBytes(10).toString('hex')}`,
        userId: user?.id ?? null,
        jobType: 'lucky_wallpaper',
        status: 'queued',
        requestJson: input as Record<string, unknown>,
        resultJson: null,
        fileUrl: null,
        errorMessage: null,
        startedAt: null,
        finishedAt: null,
      }),
    );

    void this.processWallpaperJob(job.jobId, user).catch((error) => {
      console.warn('wallpaper job failed', error);
    });

    return this.buildEnvelope({
      job: this.serializeWallpaperJob(job),
    });
  }

  async getWallpaperJob(jobId: string, user: UserEntity | null) {
    const job = await this.posterJobRepository.findOne({ where: { jobId } });

    if (!job || job.jobType !== 'lucky_wallpaper' || (job.userId && job.userId !== user?.id)) {
      throw new NotFoundException('壁纸任务不存在或无权访问');
    }

    return this.buildEnvelope({
      job: this.serializeWallpaperJob(job),
    });
  }

  private async processWallpaperJob(jobId: string, user: UserEntity | null) {
    const job = await this.posterJobRepository.findOne({ where: { jobId } });

    if (!job) {
      return;
    }

    job.status = 'processing';
    job.startedAt = new Date();
    await this.posterJobRepository.save(job);

    try {
      const response = await this.generateWallpaper(job.requestJson as GenerateLuckyWallpaperDto, user);
      job.status = 'completed';
      job.resultJson = this.buildStoredWallpaperPayload(
        response.data.wallpaper as Record<string, unknown>,
      );
      job.fileUrl =
        typeof response.data.wallpaper.fileUrl === 'string'
          ? response.data.wallpaper.fileUrl
          : null;
      job.finishedAt = new Date();
      job.errorMessage = null;
    } catch (error) {
      job.status = 'failed';
      job.errorMessage = error instanceof Error ? error.message : '壁纸生成失败';
      job.finishedAt = new Date();
    }

    await this.posterJobRepository.save(job);
  }

  private buildProviderWallpaperPrompt(input: {
    title: string;
    prompt: string;
    mood: string;
    palette: string[];
    guidance: string;
    chips: string[];
  }) {
    return [
      input.prompt,
      `主题：${input.title}`,
      `情绪：${input.mood}`,
      `色彩：${input.palette.join(', ')}`,
      `氛围：${input.guidance}`,
      `关键词：${input.chips.join(', ')}`,
      'mobile wallpaper background illustration only, premium lifestyle still life, clean composition, soft daylight, no text, no letters, no numbers, no logo, no watermark, no people, no UI cards, high detail',
    ]
      .filter(Boolean)
      .join('。');
  }

  private async resolveWallpaperImage(
    prompt: string,
    renderInput: {
      layout: WallpaperLayout;
      title: string;
      subtitle: string;
      guidance: string;
      chips: string[];
      palette: string[];
    },
    title: string,
  ) {
    if (!this.imageGenerationService.isConfigured()) {
      return this.buildFallbackWallpaperAsset(renderInput, title, '未配置 ZHIPU_API_KEY 或 BIGMODEL_API_KEY');
    }

    try {
      const asset = await this.imageGenerationService.generate({
        prompt,
        size: this.imageGenerationService.getWallpaperSize(renderInput.layout.aspectRatio),
        purpose: '幸运壁纸背景',
      });
      const rendered = await this.posterRendererService.renderWallpaper({
        ...renderInput,
        backgroundDataUrl: asset.imageDataUrl,
      });
      const fileUrl = await this.persistWallpaperFile(
        rendered.imageBuffer,
        `fortune-hub-${this.slugify(title)}-wallpaper.png`,
      );

      return {
        provider: rendered.usedProviderBackground ? 'zhipu' : 'builtin',
        status: rendered.usedProviderBackground ? 'generated' : 'fallback',
        providerImageUrl: asset.providerImageUrl,
        providerRequestId: asset.requestId,
        providerError: rendered.usedProviderBackground ? null : '智谱背景渲染失败，已使用内建模板',
        fileUrl,
        format: 'png',
        extension: 'png',
        imageDataUrl: rendered.imageDataUrl,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '智谱幸运壁纸生成失败';
      console.warn('lucky wallpaper fallback to builtin', errorMessage);
      return this.buildFallbackWallpaperAsset(renderInput, title, errorMessage);
    }
  }

  private async buildFallbackWallpaperAsset(
    renderInput: {
      layout: WallpaperLayout;
      title: string;
      subtitle: string;
      guidance: string;
      chips: string[];
      palette: string[];
    },
    title: string,
    providerError: string | null,
  ) {
    const rendered = await this.posterRendererService.renderWallpaper(renderInput);
    const fileUrl = await this.persistWallpaperFile(
      rendered.imageBuffer,
      `fortune-hub-${this.slugify(title)}-wallpaper.png`,
    );

    return {
      provider: 'builtin',
      status: 'fallback',
      providerImageUrl: null,
      providerRequestId: null,
      providerError,
      fileUrl,
      format: 'png',
      extension: 'png',
      imageDataUrl: rendered.imageDataUrl,
    };
  }

  private async persistWallpaperFile(imageBuffer: Buffer, fileName: string) {
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
    formData.append('bizType', 'lucky-wallpaper');
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
        12_000,
        '壁纸文件上传超时，已保留内联图片',
      );
      const payload = (await response.json().catch(() => null)) as
        | {
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
        throw new Error(timeoutMessage);
      }

      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  private async ensureSeedData() {
    await this.ensureContentSeeds(LUCKY_SIGN_SEEDS);
    await this.ensureLuckyItemSeeds();
    await this.ensureLuckyConfigSeeds();
  }

  private async ensureContentSeeds(
    seeds: Array<{
      contentType: string;
      bizCode: string;
      title: string;
      summary: string | null;
      publishDate: string | null;
      status: string;
      contentJson: Record<string, unknown>;
    }>,
  ) {
    const existing = await this.fortuneContentRepository.find({
      where: seeds.map((seed) => ({
        contentType: seed.contentType,
        bizCode: seed.bizCode,
      })),
    });
    const existingKeys = new Set(existing.map((item) => `${item.contentType}:${item.bizCode}`));
    const missing = seeds.filter(
      (seed) => !existingKeys.has(`${seed.contentType}:${seed.bizCode}`),
    );

    if (!missing.length) {
      return;
    }

    await this.fortuneContentRepository.save(
      missing.map((seed) =>
        this.fortuneContentRepository.create({
          ...seed,
        }),
      ),
    );
  }

  private async ensureLuckyItemSeeds() {
    const existing = await this.luckyItemRepository.find({
      where: LUCKY_ITEM_SEEDS.map((seed) => ({
        bizCode: seed.bizCode,
      })),
    });
    const existingCodes = new Set(existing.map((item) => item.bizCode));
    const missing = LUCKY_ITEM_SEEDS.filter((seed) => !existingCodes.has(seed.bizCode));

    if (!missing.length) {
      return;
    }

    await this.luckyItemRepository.save(
      missing.map((seed) =>
        this.luckyItemRepository.create({
          ...seed,
          publishedAt: seed.status === 'published' ? new Date() : null,
          archivedAt: null,
        }),
      ),
    );
  }

  private async ensureLuckyConfigSeeds() {
    const existing = await this.appConfigRepository.findOne({
      where: {
        namespace: 'lucky',
        configKey: 'recommendation_policy',
      },
    });

    if (existing) {
      return;
    }

    await this.appConfigRepository.save(
      this.appConfigRepository.create({
        namespace: 'lucky',
        configKey: 'recommendation_policy',
        title: '幸运推荐策略',
        description: '控制幸运物推荐条数与壁纸主题输出数量。',
        valueType: 'json',
        valueJson: { ...DEFAULT_RECOMMENDATION_POLICY },
        status: 'published',
        publishedAt: new Date(),
        archivedAt: null,
      }),
    );

    const rulesConfig = await this.appConfigRepository.findOne({
      where: {
        namespace: 'lucky',
        configKey: 'recommendation_rules',
      },
    });

    if (!rulesConfig) {
      await this.appConfigRepository.save(
        this.appConfigRepository.create({
          namespace: 'lucky',
          configKey: 'recommendation_rules',
          title: '幸运推荐规则',
          description: '控制幸运物推荐的适配分和标签。',
          valueType: 'json',
          valueJson: {
            ...DEFAULT_RECOMMENDATION_CONFIG,
            rules: Object.fromEntries(
              Object.entries(RECOMMENDATION_RULES).map(([key, value]) => [
                key,
                {
                  ...value,
                  personalityKeys: [...value.personalityKeys],
                  emotionLevels: [...value.emotionLevels],
                  focusTags: [...value.focusTags],
                },
              ]),
            ),
          },
          status: 'published',
          publishedAt: new Date(),
          archivedAt: null,
        }),
      );
    }
  }

  private async resolveTodaySign() {
    const today = this.getTodayDate();
    const datedSigns = await this.fortuneContentRepository.find({
      where: {
        contentType: 'lucky_sign',
        status: 'published',
        publishDate: today,
      },
      order: {
        id: 'ASC',
      },
    });

    if (datedSigns.length) {
      return datedSigns[0];
    }

    const generalSigns = await this.fortuneContentRepository.find({
      where: {
        contentType: 'lucky_sign',
        status: 'published',
        publishDate: IsNull(),
      },
      order: {
        id: 'ASC',
      },
    });

    if (!generalSigns.length) {
      throw new NotFoundException('今日幸运签暂未开放');
    }

    const pickIndex = this.buildDateSeed() % generalSigns.length;
    return generalSigns[pickIndex];
  }

  private async resolveRecommendations(
    user: UserEntity | null,
    signals: LuckyRecentSignals,
    dominantElement: string,
    maxItems: number,
  ) {
    const items = await this.luckyItemRepository.find({
      where: {
        status: 'published',
      },
      order: {
        sortOrder: 'ASC',
        id: 'ASC',
      },
    });

    const zodiac = user?.zodiac ?? null;
    const seed = this.buildDateSeed();
    const ruleConfig = await this.resolveRecommendationConfig();

    return items
      .map((item, index) => {
        const content = this.readItemContent(item);
        const rule = ruleConfig.rules[item.bizCode] ?? RECOMMENDATION_RULES[item.bizCode];
        const fitTags: string[] = [];
        let fitScore = ruleConfig.defaultBaseScore + ((seed + index * 9) % 11);

        if (content.elements?.includes(dominantElement)) {
          fitScore += ruleConfig.elementBoost;
          fitTags.push(`${dominantElement}元素契合`);
        }

        if (zodiac && content.zodiacs?.includes(zodiac)) {
          fitScore += ruleConfig.zodiacBoost;
          fitTags.push(`${zodiac}节奏友好`);
        }

        if (
          signals.bazi?.dominantElement &&
          content.elements?.includes(signals.bazi.dominantElement) &&
          !fitTags.includes(`${signals.bazi.dominantElement}主轴呼应`)
        ) {
          fitScore += ruleConfig.baziBoost;
          fitTags.push(`${signals.bazi.dominantElement}主轴呼应`);
        }

        if (signals.personality?.key && rule?.personalityKeys.includes(signals.personality.key)) {
          fitScore += ruleConfig.personalityBoost;
          fitTags.push(`${signals.personality.label ?? '最近测评'}加成`);
        }

        if (signals.emotion?.riskLevel && rule?.emotionLevels.includes(signals.emotion.riskLevel)) {
          fitScore +=
            signals.emotion.riskLevel === 'steady'
              ? ruleConfig.emotionSteadyBoost
              : ruleConfig.emotionBoost;
          fitTags.push(this.buildEmotionTag(signals.emotion.riskLevel));
        }

        fitScore = Math.min(98, Math.max(72, fitScore));

        return {
          bizCode: item.bizCode,
          title: item.title,
          summary: item.summary ?? '今天适合把它放在你容易看见的位置。',
          category: item.category || content.category || '幸运物',
          fitScore,
          fitTags: [...fitTags, ...(rule?.focusTags ?? [])].slice(0, 4),
          highlight: content.recommendationReason ?? '今天它会帮你把节奏稳下来。',
          supportiveFocus:
            rule?.supportiveFocus ?? '它更适合帮你把节奏拉回稳定、舒展和清晰的状态。',
          useMoment: content.useMoment ?? '今天需要一点秩序和温柔的时候',
          styleHint: content.styleHint ?? '尽量选更轻盈、干净的配色。',
          palette: this.normalizePalette(content.palette ?? DEFAULT_PALETTE),
          wallpaperPrompt:
            content.wallpaperPrompt ??
            'clean apple style still life, soft light, airy product composition',
        };
      })
      .sort((left, right) => right.fitScore - left.fitScore)
      .slice(0, maxItems);
  }

  private async resolveRecommendationPolicy(): Promise<LuckyRecommendationPolicy> {
    const config = await this.appConfigRepository.findOne({
      where: {
        namespace: 'lucky',
        configKey: 'recommendation_policy',
        status: 'published',
      },
      order: {
        publishedAt: 'DESC',
        updatedAt: 'DESC',
      },
    });

    const payload = this.asRecord(config?.valueJson);

    return {
      maxItems: this.clampNumber(payload.maxItems, DEFAULT_RECOMMENDATION_POLICY.maxItems, 1, 6),
      wallpaperThemeCount: this.clampNumber(
        payload.wallpaperThemeCount,
        DEFAULT_RECOMMENDATION_POLICY.wallpaperThemeCount,
        1,
        4,
      ),
    };
  }

  private async resolveRecommendationConfig(): Promise<LuckyRecommendationConfig> {
    const config = await this.appConfigRepository.findOne({
      where: {
        namespace: 'lucky',
        configKey: 'recommendation_rules',
        status: 'published',
      },
      order: {
        publishedAt: 'DESC',
        updatedAt: 'DESC',
      },
    });
    const payload = this.asRecord(config?.valueJson);
    const rawRules = this.asRecord(payload.rules);

    return {
      defaultBaseScore: this.clampNumber(payload.defaultBaseScore, DEFAULT_RECOMMENDATION_CONFIG.defaultBaseScore, 0, 100),
      elementBoost: this.clampNumber(payload.elementBoost, DEFAULT_RECOMMENDATION_CONFIG.elementBoost, 0, 40),
      zodiacBoost: this.clampNumber(payload.zodiacBoost, DEFAULT_RECOMMENDATION_CONFIG.zodiacBoost, 0, 40),
      baziBoost: this.clampNumber(payload.baziBoost, DEFAULT_RECOMMENDATION_CONFIG.baziBoost, 0, 40),
      personalityBoost: this.clampNumber(payload.personalityBoost, DEFAULT_RECOMMENDATION_CONFIG.personalityBoost, 0, 40),
      emotionBoost: this.clampNumber(payload.emotionBoost, DEFAULT_RECOMMENDATION_CONFIG.emotionBoost, 0, 40),
      emotionSteadyBoost: this.clampNumber(payload.emotionSteadyBoost, DEFAULT_RECOMMENDATION_CONFIG.emotionSteadyBoost, 0, 40),
      rules: {
        ...RECOMMENDATION_RULES,
        ...Object.fromEntries(
          Object.entries(rawRules)
            .map(([key, value]) => [key, this.normalizeRecommendationRule(value)] as const)
            .filter((entry): entry is readonly [string, LuckyRecommendationRule] =>
              Boolean(entry[1]),
            ),
        ),
      },
    };
  }

  private async resolveYearlyConfig() {
    const config = await this.appConfigRepository.findOne({
      where: {
        namespace: 'lucky',
        configKey: 'yearly_detail',
        status: 'published',
      },
      order: {
        publishedAt: 'DESC',
        updatedAt: 'DESC',
      },
    });

    return this.asRecord(config?.valueJson);
  }

  private async resolveRecentSignals(user: UserEntity | null): Promise<LuckyRecentSignals> {
    if (!user) {
      return {};
    }

    const records = await this.userRecordRepository.find({
      where: {
        userId: user.id,
      },
      order: {
        createdAt: 'DESC',
      },
      take: 8,
    });

    const signals: LuckyRecentSignals = {};

    for (const record of records) {
      if (record.recordType === 'personality' && !signals.personality) {
        const resultData = record.resultData as {
          dominantDimension?: { key?: string; label?: string };
          completedAt?: string;
        };

        signals.personality = {
          key: resultData.dominantDimension?.key ?? null,
          label: resultData.dominantDimension?.label ?? null,
          title: record.resultTitle,
          completedAt: resultData.completedAt ?? record.createdAt.toISOString(),
        };
      }

      if (record.recordType === 'emotion' && !signals.emotion) {
        const resultData = record.resultData as {
          riskLevel?: string;
          completedAt?: string;
        };

        signals.emotion = {
          riskLevel: resultData.riskLevel ?? record.resultLevel ?? null,
          title: record.resultTitle,
          completedAt: resultData.completedAt ?? record.createdAt.toISOString(),
        };
      }

      if (record.recordType === 'bazi' && !signals.bazi) {
        const resultData = record.resultData as {
          dominantElement?: { name?: string };
          generatedAt?: string;
        };

        signals.bazi = {
          dominantElement: resultData.dominantElement?.name ?? record.resultLevel ?? null,
          title: record.resultTitle,
          completedAt: resultData.generatedAt ?? record.createdAt.toISOString(),
        };
      }
    }

    return signals;
  }

  private resolveDominantElement(user: UserEntity | null, baziElement: string | null) {
    const fiveElements = user?.fiveElements;

    if (fiveElements && Object.keys(fiveElements).length) {
      return (
        Object.entries(fiveElements).sort((left, right) => right[1] - left[1])[0]?.[0] ?? '木'
      );
    }

    if (baziElement) {
      return baziElement;
    }

    const fallbackElements = ['木', '火', '土', '金', '水'] as const;
    return fallbackElements[this.buildDateSeed() % fallbackElements.length];
  }

  private buildGuidance(user: UserEntity | null, signals: LuckyRecentSignals, dominantElement: string) {
    if (signals.emotion?.riskLevel && ['support', 'urgent'].includes(signals.emotion.riskLevel)) {
      return `今天的推荐会优先照顾稳定感和减压节奏，先让${dominantElement}元素的恢复力托住你。`;
    }

    if (signals.personality?.label) {
      return user
        ? `今天的推荐会优先参考你的${dominantElement}能量，以及最近更突出的${signals.personality.label}节奏。`
        : `今天的推荐会参考最近更突出的${signals.personality.label}节奏，优先给你更顺手的搭配。`;
    }

    if (user) {
      return `今天的推荐优先参考了你的${dominantElement}能量和${user?.zodiac ?? '当前'}节奏。`;
    }

    return '登录并完善生日资料后，会结合你的星座、五行和最近结果做更个性化的推荐。';
  }

  private buildWallpaperSubtitle(
    user: UserEntity | null,
    signals: LuckyRecentSignals,
    dominantElement: string,
  ) {
    if (signals.emotion?.riskLevel && ['support', 'urgent'].includes(signals.emotion.riskLevel)) {
      return '先把今天调到更平稳、更安全、更能呼吸的频率。';
    }

    if (signals.personality?.label) {
      return `让${dominantElement}元素和${signals.personality.label}节奏一起，把今天慢慢推顺。`;
    }

    if (user?.zodiac) {
      return `把${user.zodiac}今天最顺的节奏，留成一张可以随时看见的壁纸。`;
    }

    return `给今天留下一张更贴近${dominantElement}元素气质的幸运壁纸。`;
  }

  private buildWallpaperGuidance(
    user: UserEntity | null,
    signals: LuckyRecentSignals,
    sourceTitle: string,
  ) {
    if (signals.emotion?.riskLevel && ['watch', 'support', 'urgent'].includes(signals.emotion.riskLevel)) {
      return `这张壁纸以“${sourceTitle}”为灵感，优先照顾最近的情绪恢复节奏，适合放在手机锁屏或桌面第一页。`;
    }

    if (signals.personality?.label) {
      return `这张壁纸会把${signals.personality.label}的节奏感留在视觉里，适合在需要推进或表达时提醒自己。`;
    }

    if (user?.zodiac) {
      return `这张壁纸会把${user.zodiac}今天更顺的状态留住，适合当作今天的视觉锚点。`;
    }

    return `这张壁纸会把今天的幸运物灵感保留下来，适合当作桌面或锁屏的轻提醒。`;
  }

  private buildWallpaperChips(
    user: UserEntity | null,
    dominantElement: string,
    signals: LuckyRecentSignals,
    mood: string,
  ) {
    const chips = [`${dominantElement}元素`, mood];

    if (user?.zodiac) {
      chips.unshift(user.zodiac);
    }

    if (signals.personality?.label) {
      chips.push(signals.personality.label);
    } else if (signals.emotion?.riskLevel) {
      chips.push(this.buildEmotionTag(signals.emotion.riskLevel));
    }

    return chips.slice(0, 4);
  }

  private buildScoreHint(score: number) {
    if (score >= 90) {
      return '今天适合发起沟通、做决定，也适合安排一点自我奖励。';
    }

    if (score >= 84) {
      return '今天适合先做清晰的小推进，再把节奏稳住。';
    }

    return '今天更适合轻量整理与收束，别一次塞太满。';
  }

  private buildAnnualHint(score: number) {
    if (score >= 92) {
      return '这一年更适合持续建设个人表达和长期计划。';
    }

    return '这一年适合把节奏感和稳定输出放在第一位。';
  }

  private buildTodayLuckyScore(user: UserEntity | null, dominantElement: string) {
    const elementSeed = dominantElement.charCodeAt(0);
    const profileSeed = user?.zodiac ? user.zodiac.charCodeAt(0) : 7;
    return 78 + ((this.buildDateSeed() + elementSeed + profileSeed) % 18);
  }

  private buildAnnualLuckyScore(user: UserEntity | null, dominantElement: string) {
    const elementSeed = dominantElement.charCodeAt(0);
    const profileSeed = user?.birthday ? Number(user.birthday.slice(8, 10)) : 5;
    return 85 + ((this.buildDateSeed() + elementSeed + profileSeed) % 12);
  }

  private buildEmotionTag(riskLevel: string) {
    if (riskLevel === 'steady') {
      return '稳定节奏优先';
    }

    if (riskLevel === 'watch') {
      return '减压缓冲优先';
    }

    if (riskLevel === 'support') {
      return '恢复照顾优先';
    }

    if (riskLevel === 'urgent') {
      return '安全支持优先';
    }

    return '今日状态联动';
  }

  private pickString(...values: unknown[]) {
    for (const value of values) {
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }

    return '';
  }

  private normalizePalette(input: string[]) {
    const palette = input
      .filter((item) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(item))
      .slice(0, 3);

    if (!palette.length) {
      return [...DEFAULT_PALETTE];
    }

    while (palette.length < 3) {
      palette.push(DEFAULT_PALETTE[palette.length - 1] ?? DEFAULT_PALETTE[0]);
    }

    return palette;
  }

  private serializeWallpaperJob(job: PosterJobEntity) {
    return {
      jobId: job.jobId,
      userId: job.userId,
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

  private buildStoredWallpaperPayload(payload: Record<string, unknown>) {
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

  private slugify(input: string) {
    const normalized = input
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return normalized || 'lucky';
  }

  private readSignContent(content: FortuneContentEntity) {
    return (content.contentJson ?? {}) as LuckySignContent;
  }

  private readSharePoster(content: FortuneContentEntity, signContent: LuckySignContent) {
    const sharePoster = this.asRecord(this.asRecord(content.contentJson).sharePoster);

    return {
      themeName: this.pickString(String(sharePoster.themeName ?? ''), 'fresh-mint'),
      title: this.pickString(String(sharePoster.title ?? ''), content.title),
      subtitle: this.pickString(
        String(sharePoster.subtitle ?? ''),
        content.summary ?? '今天适合先稳住节奏，再顺势推进。',
      ),
      accentText: this.pickString(
        String(sharePoster.accentText ?? ''),
        signContent.mantra ?? '先松一口气，再向前一步。',
      ),
      footerText: this.pickString(
        String(sharePoster.footerText ?? ''),
        'Fortune Hub · 今日幸运签',
      ),
    };
  }

  private readItemContent(content: { contentJson: Record<string, unknown> | null }) {
    return (content.contentJson ?? {}) as LuckyItemContent;
  }

  private normalizeRecommendationRule(value: unknown): LuckyRecommendationRule | null {
    const record = this.asRecord(value);
    const personalityKeys = this.pickStringList(record.personalityKeys);
    const emotionLevels = this.pickStringList(record.emotionLevels);
    const focusTags = this.pickStringList(record.focusTags);

    if (!personalityKeys.length && !emotionLevels.length && !focusTags.length) {
      return null;
    }

    return {
      personalityKeys,
      emotionLevels,
      supportiveFocus: this.pickString(
        typeof record.supportiveFocus === 'string' ? record.supportiveFocus : '',
        '它更适合帮你把节奏拉回稳定、舒展和清晰的状态。',
      ),
      focusTags,
    };
  }

  private pickStringList(value: unknown) {
    if (!Array.isArray(value)) {
      return [];
    }

    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  private pickObjectArray(value: unknown) {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .map((item) => this.asRecord(item))
      .filter((item) => Object.keys(item).length > 0);
  }

  private resolveThemeKeyByElement(element: string) {
    if (element === '木') {
      return 'mint_cyan';
    }

    if (element === '火') {
      return 'amber_honey';
    }

    if (element === '土') {
      return 'champagne_gold';
    }

    if (element === '金') {
      return 'moon_silver';
    }

    if (element === '水') {
      return 'sea_salt';
    }

    return 'mist_blue';
  }

  private resolveDailyThemeKey(themeName: string) {
    const normalized = themeName.toLowerCase();

    if (normalized.includes('mint')) {
      return 'mint_cyan';
    }

    if (
      normalized.includes('gold') ||
      normalized.includes('champagne') ||
      normalized.includes('oriental')
    ) {
      return 'champagne_gold';
    }

    if (normalized.includes('silver') || normalized.includes('metal')) {
      return 'moon_silver';
    }

    if (normalized.includes('amber') || normalized.includes('warm')) {
      return 'amber_honey';
    }

    if (normalized.includes('pink') || normalized.includes('rose')) {
      return 'rose_dust';
    }

    if (normalized.includes('lavender') || normalized.includes('violet')) {
      return 'lavender';
    }

    if (
      normalized.includes('ocean') ||
      normalized.includes('sea') ||
      normalized.includes('water')
    ) {
      return 'sea_salt';
    }

    return 'mist_blue';
  }

  private clampNumber(value: unknown, fallback: number, min: number, max: number) {
    const parsed = Number(value);

    if (!Number.isFinite(parsed)) {
      return fallback;
    }

    return Math.min(max, Math.max(min, Math.round(parsed)));
  }

  private asRecord(value: unknown) {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  }

  private buildEnvelope<TData>(data: TData) {
    return {
      code: 0,
      message: 'ok',
      data,
      timestamp: new Date().toISOString(),
    };
  }

  private buildDateSeed() {
    const now = new Date();
    return now.getFullYear() + (now.getMonth() + 1) * 31 + now.getDate() * 17;
  }

  private getTodayDate() {
    return new Date().toISOString().slice(0, 10);
  }
}
