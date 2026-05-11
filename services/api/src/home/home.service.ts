import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppConfigEntity } from '../database/entities/app-config.entity';
import { MoodRecordEntity } from '../database/entities/mood-record.entity';
import { UserRecordEntity } from '../database/entities/user-record.entity';
import { UserEntity } from '../database/entities/user.entity';
import { EntitlementsService } from '../entitlements/entitlements.service';
import { LuckyService } from '../lucky/lucky.service';
import { RedisService } from '../redis/redis.service';

type ScoreMetric = {
  label: string;
  value: string;
  hint: string;
};

type StateFactor = {
  id: string;
  label: string;
  value: string;
  hint: string;
  tone: 'positive' | 'steady' | 'watch';
  numericValue: number;
};

type EmotionSignal = {
  sourceCode: string | null;
  title: string;
  riskLevel: string | null;
  primarySuggestion: string;
  supportSignal: string;
  completedAt: string;
  ageDays: number;
};

type PersonalitySignal = {
  title: string;
  score: number;
  dominantDimensionLabel: string | null;
  summary: string;
  completedAt: string;
  ageDays: number;
};

type BaziSignal = {
  title: string;
  dominantElement: string | null;
  dailyFocus: string;
  completedAt: string;
  ageDays: number;
};

type MoodSignal = {
  moodType: string;
  moodScore: number;
  emotionTags: string[];
  content: string;
  recordDate: string;
  updatedAt: string;
  ageDays: number;
};

type HomeSignals = {
  emotion: EmotionSignal[];
  mood: MoodSignal[];
  personality: PersonalitySignal | null;
  bazi: BaziSignal | null;
};

type StateOverview = {
  title: string;
  summary: string;
  primarySuggestion: string;
  confidenceLabel: string;
  evidenceLabel: string;
  disclaimer: string;
  basisTags: string[];
  factors: Array<Omit<StateFactor, 'numericValue'>>;
  currentScore: ScoreMetric;
  completionScore: ScoreMetric;
};

type HomeLayoutSection = {
  id: string;
  type: string;
  title: string;
  note: string;
  audience: string[];
  enabled: boolean;
  order: number;
  maxItems?: number;
};

type HomeQuickTool = {
  id: string;
  title: string;
  description: string;
  route: string;
  badge: string;
  icon: 'leaf' | 'journal' | 'orbit' | 'compass' | 'poster';
  enabled: boolean;
  order: number;
};

type HomeLayoutConfig = {
  version: number;
  grayPercent: number;
  sections: HomeLayoutSection[];
  quickTools: HomeQuickTool[];
};

type HomeTodayAction = {
  actionCode: string;
  badge: string;
  title: string;
  summary: string;
  primaryText: string;
  primaryRoute: string;
  secondaryText: string;
  secondaryRoute: string;
};

const HOME_STATE_DISCLAIMER =
  '指数用于帮助你观察当前节奏与自我认知进度，不构成医学或心理诊断。';

const EMOTION_BASE_SCORES: Record<string, number> = {
  steady: 84,
  watch: 66,
  support: 48,
  urgent: 30,
};

const MOOD_TYPE_SCORE_ADJUSTMENTS: Record<string, number> = {
  calm: 4,
  happy: 5,
  tired: -6,
  low: -9,
  anxious: -10,
};

const DEFAULT_HOME_LAYOUT: HomeLayoutConfig = {
  version: 1,
  grayPercent: 100,
  sections: [
    {
      id: 'hero',
      type: 'hero',
      title: '首页头图',
      note: '日期、主题色和状态欢迎语',
      audience: ['all'],
      enabled: true,
      order: 10,
    },
    {
      id: 'today_state',
      type: 'status_card',
      title: '今日状态',
      note: '当前状态指数与可信度说明',
      audience: ['all'],
      enabled: true,
      order: 20,
    },
    {
      id: 'today_action',
      type: 'action_card',
      title: '今日行动',
      note: '根据登录、资料、心情和压力状态动态生成',
      audience: ['all'],
      enabled: true,
      order: 30,
    },
    {
      id: 'state_insights',
      type: 'insight_grid',
      title: '状态洞察',
      note: '优先参考近期自述，不做诊断判断',
      audience: ['logged_in', 'profile_incomplete', 'active', 'vip'],
      enabled: true,
      order: 40,
      maxItems: 4,
    },
    {
      id: 'fortune_actions',
      type: 'fortune_card',
      title: '轻量探索',
      note: '今日占卜与行动提醒',
      audience: ['all'],
      enabled: true,
      order: 50,
    },
    {
      id: 'quick_tools',
      type: 'quick_tools',
      title: '快捷工具',
      note: '保留常用入口，减少首屏干扰',
      audience: ['all'],
      enabled: true,
      order: 60,
      maxItems: 4,
    },
  ],
  quickTools: [
    {
      id: 'meditation',
      title: '冥想',
      description: '放松',
      route: '/pages/meditation/index',
      badge: '放松',
      icon: 'leaf',
      enabled: true,
      order: 10,
    },
    {
      id: 'journal',
      title: '日记',
      description: '记录',
      route: '/pages/journal/index',
      badge: '记录',
      icon: 'journal',
      enabled: true,
      order: 20,
    },
    {
      id: 'divination',
      title: '占卜',
      description: '提问',
      route: '/pages/divination/index/index',
      badge: '提问',
      icon: 'orbit',
      enabled: true,
      order: 30,
    },
    {
      id: 'poster',
      title: '海报',
      description: '分享',
      route: '/pages/poster/generate/index?type=today&auto=1',
      badge: '分享',
      icon: 'poster',
      enabled: true,
      order: 40,
    },
  ],
};

@Injectable()
export class HomeService {
  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly luckyService: LuckyService,
    private readonly entitlementsService: EntitlementsService,
    @InjectRepository(UserRecordEntity)
    private readonly userRecordRepository: Repository<UserRecordEntity>,
    @InjectRepository(MoodRecordEntity)
    private readonly moodRecordRepository: Repository<MoodRecordEntity>,
    @InjectRepository(AppConfigEntity)
    private readonly appConfigRepository: Repository<AppConfigEntity>,
  ) {}

  async getHomeIndex(user: UserEntity | null) {
    const luckySign = await this.luckyService.getTodaySignSnapshot();
    const dailyThemeKey = this.resolveDailyThemeKey(
      this.pickString((luckySign as { themeName?: string }).themeName, ''),
    );
    const integrations = this.buildIntegrations();
    const signals = user
      ? await this.loadHomeSignals(user.id)
      : this.createEmptySignals();
    const stateOverview = this.buildStateOverview(user, signals);
    const isLoggedIn = Boolean(user);
    const profileCompleted = Boolean(
      user?.birthday &&
      user?.birthTime &&
      this.resolveUserBirthPlace(user) &&
      user?.zodiac &&
      user?.gender !== 'unknown',
    );
    const isVipActive = this.entitlementsService.isMembershipActive(user);

    const featureEntries = [
      {
        id: 'personality',
        title: '性格测评',
        description: '识别你更自然的推进方式，帮助理解自己为什么会这样反应。',
        route: '/pages/personality/index',
        badge: '先做这个',
      },
      {
        id: 'emotion',
        title: '情绪自检',
        description: '用 3 分钟观察近一周的紧张或低落变化，优先看当前状态。',
        route: '/pages/emotion/index',
        badge: '当前状态',
      },
      {
        id: 'bazi',
        title: '八字解读',
        description: '把生日资料转成节奏参考，用来补充个性化表达和提示。',
        route: '/pages/bazi/index',
        badge: '个性化参考',
      },
      {
        id: 'zodiac',
        title: '星座运势',
        description: '把星座当作轻量标签，提供更容易阅读的节律化提示。',
        route: '/pages/zodiac/index',
        badge: '轻量标签',
      },
      {
        id: 'lucky-item',
        title: '幸运物',
        description: '把当前状态翻译成更轻松的内容化表达、分享图和日常提醒。',
        route: '/pages/lucky/index',
        badge: '内容化',
      },
    ];

    const quickEntries = [
      {
        id: 'profile',
        title: isLoggedIn ? '完善资料' : '先去登录',
        description: isLoggedIn
          ? profileCompleted
            ? '基础资料已就绪，随时可以回来调整生日、时辰和昵称。'
            : '先补齐生日、出生时间和出生地，首页的个性化解释会更准确。'
          : '从个人中心发起微信登录，后续历史和状态变化都会绑定到账号。',
        route: '/pages/profile/index',
        badge: isLoggedIn
          ? profileCompleted
            ? '已登录'
            : '待完善'
          : '立即开始',
      },
      {
        id: 'records',
        title: '查看历史',
        description: '把八字、性格和情绪结果集中回看，方便理解自己最近的变化。',
        route: '/pages/records/index',
        badge: '回看结果',
      },
      {
        id: 'settings',
        title: '设置中心',
        description: '统一管理提醒偏好、隐私说明、反馈和关于我们。',
        route: '/pages/settings/index',
        badge: '基础配置',
      },
      {
        id: 'membership',
        title: '会员权益',
        description: isVipActive
          ? '当前会员已生效，可以直接查看完整版与海报权益。'
          : '查看 VIP 权益、套餐和当前订单状态。',
        route: '/pages/membership/index',
        badge: isVipActive ? 'VIP 生效中' : '权益说明',
      },
    ];

    const journeyEntries = [
      {
        id: 'login',
        title: '登录账号',
        description: isLoggedIn
          ? '当前账号已连接，可以继续沉淀历史记录和状态变化。'
          : '先从个人中心发起登录，避免结果只停留在当前设备。',
        completed: isLoggedIn,
      },
      {
        id: 'profile',
        title: '完善资料',
        description: profileCompleted
          ? `当前会结合${user?.zodiac ?? '你的资料'}和最近测评结果，生成更贴近你的首页判断。`
          : '补齐生日、出生时间、出生地和性别后，首页解释和个性化标签会更完整。',
        completed: profileCompleted,
      },
      {
        id: 'assessment',
        title: '建立状态基线',
        description:
          signals.emotion.length || signals.personality
            ? '首页已经开始参考你的测评结果，后续会越来越稳定。'
            : '先做性格和情绪两项短测，首页分数才会更有依据。',
        completed: Boolean(signals.emotion.length || signals.personality),
      },
    ];

    const headline = this.buildHeadline(user, profileCompleted, stateOverview);
    const userSummary = this.buildUserSummary(
      user,
      profileCompleted,
      isVipActive,
    );
    const homeLayout = await this.loadHomeLayoutConfig();
    const todayAction = this.buildTodayAction(
      user,
      profileCompleted,
      isVipActive,
      signals,
      stateOverview,
      userSummary,
    );
    const configuredQuickEntries = this.buildQuickEntriesFromLayout(
      homeLayout,
      quickEntries,
    );

    return {
      code: 0,
      message: 'ok',
      data: {
        dailyThemeKey,
        headline,
        todayLuckyScore: stateOverview.currentScore,
        annualLuckyScore: stateOverview.completionScore,
        todayLuckySign: luckySign,
        todayFortuneSummary: stateOverview.primarySuggestion,
        stateOverview,
        featureEntries,
        quickEntries: configuredQuickEntries,
        journeyEntries,
        bottomTabs: [
          {
            id: 'home',
            label: '首页',
            route: '/pages/index/index',
            iconText: 'H',
            active: true,
          },
          {
            id: 'tests',
            label: '测评',
            route: '/pages/personality/index',
            iconText: 'T',
            active: false,
          },
          {
            id: 'lucky',
            label: '幸运物',
            route: '/pages/lucky/index',
            iconText: 'L',
            active: false,
          },
          {
            id: 'me',
            label: '我的',
            route: '/pages/profile/index',
            iconText: 'M',
            active: false,
          },
        ],
        stats: [
          {
            label: stateOverview.currentScore.label,
            value: stateOverview.currentScore.value,
            hint: stateOverview.currentScore.hint,
          },
          {
            label: stateOverview.factors[0]?.label ?? '情绪稳定度',
            value: stateOverview.factors[0]?.value ?? '--',
            hint:
              stateOverview.factors[0]?.hint ?? '先完成情绪自检后会更准确。',
          },
          {
            label: stateOverview.completionScore.label,
            value: stateOverview.completionScore.value,
            hint: stateOverview.completionScore.hint,
          },
          {
            label: '今日幸运签',
            value: luckySign.tag,
            hint: luckySign.title,
          },
        ],
        modules: featureEntries,
        integrations,
        userSummary,
        todayAction,
        homeLayout,
      },
      timestamp: new Date().toISOString(),
    };
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

  private async loadHomeSignals(userId: string): Promise<HomeSignals> {
    const [records, moodRecords] = await Promise.all([
      this.userRecordRepository.find({
        where: {
          userId,
        },
        order: {
          createdAt: 'DESC',
        },
        take: 16,
      }),
      this.moodRecordRepository.find({
        where: {
          userId,
        },
        order: {
          recordDate: 'DESC',
          updatedAt: 'DESC',
        },
        take: 14,
      }),
    ]);

    const emotionBySource = new Map<string, EmotionSignal>();
    let personality: PersonalitySignal | null = null;
    let bazi: BaziSignal | null = null;

    for (const record of records) {
      if (record.recordType === 'emotion') {
        const sourceKey =
          record.sourceCode || `emotion-${emotionBySource.size + 1}`;
        if (emotionBySource.has(sourceKey)) {
          continue;
        }

        const resultData = this.asRecord(record.resultData);
        const completedAt = this.pickString(
          resultData.completedAt,
          record.createdAt.toISOString(),
        );

        emotionBySource.set(sourceKey, {
          sourceCode: record.sourceCode,
          title: record.resultTitle,
          riskLevel: this.pickString(
            resultData.riskLevel,
            record.resultLevel ?? '',
          ),
          primarySuggestion: this.pickString(
            resultData.primarySuggestion,
            '今天先把节奏稳下来，再继续推进。',
          ),
          supportSignal: this.pickString(
            resultData.supportSignal,
            '如果状态持续影响作息和效率，建议尽快寻求现实支持。',
          ),
          completedAt,
          ageDays: this.diffDays(completedAt),
        });
      }

      if (record.recordType === 'personality' && !personality) {
        const resultData = this.asRecord(record.resultData);
        const dominantDimension = this.asRecord(resultData.dominantDimension);
        const completedAt = this.pickString(
          resultData.completedAt,
          record.createdAt.toISOString(),
        );

        personality = {
          title: record.resultTitle,
          score: this.clampScore(
            Number(record.score ?? resultData.score ?? 0),
            0,
            100,
            68,
          ),
          dominantDimensionLabel: this.pickNullableString(
            dominantDimension.label,
          ),
          summary: this.pickString(
            resultData.summary,
            '这次性格测评已经生成，能帮助你更快看清自己的自然优势。',
          ),
          completedAt,
          ageDays: this.diffDays(completedAt),
        };
      }

      if (record.recordType === 'bazi' && !bazi) {
        const resultData = this.asRecord(record.resultData);
        const dominantElement = this.asRecord(resultData.dominantElement);
        const practicalTips = this.asRecord(resultData.practicalTips);
        const completedAt = this.pickString(
          resultData.generatedAt,
          record.createdAt.toISOString(),
        );

        bazi = {
          title: record.resultTitle,
          dominantElement: this.pickNullableString(dominantElement.name),
          dailyFocus: this.pickString(
            practicalTips.dailyFocus,
            '今天更适合围绕一件最重要的事来安排节奏。',
          ),
          completedAt,
          ageDays: this.diffDays(completedAt),
        };
      }
    }

    return {
      emotion: [...emotionBySource.values()],
      mood: moodRecords.map((record) => ({
        moodType: record.moodType,
        moodScore: this.clampScore(record.moodScore, 0, 100, 60),
        emotionTags: record.emotionTags ?? [],
        content: record.content ?? '',
        recordDate: record.recordDate,
        updatedAt: record.updatedAt.toISOString(),
        ageDays: this.diffDays(record.recordDate),
      })),
      personality,
      bazi,
    };
  }

  private buildStateOverview(
    user: UserEntity | null,
    signals: HomeSignals,
  ): StateOverview {
    const emotionFactor = this.buildEmotionFactor(signals);
    const personalityFactor = this.buildPersonalityFactor(signals.personality);
    const completionFactor = this.buildCompletionFactor(user, signals);
    const contextScore = this.buildContextScore(user, signals.bazi);
    const momentumScore = this.buildSelfCareMomentumScore(signals);
    const rawCurrentScore = Math.round(
      emotionFactor.numericValue * 0.62 +
        personalityFactor.numericValue * 0.18 +
        momentumScore * 0.12 +
        contextScore * 0.08,
    );
    const confidenceWeight = this.resolveCurrentStateConfidence(
      signals,
      completionFactor.numericValue,
    );
    // The score follows current self-report first. Static profile and bazi context only nudge it.
    const currentScore = this.clampScore(
      Math.round(
        rawCurrentScore * confidenceWeight + 62 * (1 - confidenceWeight),
      ),
      28,
      this.resolveCurrentScoreCeiling(signals),
      62,
    );

    const basisTags = this.buildBasisTags(user, signals);
    const confidenceLabel = this.buildConfidenceLabel(
      signals,
      completionFactor.numericValue,
    );
    const title = this.buildStateTitle(currentScore, signals);
    const summary = this.buildStateSummary(currentScore, signals);
    const primarySuggestion = this.buildPrimarySuggestion(
      currentScore,
      signals,
      user,
    );
    const evidenceLabel = this.buildEvidenceLabel(signals);

    return {
      title,
      summary,
      primarySuggestion,
      confidenceLabel,
      evidenceLabel,
      disclaimer: HOME_STATE_DISCLAIMER,
      basisTags,
      factors: [
        this.serializeFactor(emotionFactor),
        this.serializeFactor(personalityFactor),
        this.serializeFactor(completionFactor),
      ],
      currentScore: {
        label: '当前状态指数',
        value: String(currentScore),
        hint: this.buildCurrentScoreHint(currentScore, signals),
      },
      completionScore: {
        label: '状态可信度',
        value: String(Math.round(completionFactor.numericValue)),
        hint: completionFactor.hint,
      },
    };
  }

  private buildEmotionFactor(signals: HomeSignals): StateFactor {
    const assessmentState = this.buildAssessmentEmotionState(signals.emotion);
    const moodState = this.buildMoodState(signals.mood);

    if (!assessmentState && !moodState) {
      return {
        id: 'emotion',
        label: '当下情绪温度',
        value: '60',
        hint: '还没有今日心情或最近情绪自检，当前指数会保持保守估算。',
        tone: 'steady',
        numericValue: 60,
      };
    }

    const moodWeight = moodState
      ? moodState.latest.ageDays <= 3
        ? 0.58
        : 0.42
      : 0;
    const assessmentWeight = assessmentState
      ? moodState
        ? 1 - moodWeight
        : 1
      : 0;
    const moodOnlyWeight = moodState && !assessmentState ? 1 : moodWeight;
    const score = this.clampScore(
      Math.round(
        (assessmentState?.score ?? 0) * assessmentWeight +
          (moodState?.score ?? 0) * moodOnlyWeight,
      ),
      24,
      92,
      60,
    );
    const tone = score >= 78 ? 'positive' : score >= 62 ? 'steady' : 'watch';

    return {
      id: 'emotion',
      label: '当下情绪温度',
      value: String(score),
      hint: this.buildEmotionFactorHint(assessmentState, moodState),
      tone,
      numericValue: score,
    };
  }

  private buildAssessmentEmotionState(signals: EmotionSignal[]) {
    if (!signals.length) {
      return null;
    }

    const normalized = signals.slice(0, 2).map((signal) => {
      const base = EMOTION_BASE_SCORES[signal.riskLevel ?? ''] ?? 68;
      const freshnessPenalty =
        signal.ageDays > 30
          ? 12
          : signal.ageDays > 14
            ? 7
            : signal.ageDays > 7
              ? 4
              : 0;
      const adjustedScore = this.clampScore(
        base - freshnessPenalty,
        24,
        90,
        60,
      );
      const freshnessWeight = this.resolveAssessmentFreshnessWeight(
        signal.ageDays,
      );

      return Math.round(
        adjustedScore * freshnessWeight + 60 * (1 - freshnessWeight),
      );
    });
    const averageScore = Math.round(
      normalized.reduce((sum, item) => sum + item, 0) / normalized.length,
    );
    const strongestSignal = [...signals].sort((left, right) => {
      const leftWeight = EMOTION_BASE_SCORES[left.riskLevel ?? ''] ?? 68;
      const rightWeight = EMOTION_BASE_SCORES[right.riskLevel ?? ''] ?? 68;
      return leftWeight - rightWeight;
    })[0];

    return {
      score: averageScore,
      strongestSignal,
    };
  }

  private buildMoodState(signals: MoodSignal[]) {
    if (!signals.length) {
      return null;
    }

    const weighted = signals.slice(0, 7).map((signal) => {
      const adjustedScore = this.clampScore(
        signal.moodScore + (MOOD_TYPE_SCORE_ADJUSTMENTS[signal.moodType] ?? 0),
        20,
        96,
        60,
      );
      const weight = this.resolveMoodFreshnessWeight(signal.ageDays);
      return {
        adjustedScore,
        weight,
      };
    });
    const totalWeight = weighted.reduce((sum, item) => sum + item.weight, 0);
    const weightedAverage = Math.round(
      weighted.reduce(
        (sum, item) => sum + item.adjustedScore * item.weight,
        0,
      ) / Math.max(totalWeight, 0.01),
    );
    const latest = signals[0];
    const latestScore = this.clampScore(
      latest.moodScore + (MOOD_TYPE_SCORE_ADJUSTMENTS[latest.moodType] ?? 0),
      20,
      96,
      60,
    );
    const volatilityPenalty = this.resolveMoodVolatilityPenalty(signals);
    const score = this.clampScore(
      Math.round(
        latestScore * 0.56 + weightedAverage * 0.44 - volatilityPenalty,
      ),
      20,
      94,
      60,
    );

    return {
      score,
      latest,
      volatilityPenalty,
    };
  }

  private buildEmotionFactorHint(
    assessmentState: {
      score: number;
      strongestSignal: EmotionSignal;
    } | null,
    moodState: {
      score: number;
      latest: MoodSignal;
      volatilityPenalty: number;
    } | null,
  ) {
    if (moodState) {
      const latest = moodState.latest;
      const moodText = this.resolveMoodLabel(latest.moodType);
      const volatilityText = moodState.volatilityPenalty
        ? '，近期波动也需要被看见'
        : '';

      if (latest.moodScore <= 52) {
        return `最近一次心情是${moodText}，分数偏低${volatilityText}，今天先以恢复为主。`;
      }

      if (assessmentState?.strongestSignal.riskLevel === 'support') {
        return `心情记录已有更新，但情绪自检仍提示需要支持：${assessmentState.strongestSignal.primarySuggestion}`;
      }

      if (assessmentState?.strongestSignal.riskLevel === 'urgent') {
        return `心情记录已有更新，但情绪自检提示风险较高：${assessmentState.strongestSignal.primarySuggestion}`;
      }

      return `最近一次心情是${moodText}，状态分 ${latest.moodScore}${volatilityText}。`;
    }

    if (assessmentState?.strongestSignal.riskLevel === 'steady') {
      return '最近情绪自检整体平稳，先维持当前节奏就好。';
    }

    return assessmentState
      ? `最近一次情绪自检提示：${assessmentState.strongestSignal.primarySuggestion}`
      : '还没有近期心情记录，先保持保守估算。';
  }

  private resolveMoodFreshnessWeight(ageDays: number) {
    if (ageDays <= 1) {
      return 1;
    }

    if (ageDays <= 3) {
      return 0.82;
    }

    if (ageDays <= 7) {
      return 0.62;
    }

    if (ageDays <= 14) {
      return 0.42;
    }

    return 0.22;
  }

  private resolveAssessmentFreshnessWeight(ageDays: number) {
    if (ageDays <= 7) {
      return 1;
    }

    if (ageDays <= 14) {
      return 0.85;
    }

    if (ageDays <= 30) {
      return 0.65;
    }

    if (ageDays <= 60) {
      return 0.45;
    }

    return 0.25;
  }

  private resolveMoodVolatilityPenalty(signals: MoodSignal[]) {
    const recent = signals.slice(0, 7);

    if (recent.length < 3) {
      return 0;
    }

    const deltas = recent
      .slice(1)
      .map((signal, index) =>
        Math.abs(recent[index].moodScore - signal.moodScore),
      );
    const averageDelta =
      deltas.reduce((sum, delta) => sum + delta, 0) / deltas.length;

    if (averageDelta >= 30) {
      return 10;
    }

    if (averageDelta >= 22) {
      return 6;
    }

    if (averageDelta >= 15) {
      return 3;
    }

    return 0;
  }

  private buildSelfCareMomentumScore(signals: HomeSignals) {
    const recentMoods = signals.mood.filter((item) => item.ageDays <= 14);
    const latestMood = signals.mood[0];

    if (!recentMoods.length && !signals.emotion.length) {
      return 55;
    }

    const latestStateScore =
      latestMood?.moodScore ??
      this.buildAssessmentEmotionState(signals.emotion)?.score ??
      60;
    const continuityBonus = Math.min(recentMoods.length, 5) * 2;
    const volatilityPenalty = this.resolveMoodVolatilityPenalty(recentMoods);

    return this.clampScore(
      Math.round(
        latestStateScore * 0.64 +
          62 * 0.36 +
          continuityBonus -
          volatilityPenalty,
      ),
      34,
      88,
      58,
    );
  }

  private resolveCurrentStateConfidence(
    signals: HomeSignals,
    completionScore: number,
  ) {
    let confidence = 0.38;

    if (signals.mood.some((item) => item.ageDays <= 1)) {
      confidence += 0.28;
    } else if (signals.mood.some((item) => item.ageDays <= 7)) {
      confidence += 0.18;
    } else if (signals.mood.length) {
      confidence += 0.08;
    }

    if (signals.emotion.some((item) => item.ageDays <= 14)) {
      confidence += 0.22;
    } else if (signals.emotion.length) {
      confidence += 0.1;
    }

    if (signals.personality) {
      confidence += 0.07;
    }

    confidence += Math.min(0.07, completionScore / 1200);

    return this.clampRatio(confidence, 0.42, 0.92);
  }

  private resolveCurrentScoreCeiling(signals: HomeSignals) {
    if (!signals.mood.length && !signals.emotion.length) {
      return 68;
    }

    if (
      !signals.mood.some((item) => item.ageDays <= 7) &&
      !signals.emotion.some((item) => item.ageDays <= 30)
    ) {
      return 76;
    }

    return 94;
  }

  private buildPersonalityFactor(
    signal: PersonalitySignal | null,
  ): StateFactor {
    if (!signal) {
      return {
        id: 'personality',
        label: '节奏复原力',
        value: '58',
        hint: '还没有最近的性格测评结果，暂时不把长期性格当成当前状态依据。',
        tone: 'steady',
        numericValue: 58,
      };
    }

    const freshnessPenalty =
      signal.ageDays > 180
        ? 8
        : signal.ageDays > 90
          ? 4
          : signal.ageDays > 45
            ? 2
            : 0;
    const normalized = this.clampScore(
      Math.round(55 + signal.score * 0.24 - freshnessPenalty),
      46,
      84,
      64,
    );
    const dimensionText = signal.dominantDimensionLabel
      ? `最近更突出的${signal.dominantDimensionLabel}可以继续作为今天的推进抓手。`
      : '最近的性格测评可以帮助你判断自己更自然的推进方式。';

    return {
      id: 'personality',
      label: '节奏复原力',
      value: String(normalized),
      hint: dimensionText,
      tone:
        normalized >= 80 ? 'positive' : normalized >= 68 ? 'steady' : 'watch',
      numericValue: normalized,
    };
  }

  private buildCompletionFactor(
    user: UserEntity | null,
    signals: HomeSignals,
  ): StateFactor {
    const hasFreshMood = signals.mood.some((item) => item.ageDays <= 3);
    const score =
      (user ? 10 : 0) +
      (user?.birthday && user?.zodiac ? 14 : 0) +
      (user?.birthTime ? 5 : 0) +
      (this.resolveUserBirthPlace(user) ? 5 : 0) +
      (hasFreshMood ? 25 : signals.mood.length ? 14 : 0) +
      (signals.emotion.length ? 24 : 0) +
      (signals.personality ? 12 : 0) +
      (signals.bazi ? 5 : 0);
    const normalized = this.clampScore(score, 20, 100, 28);
    const missingItems = [
      !user ? '登录账号' : '',
      !user?.birthday || !user?.zodiac ? '补齐生日资料' : '',
      !hasFreshMood ? '记录今日心情' : '',
      !signals.personality ? '完成性格测评' : '',
      !signals.emotion.length ? '完成情绪自检' : '',
    ].filter(Boolean);

    return {
      id: 'completion',
      label: '状态可信度',
      value: String(normalized),
      hint: missingItems.length
        ? `还差 ${missingItems.slice(0, 2).join('、')}，当前指数会更贴近真实状态。`
        : '近期自述和核心测评都比较完整，当前指数可信度较高。',
      tone:
        normalized >= 82 ? 'positive' : normalized >= 56 ? 'steady' : 'watch',
      numericValue: normalized,
    };
  }

  private buildContextScore(
    user: UserEntity | null,
    baziSignal: BaziSignal | null,
  ) {
    const score =
      58 +
      (user?.zodiac ? 8 : 0) +
      (user?.fiveElements ? 8 : 0) +
      (user?.birthTime ? 6 : 0) +
      (baziSignal ? 8 : 0) -
      (baziSignal && baziSignal.ageDays > 180 ? 4 : 0);

    return this.clampScore(score, 48, 84, 60);
  }

  private buildBasisTags(user: UserEntity | null, signals: HomeSignals) {
    const tags = [
      this.buildMoodTag(signals.mood[0]),
      user?.zodiac ?? '',
      this.resolveDominantElement(user, signals.bazi)
        ? `${this.resolveDominantElement(user, signals.bazi)}元素`
        : '',
      signals.personality?.dominantDimensionLabel ?? '',
      this.buildEmotionTag(signals.emotion[0]?.riskLevel ?? ''),
    ].filter(Boolean);

    return tags.slice(0, 4);
  }

  private buildConfidenceLabel(signals: HomeSignals, completionScore: number) {
    if (
      signals.mood.some((item) => item.ageDays <= 3) &&
      signals.emotion.length &&
      signals.personality &&
      completionScore >= 80
    ) {
      return '依据较完整：近期心情 + 情绪自检 + 资料档案';
    }

    if (signals.mood.length || signals.emotion.length || signals.personality) {
      return '依据中等：已接入部分近期状态';
    }

    return '依据偏少：先记录今日心情或完成一次自检';
  }

  private buildStateTitle(score: number, signals: HomeSignals) {
    const pressureLevel = this.resolvePressureLevel(signals);

    if (pressureLevel === 'urgent' || pressureLevel === 'support') {
      return '今天先把恢复和支持排在第一位';
    }

    if (pressureLevel === 'watch') {
      return '今天更适合稳住节奏，再推进重点';
    }

    if (score >= 84) {
      return '今天适合把一件重要的事稳稳推进';
    }

    if (score >= 72) {
      return '今天适合先收束注意力，再安排节奏';
    }

    return '今天先把目标缩小一点，会更容易恢复状态';
  }

  private buildStateSummary(score: number, signals: HomeSignals) {
    const strongestEmotion = signals.emotion[0];
    const latestMood = signals.mood[0];
    const pressureLevel = this.resolvePressureLevel(signals);

    if (pressureLevel === 'urgent' || pressureLevel === 'support') {
      return '最近的自述状态提示当前压力偏高，首页会优先把恢复、减压和支持资源放在建议前面。';
    }

    if (pressureLevel === 'watch') {
      return '最近的情绪波动有一点偏高，今天更建议先把多线程收回来，再决定要不要继续加码。';
    }

    if (!signals.mood.length && !signals.emotion.length) {
      return '当前缺少近期自述状态，首页会先保持保守估算，建议先记录今日心情或完成一次情绪自检。';
    }

    if (latestMood?.ageDays <= 3 && latestMood.moodScore >= 78) {
      return '最近的心情记录比较积极，情绪状态也更容易承接现实任务，可以稳稳推进重要事项。';
    }

    if (score >= 82) {
      return '最近的情绪状态相对平稳，性格测评也给出了较清晰的自然优势，可以更放心地推进重点任务。';
    }

    return '现在更适合先稳住节奏、减少无效分心，再把注意力放回一件真正重要的事上。';
  }

  private buildPrimarySuggestion(
    score: number,
    signals: HomeSignals,
    user: UserEntity | null,
  ) {
    const strongestEmotion = signals.emotion[0];
    const latestMood = signals.mood[0];
    const pressureLevel = this.resolvePressureLevel(signals);

    if (pressureLevel === 'urgent' || pressureLevel === 'support') {
      return (
        strongestEmotion?.primarySuggestion ||
        '今天先暂停加码，把休息、饮水、求助和一件能落地的小事放在前面。'
      );
    }

    if (pressureLevel === 'watch') {
      return '把今天的目标先缩到一件最关键的小事，先完成再决定是否继续加码。';
    }

    if (latestMood?.ageDays <= 3 && latestMood.content) {
      return '把今天心情记录里最在意的那件事单独拿出来，先给它一个温和但明确的处理动作。';
    }

    if (signals.personality?.dominantDimensionLabel) {
      return `今天优先用你的“${signals.personality.dominantDimensionLabel}”优势去处理最重要的一件事，会更顺手。`;
    }

    if (signals.bazi?.dailyFocus) {
      return signals.bazi.dailyFocus;
    }

    if (user) {
      return '先完成一件最重要的小事，再决定今天剩下的安排。';
    }

    return '登录并完成 1-2 项短测后，首页会给出更贴近你当前状态的建议。';
  }

  private buildEvidenceLabel(signals: HomeSignals) {
    const evidence: string[] = [];

    if (signals.mood.length) {
      evidence.push('最近心情日记');
    }

    if (signals.emotion.some((item) => item.ageDays <= 30)) {
      evidence.push('近 30 天情绪自检');
    } else if (signals.emotion.length) {
      evidence.push('历史情绪自检');
    }

    if (signals.personality) {
      evidence.push('最近一次性格测评');
    }

    if (signals.bazi) {
      evidence.push('八字节奏参考');
    }

    if (!evidence.length) {
      return '当前缺少近期自述状态，只做保守估算。';
    }

    return `当前分数优先参考 ${evidence.join(' + ')}。`;
  }

  private buildCurrentScoreHint(score: number, signals: HomeSignals) {
    const riskLevel = this.resolvePressureLevel(signals);

    if (riskLevel === 'urgent' || riskLevel === 'support') {
      return '近期优先看稳定感和支持，不建议继续硬撑。';
    }

    if (riskLevel === 'watch') {
      return '最近有一定起伏，更适合先减压再推进。';
    }

    if (!signals.mood.length && !signals.emotion.length) {
      return '缺少近期自述状态，分数先保持保守。';
    }

    if (score >= 84) {
      return '情绪与节奏比较稳，适合推进一件真正重要的事。';
    }

    if (score >= 72) {
      return '状态可用，但更适合单线程推进。';
    }

    return '先恢复注意力和节奏，再决定今天要做多少。';
  }

  private buildHeadline(
    user: UserEntity | null,
    profileCompleted: boolean,
    stateOverview: StateOverview,
  ) {
    if (!user) {
      return {
        title: '先登录，再让首页开始理解你',
        subtitle:
          '这版首页会优先用情绪、性格和资料完整度来判断当前状态，登录后才会越来越准。',
      };
    }

    if (!profileCompleted) {
      return {
        title: `${user.nickname || '欢迎回来'}，先把资料补齐`,
        subtitle:
          '生日、出生时间和出生地补齐后，首页才会开始给你更完整的个性化解释和状态标签。',
      };
    }

    return {
      title: stateOverview.title,
      subtitle: stateOverview.summary,
    };
  }

  private buildUserSummary(
    user: UserEntity | null,
    profileCompleted: boolean,
    isVipActive: boolean,
  ) {
    return {
      isLoggedIn: Boolean(user),
      nickname: user?.nickname ?? null,
      profileCompleted,
      vipStatus: isVipActive ? 'active' : 'inactive',
      primaryActionTitle: user
        ? profileCompleted
          ? '查看状态总览'
          : '先完善资料'
        : '去个人中心登录',
      primaryActionRoute: user
        ? profileCompleted
          ? '/pages/index/index'
          : '/pages/profile/index'
        : '/pages/profile/index',
      secondaryActionTitle: user ? '查看历史记录' : '看看设置与说明',
      secondaryActionRoute: user
        ? '/pages/records/index'
        : '/pages/settings/index',
      welcomeNote: !user
        ? '登录后会把历史、状态变化和会员权益都绑定到当前账号。'
        : profileCompleted
          ? '首页已经切到状态总览模式，后续会优先参考你的测评结果和资料完整度。'
          : '资料补齐后，首页判断会更贴近你的实际节奏。',
    };
  }

  private async loadHomeLayoutConfig(): Promise<HomeLayoutConfig> {
    try {
      const config = await this.appConfigRepository.findOne({
        where: {
          namespace: 'home',
          configKey: 'index_layout',
          status: 'published',
        },
      });

      return this.normalizeHomeLayoutConfig(config?.valueJson);
    } catch {
      return this.cloneDefaultHomeLayout();
    }
  }

  private normalizeHomeLayoutConfig(value: unknown): HomeLayoutConfig {
    const source = this.asRecord(value);

    return {
      version: this.pickNumber(source.version, 1, 20, DEFAULT_HOME_LAYOUT.version),
      grayPercent: this.pickNumber(
        source.grayPercent,
        0,
        100,
        DEFAULT_HOME_LAYOUT.grayPercent,
      ),
      sections: this.normalizeHomeLayoutSections(source.sections),
      quickTools: this.normalizeHomeQuickTools(source.quickTools),
    };
  }

  private normalizeHomeLayoutSections(value: unknown): HomeLayoutSection[] {
    const defaults = this.cloneDefaultHomeLayout().sections;
    const defaultById = new Map(defaults.map((item) => [item.id, item]));
    const sourceItems = Array.isArray(value) ? value : [];
    const configuredIds = new Set<string>();
    const configuredSections: HomeLayoutSection[] = [];

    for (const item of sourceItems) {
      const source = this.asRecord(item);
      const id = this.pickString(source.id, '');
      const fallback = defaultById.get(id);

      if (!fallback) {
        continue;
      }

      configuredIds.add(id);

      const section: HomeLayoutSection = {
        ...fallback,
        type: this.pickString(source.type, fallback.type),
        title: this.pickString(source.title, fallback.title),
        note: this.pickString(source.note, fallback.note),
        audience: this.pickStringArray(source.audience, fallback.audience),
        enabled: this.pickBoolean(source.enabled, fallback.enabled),
        order: this.pickNumber(source.order, 0, 999, fallback.order),
      };

      if (fallback.maxItems !== undefined || source.maxItems !== undefined) {
        section.maxItems = this.pickNumber(
          source.maxItems,
          1,
          12,
          fallback.maxItems ?? 4,
        );
      }

      configuredSections.push(section);
    }

    return [
      ...configuredSections,
      ...defaults.filter((item) => !configuredIds.has(item.id)),
    ].sort((left, right) => left.order - right.order);
  }

  private normalizeHomeQuickTools(value: unknown): HomeQuickTool[] {
    const defaults = this.cloneDefaultHomeLayout().quickTools;
    const defaultById = new Map(defaults.map((item) => [item.id, item]));
    const sourceItems = Array.isArray(value) ? value : [];
    const configuredIds = new Set<string>();
    const configuredTools = sourceItems
      .map((item, index) => {
        const source = this.asRecord(item);
        const id = this.pickString(source.id, '');
        const fallback = defaultById.get(id) ?? {
          id,
          title: '快捷入口',
          description: '打开',
          route: '',
          badge: '快捷',
          icon: 'compass' as const,
          enabled: true,
          order: (index + 1) * 10,
        };

        if (!id) {
          return null;
        }

        configuredIds.add(id);

        return {
          ...fallback,
          title: this.pickString(source.title, fallback.title),
          description: this.pickString(source.description, fallback.description),
          route: this.pickString(source.route, fallback.route),
          badge: this.pickString(source.badge, fallback.badge),
          icon: this.resolveQuickToolIcon(source.icon, fallback.icon),
          enabled: this.pickBoolean(source.enabled, fallback.enabled),
          order: this.pickNumber(source.order, 0, 999, fallback.order),
        } satisfies HomeQuickTool;
      })
      .filter((item): item is HomeQuickTool => Boolean(item));

    return [
      ...configuredTools,
      ...defaults.filter((item) => !configuredIds.has(item.id)),
    ].sort((left, right) => left.order - right.order);
  }

  private buildQuickEntriesFromLayout(
    homeLayout: HomeLayoutConfig,
    fallbackEntries: Array<{
      id: string;
      title: string;
      description: string;
      route: string;
      badge: string;
    }>,
  ) {
    const fallbackById = new Map(fallbackEntries.map((item) => [item.id, item]));
    const configured = homeLayout.quickTools
      .filter((item) => item.enabled && item.route)
      .map((item) => {
        const fallback = fallbackById.get(item.id);

        return {
          id: item.id,
          title: item.title || fallback?.title || '快捷入口',
          description: item.description || fallback?.description || '打开',
          route: item.route || fallback?.route || '/pages/index/index',
          badge: item.badge || fallback?.badge || '快捷',
          icon: item.icon,
          enabled: item.enabled,
        };
      });

    return configured.length ? configured : fallbackEntries;
  }

  private buildTodayAction(
    user: UserEntity | null,
    profileCompleted: boolean,
    isVipActive: boolean,
    signals: HomeSignals,
    stateOverview: StateOverview,
    userSummary: {
      primaryActionTitle: string;
      primaryActionRoute: string;
      welcomeNote: string;
    },
  ): HomeTodayAction {
    const completionScore = this.clampScore(
      Number(stateOverview.completionScore.value),
      0,
      100,
      20,
    );
    const currentScore = this.clampScore(
      Number(stateOverview.currentScore.value),
      0,
      100,
      60,
    );
    const pressureLevel = this.resolvePressureLevel(signals);
    const hasFreshMood = signals.mood.some((item) => item.ageDays <= 3);
    const hasTodayMood = signals.mood.some((item) => item.ageDays === 0);

    if (!user) {
      return {
        actionCode: 'login',
        badge: '未登录',
        title: '先连接账号，让首页开始理解你',
        summary:
          userSummary.welcomeNote ||
          '登录后，今日状态、记录和会员权益都会绑定到当前账号。',
        primaryText: this.pickString(userSummary.primaryActionTitle, '去登录'),
        primaryRoute: this.pickString(
          userSummary.primaryActionRoute,
          '/pages/profile/index',
        ),
        secondaryText: '隐私说明',
        secondaryRoute: '/pages/settings/privacy/index',
      };
    }

    if (!profileCompleted) {
      return {
        actionCode: 'complete_profile',
        badge: '资料待完善',
        title: '补齐生日与出生信息',
        summary:
          '资料完整后，首页会把状态观察、八字节奏和长期画像放在同一条线上看。',
        primaryText: '完善资料',
        primaryRoute: '/pages/profile/index',
        secondaryText: '先记录心情',
        secondaryRoute: '/pages/journal/index',
      };
    }

    if (!hasTodayMood && (!hasFreshMood || completionScore < 62)) {
      return {
        actionCode: 'record_mood',
        badge: '依据偏少',
        title: '补一条今日心绪',
        summary: '今天只要记录一次当下感受，状态指数就会更贴近真实节奏。',
        primaryText: '记录心情',
        primaryRoute: '/pages/journal/index',
        secondaryText: '情绪自检',
        secondaryRoute: '/pages/emotion/index',
      };
    }

    if (
      pressureLevel === 'urgent' ||
      pressureLevel === 'support' ||
      pressureLevel === 'watch' ||
      currentScore < 62
    ) {
      return {
        actionCode: 'steady_breath',
        badge: '先稳住',
        title: '做一次 3 分钟呼吸',
        summary:
          stateOverview.primarySuggestion ||
          '把今天的目标先缩小一点，先恢复注意力再继续推进。',
        primaryText: '开始呼吸',
        primaryRoute: '/pages/breathing/index',
        secondaryText: '冥想放松',
        secondaryRoute: '/pages/meditation/index',
      };
    }

    if (isVipActive && completionScore >= 72) {
      return {
        actionCode: 'vip_report',
        badge: 'VIP',
        title: '查看今日完整报告',
        summary:
          stateOverview.primarySuggestion ||
          '把今日建议拆成一个具体动作，再生成可分享的提醒。',
        primaryText: '查看报告',
        primaryRoute: '/pages/report/index',
        secondaryText: '生成海报',
        secondaryRoute: '/pages/poster/generate/index?type=today&auto=1',
      };
    }

    return {
      actionCode: 'view_report',
      badge: '可推进',
      title: '把今日建议落成一步',
      summary:
        stateOverview.primarySuggestion ||
        '先完成一件最重要的小事，再决定今天剩下的安排。',
      primaryText: '查看报告',
      primaryRoute: '/pages/report/index',
      secondaryText: '今日占卜',
      secondaryRoute: '/pages/divination/index/index',
    };
  }

  private cloneDefaultHomeLayout(): HomeLayoutConfig {
    return {
      version: DEFAULT_HOME_LAYOUT.version,
      grayPercent: DEFAULT_HOME_LAYOUT.grayPercent,
      sections: DEFAULT_HOME_LAYOUT.sections.map((item) => ({ ...item })),
      quickTools: DEFAULT_HOME_LAYOUT.quickTools.map((item) => ({ ...item })),
    };
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

    return '状态观察中';
  }

  private buildMoodTag(mood?: MoodSignal) {
    if (!mood) {
      return '';
    }

    if (mood.moodScore <= 45) {
      return '先照顾情绪';
    }

    if (mood.moodScore <= 62) {
      return '慢一点推进';
    }

    if (mood.moodScore >= 80) {
      return '状态可承接';
    }

    return `${this.resolveMoodLabel(mood.moodType)}状态`;
  }

  private resolveMoodLabel(moodType: string) {
    const mapping: Record<string, string> = {
      calm: '平静',
      low: '低落',
      anxious: '焦虑',
      happy: '愉悦',
      tired: '疲惫',
    };

    return mapping[moodType] || '当前';
  }

  private resolvePressureLevel(signals: HomeSignals) {
    const rankedLevels: Record<string, number> = {
      steady: 1,
      watch: 2,
      support: 3,
      urgent: 4,
    };
    const freshEmotionLevels = signals.emotion
      .filter((item) => item.ageDays <= 30)
      .map((item) => item.riskLevel || 'steady');
    const latestMood = signals.mood[0];
    const moodLevel = latestMood
      ? latestMood.moodScore <= 38
        ? 'urgent'
        : latestMood.moodScore <= 52
          ? 'support'
          : latestMood.moodScore <= 66 ||
              latestMood.moodType === 'anxious' ||
              latestMood.moodType === 'low'
            ? 'watch'
            : 'steady'
      : 'steady';
    const levels = [...freshEmotionLevels, moodLevel];

    return levels.sort(
      (left, right) => (rankedLevels[right] ?? 1) - (rankedLevels[left] ?? 1),
    )[0];
  }

  private resolveDominantElement(
    user: UserEntity | null,
    baziSignal: BaziSignal | null,
  ) {
    const entries = Object.entries(user?.fiveElements ?? {});

    if (entries.length) {
      return entries.sort((left, right) => right[1] - left[1])[0][0];
    }

    return baziSignal?.dominantElement ?? '';
  }

  private serializeFactor(factor: StateFactor) {
    const { numericValue: _numericValue, ...rest } = factor;
    return rest;
  }

  private createEmptySignals(): HomeSignals {
    return {
      emotion: [],
      mood: [],
      personality: null,
      bazi: null,
    };
  }

  private diffDays(value: string) {
    const target = new Date(value).getTime();

    if (!Number.isFinite(target)) {
      return 999;
    }

    return Math.max(
      0,
      Math.floor((Date.now() - target) / (24 * 60 * 60 * 1000)),
    );
  }

  private pickString(value: unknown, fallback: string) {
    return typeof value === 'string' && value.trim() ? value.trim() : fallback;
  }

  private pickBoolean(value: unknown, fallback: boolean) {
    return typeof value === 'boolean' ? value : fallback;
  }

  private pickNumber(
    value: unknown,
    min: number,
    max: number,
    fallback: number,
  ) {
    return this.clampScore(Number(value), min, max, fallback);
  }

  private pickStringArray(value: unknown, fallback: string[]) {
    if (!Array.isArray(value)) {
      return [...fallback];
    }

    const next = value
      .map((item) => this.pickString(item, ''))
      .filter(Boolean);

    return next.length ? next : [...fallback];
  }

  private resolveQuickToolIcon(
    value: unknown,
    fallback: HomeQuickTool['icon'],
  ): HomeQuickTool['icon'] {
    const supportedIcons: HomeQuickTool['icon'][] = [
      'leaf',
      'journal',
      'orbit',
      'compass',
      'poster',
    ];

    return supportedIcons.includes(value as HomeQuickTool['icon'])
      ? (value as HomeQuickTool['icon'])
      : fallback;
  }

  private resolveUserBirthPlace(user: UserEntity | null) {
    const preferences = user?.preferencesJson ?? {};

    return this.pickString(
      preferences.birthPlace,
      this.pickString(
        preferences.birthCity,
        this.pickString(preferences.city, ''),
      ),
    );
  }

  private pickNullableString(value: unknown) {
    return typeof value === 'string' && value.trim() ? value.trim() : null;
  }

  private clampScore(
    value: number,
    min: number,
    max: number,
    fallback: number,
  ) {
    if (!Number.isFinite(value)) {
      return fallback;
    }

    return Math.max(min, Math.min(max, Math.round(value)));
  }

  private clampRatio(value: number, min: number, max: number) {
    if (!Number.isFinite(value)) {
      return min;
    }

    return Math.max(min, Math.min(max, value));
  }

  private asRecord(value: unknown) {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  }

  private buildIntegrations() {
    const port = this.configService.get<number>('PORT', 3001);

    return {
      apiBaseUrl:
        this.configService.get<string>('PUBLIC_API_BASE_URL') ||
        `http://localhost:${port}/api/v1`,
      fileServiceBaseUrl: this.configService.get<string>(
        'FILE_SERVICE_BASE_URL',
        'http://www.yuanlian.xin:3000/api',
      ),
      redisStatus: this.redisService.getStatus(),
    };
  }
}
