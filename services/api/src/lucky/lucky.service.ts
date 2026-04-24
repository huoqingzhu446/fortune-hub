import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { AppConfigEntity } from '../database/entities/app-config.entity';
import { FortuneContentEntity } from '../database/entities/fortune-content.entity';
import { LuckyItemEntity } from '../database/entities/lucky-item.entity';
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

type LuckyWallpaperLayout = {
  aspectRatio: '9:16' | '16:9' | '1:1';
  width: number;
  height: number;
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
      },
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
    const layout = this.resolveWallpaperLayout(input.aspectRatio);
    const subtitle = this.buildWallpaperSubtitle(user, signals, dominantElement);
    const guidance = this.buildWallpaperGuidance(user, signals, sourceItem?.title ?? title);
    const chips = this.buildWallpaperChips(user, dominantElement, signals, mood);
    const svgMarkup = this.renderWallpaperSvg({
      width: layout.width,
      height: layout.height,
      title,
      subtitle,
      guidance,
      prompt,
      chips,
      palette,
    });

    return this.buildEnvelope({
      wallpaper: {
        title,
        subtitle,
        guidance,
        prompt,
        palette,
        mood,
        aspectRatio: layout.aspectRatio,
        width: layout.width,
        height: layout.height,
        format: 'svg',
        generatedAt: new Date().toISOString(),
        downloadFileName: `fortune-hub-${this.slugify(title)}-wallpaper.svg`,
        svgMarkup,
        imageDataUrl: `data:image/svg+xml;base64,${Buffer.from(svgMarkup).toString('base64')}`,
      },
    });
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

    return items
      .map((item, index) => {
        const content = this.readItemContent(item);
        const rule = RECOMMENDATION_RULES[item.bizCode];
        const fitTags: string[] = [];
        let fitScore = 68 + ((seed + index * 9) % 11);

        if (content.elements?.includes(dominantElement)) {
          fitScore += 12;
          fitTags.push(`${dominantElement}元素契合`);
        }

        if (zodiac && content.zodiacs?.includes(zodiac)) {
          fitScore += 9;
          fitTags.push(`${zodiac}节奏友好`);
        }

        if (
          signals.bazi?.dominantElement &&
          content.elements?.includes(signals.bazi.dominantElement) &&
          !fitTags.includes(`${signals.bazi.dominantElement}主轴呼应`)
        ) {
          fitScore += 6;
          fitTags.push(`${signals.bazi.dominantElement}主轴呼应`);
        }

        if (signals.personality?.key && rule?.personalityKeys.includes(signals.personality.key)) {
          fitScore += 8;
          fitTags.push(`${signals.personality.label ?? '最近测评'}加成`);
        }

        if (signals.emotion?.riskLevel && rule?.emotionLevels.includes(signals.emotion.riskLevel)) {
          fitScore += signals.emotion.riskLevel === 'steady' ? 4 : 10;
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

  private resolveWallpaperLayout(aspectRatio?: string): LuckyWallpaperLayout {
    if (aspectRatio === '16:9') {
      return {
        aspectRatio: '16:9',
        width: 1600,
        height: 900,
      };
    }

    if (aspectRatio === '1:1') {
      return {
        aspectRatio: '1:1',
        width: 1200,
        height: 1200,
      };
    }

    return {
      aspectRatio: '9:16',
      width: 1080,
      height: 1920,
    };
  }

  private renderWallpaperSvg(input: {
    width: number;
    height: number;
    title: string;
    subtitle: string;
    guidance: string;
    prompt: string;
    chips: string[];
    palette: string[];
  }) {
    const { width, height, palette } = input;
    const [colorA, colorB, colorC] = palette;
    const chipMarkup = input.chips
      .map((chip, index) => {
        const x = 92 + index * 210;
        return `
          <rect x="${x}" y="118" rx="32" ry="32" width="180" height="56" fill="rgba(255,255,255,0.44)" />
          <text x="${x + 90}" y="154" text-anchor="middle" font-size="24" fill="#1d2a36" font-family="SF Pro Display, PingFang SC, sans-serif">${this.escapeXml(chip)}</text>
        `;
      })
      .join('');

    const titleTspans = this.renderTextTspans(input.title, 20, 0, 66);
    const subtitleTspans = this.renderTextTspans(input.subtitle, 28, 0, 46);
    const guidanceTspans = this.renderTextTspans(input.guidance, 30, 0, 42);
    const promptTspans = this.renderTextTspans(`Prompt: ${input.prompt}`, 48, 0, 30);

    return `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bg" x1="0%" x2="100%" y1="0%" y2="100%">
      <stop offset="0%" stop-color="${colorA}" />
      <stop offset="55%" stop-color="${colorB}" />
      <stop offset="100%" stop-color="${colorC}" />
    </linearGradient>
    <radialGradient id="orbA" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.72" />
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)" />
  <circle cx="${Math.round(width * 0.16)}" cy="${Math.round(height * 0.14)}" r="${Math.round(width * 0.22)}" fill="url(#orbA)" />
  <circle cx="${Math.round(width * 0.86)}" cy="${Math.round(height * 0.22)}" r="${Math.round(width * 0.26)}" fill="rgba(255,255,255,0.18)" />
  <circle cx="${Math.round(width * 0.78)}" cy="${Math.round(height * 0.82)}" r="${Math.round(width * 0.3)}" fill="rgba(255,255,255,0.16)" />
  <rect x="64" y="72" width="${width - 128}" height="${height - 144}" rx="48" ry="48" fill="rgba(255,255,255,0.16)" stroke="rgba(255,255,255,0.28)" />
  ${chipMarkup}
  <text x="92" y="252" font-size="28" letter-spacing="7" fill="#34505a" font-family="SF Pro Display, PingFang SC, sans-serif">FORTUNE HUB WALLPAPER</text>
  <text x="92" y="358" font-size="72" font-weight="700" fill="#10202c" font-family="SF Pro Display, PingFang SC, sans-serif">${titleTspans}</text>
  <text x="92" y="560" font-size="36" fill="#1f3947" font-family="SF Pro Display, PingFang SC, sans-serif">${subtitleTspans}</text>
  <rect x="92" y="${Math.round(height * 0.46)}" width="${width - 184}" height="${Math.round(height * 0.22)}" rx="40" ry="40" fill="rgba(255,255,255,0.34)" />
  <text x="128" y="${Math.round(height * 0.52)}" font-size="34" fill="#142634" font-family="SF Pro Text, PingFang SC, sans-serif">${guidanceTspans}</text>
  <rect x="92" y="${Math.round(height * 0.79)}" width="${width - 184}" height="${Math.round(height * 0.12)}" rx="32" ry="32" fill="rgba(255,255,255,0.24)" />
  <text x="128" y="${Math.round(height * 0.84)}" font-size="22" fill="#284151" font-family="SF Pro Text, PingFang SC, sans-serif">${promptTspans}</text>
  <text x="92" y="${height - 88}" font-size="28" fill="#284151" font-family="SF Pro Display, PingFang SC, sans-serif">Generated at ${this.escapeXml(new Date().toLocaleDateString('zh-CN'))}</text>
</svg>`.trim();
  }

  private renderTextTspans(text: string, maxChars: number, firstDy: number, nextDy: number) {
    return this.splitText(text, maxChars)
      .map(
        (line, index) =>
          `<tspan x="92" dy="${index === 0 ? firstDy : nextDy}">${this.escapeXml(line)}</tspan>`,
      )
      .join('');
  }

  private splitText(text: string, maxChars: number) {
    const normalized = text.trim();

    if (!normalized) {
      return [''];
    }

    const lines: string[] = [];
    let current = '';

    for (const char of normalized) {
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

  private pickString(...values: Array<string | null | undefined>) {
    return values.find((value) => typeof value === 'string' && value.trim())?.trim() ?? '';
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

  private slugify(input: string) {
    const normalized = input
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return normalized || 'lucky';
  }

  private escapeXml(input: string) {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
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
