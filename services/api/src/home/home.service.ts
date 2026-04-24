import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRecordEntity } from '../database/entities/user-record.entity';
import { UserEntity } from '../database/entities/user.entity';
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

type HomeSignals = {
  emotion: EmotionSignal[];
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

const HOME_STATE_DISCLAIMER =
  '指数用于帮助你观察当前节奏与自我认知进度，不构成医学或心理诊断。';

const EMOTION_BASE_SCORES: Record<string, number> = {
  steady: 88,
  watch: 72,
  support: 54,
  urgent: 36,
};

@Injectable()
export class HomeService {
  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly luckyService: LuckyService,
    @InjectRepository(UserRecordEntity)
    private readonly userRecordRepository: Repository<UserRecordEntity>,
  ) {}

  async getHomeIndex(user: UserEntity | null) {
    const luckySign = await this.luckyService.getTodaySignSnapshot();
    const dailyThemeKey = this.resolveDailyThemeKey(
      this.pickString((luckySign as { themeName?: string }).themeName, ''),
    );
    const integrations = this.buildIntegrations();
    const signals = user ? await this.loadHomeSignals(user.id) : this.createEmptySignals();
    const stateOverview = this.buildStateOverview(user, signals);
    const isLoggedIn = Boolean(user);
    const profileCompleted = Boolean(user?.birthday && user?.zodiac);
    const isVipActive =
      user?.vipStatus === 'active' &&
      user.vipExpiredAt instanceof Date &&
      user.vipExpiredAt.getTime() > Date.now();

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
            : '先补齐生日和出生时间，首页的个性化解释会更准确。'
          : '从个人中心发起微信登录，后续历史和状态变化都会绑定到账号。',
        route: '/pages/profile/index',
        badge: isLoggedIn ? (profileCompleted ? '已登录' : '待完善') : '立即开始',
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
          : '补齐生日、出生时间和性别后，首页解释和个性化标签会更完整。',
        completed: profileCompleted,
      },
      {
        id: 'assessment',
        title: '建立状态基线',
        description: signals.emotion.length || signals.personality
          ? '首页已经开始参考你的测评结果，后续会越来越稳定。'
          : '先做性格和情绪两项短测，首页分数才会更有依据。',
        completed: Boolean(signals.emotion.length || signals.personality),
      },
    ];

    const headline = this.buildHeadline(user, profileCompleted, stateOverview);
    const userSummary = this.buildUserSummary(user, profileCompleted, isVipActive);

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
        quickEntries,
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
            hint: stateOverview.factors[0]?.hint ?? '先完成情绪自检后会更准确。',
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
    const records = await this.userRecordRepository.find({
      where: {
        userId,
      },
      order: {
        createdAt: 'DESC',
      },
      take: 16,
    });

    const emotionBySource = new Map<string, EmotionSignal>();
    let personality: PersonalitySignal | null = null;
    let bazi: BaziSignal | null = null;

    for (const record of records) {
      if (record.recordType === 'emotion') {
        const sourceKey = record.sourceCode || `emotion-${emotionBySource.size + 1}`;
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
          riskLevel: this.pickString(resultData.riskLevel, record.resultLevel ?? ''),
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
          score: this.clampScore(Number(record.score ?? resultData.score ?? 0), 0, 100, 68),
          dominantDimensionLabel: this.pickNullableString(dominantDimension.label),
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
      personality,
      bazi,
    };
  }

  private buildStateOverview(user: UserEntity | null, signals: HomeSignals): StateOverview {
    const emotionFactor = this.buildEmotionFactor(signals.emotion);
    const personalityFactor = this.buildPersonalityFactor(signals.personality);
    const completionFactor = this.buildCompletionFactor(user, signals);
    const contextScore = this.buildContextScore(user, signals.bazi);
    // Keep self-report signals in the lead; profile-based context is capped to a small share.
    const currentScore = this.clampScore(
      Math.round(
        emotionFactor.numericValue * 0.45 +
          personalityFactor.numericValue * 0.25 +
          completionFactor.numericValue * 0.2 +
          contextScore * 0.1,
      ),
      36,
      93,
      68,
    );

    const basisTags = this.buildBasisTags(user, signals);
    const confidenceLabel = this.buildConfidenceLabel(signals, completionFactor.numericValue);
    const title = this.buildStateTitle(currentScore, signals);
    const summary = this.buildStateSummary(currentScore, signals);
    const primarySuggestion = this.buildPrimarySuggestion(currentScore, signals, user);
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
        label: '自我认知完成度',
        value: String(Math.round(completionFactor.numericValue)),
        hint: completionFactor.hint,
      },
    };
  }

  private buildEmotionFactor(signals: EmotionSignal[]): StateFactor {
    if (!signals.length) {
      return {
        id: 'emotion',
        label: '情绪稳定度',
        value: '68',
        hint: '还没有最近的情绪自检，建议先做一次 3 分钟短测。',
        tone: 'steady',
        numericValue: 68,
      };
    }

    const normalized = signals.slice(0, 2).map((signal) => {
      const base = EMOTION_BASE_SCORES[signal.riskLevel ?? ''] ?? 68;
      const freshnessPenalty =
        signal.ageDays > 45 ? 12 : signal.ageDays > 21 ? 8 : signal.ageDays > 7 ? 4 : 0;
      return this.clampScore(base - freshnessPenalty, 30, 92, 68);
    });
    const averageScore = Math.round(
      normalized.reduce((sum, item) => sum + item, 0) / normalized.length,
    );
    const strongestSignal = [...signals].sort((left, right) => {
      const leftWeight = EMOTION_BASE_SCORES[left.riskLevel ?? ''] ?? 68;
      const rightWeight = EMOTION_BASE_SCORES[right.riskLevel ?? ''] ?? 68;
      return leftWeight - rightWeight;
    })[0];
    const tone = averageScore >= 80 ? 'positive' : averageScore >= 66 ? 'steady' : 'watch';

    return {
      id: 'emotion',
      label: '情绪稳定度',
      value: String(averageScore),
      hint:
        strongestSignal.riskLevel === 'steady'
          ? `最近情绪自检整体平稳，先维持当前节奏就好。`
          : `最近一次情绪自检提示：${strongestSignal.primarySuggestion}`,
      tone,
      numericValue: averageScore,
    };
  }

  private buildPersonalityFactor(signal: PersonalitySignal | null): StateFactor {
    if (!signal) {
      return {
        id: 'personality',
        label: '节奏掌控度',
        value: '66',
        hint: '还没有最近的性格测评结果，完成后会更清楚你更适合怎样推进事情。',
        tone: 'steady',
        numericValue: 66,
      };
    }

    const freshnessPenalty =
      signal.ageDays > 180 ? 8 : signal.ageDays > 90 ? 4 : signal.ageDays > 45 ? 2 : 0;
    const normalized = this.clampScore(
      Math.round(58 + signal.score * 0.28 - freshnessPenalty),
      48,
      88,
      72,
    );
    const dimensionText = signal.dominantDimensionLabel
      ? `最近更突出的${signal.dominantDimensionLabel}可以继续作为今天的推进抓手。`
      : '最近的性格测评可以帮助你判断自己更自然的推进方式。';

    return {
      id: 'personality',
      label: '节奏掌控度',
      value: String(normalized),
      hint: dimensionText,
      tone: normalized >= 80 ? 'positive' : normalized >= 68 ? 'steady' : 'watch',
      numericValue: normalized,
    };
  }

  private buildCompletionFactor(user: UserEntity | null, signals: HomeSignals): StateFactor {
    const score =
      (user?.birthday && user?.zodiac ? 30 : 0) +
      (user?.birthTime ? 10 : 0) +
      (signals.personality ? 20 : 0) +
      (signals.emotion.length ? 25 : 0) +
      (signals.bazi ? 15 : 0);
    const normalized = this.clampScore(score, 20, 100, 28);
    const missingItems = [
      !user ? '登录账号' : '',
      !user?.birthday || !user?.zodiac ? '补齐生日资料' : '',
      !signals.personality ? '完成性格测评' : '',
      !signals.emotion.length ? '完成情绪自检' : '',
      !signals.bazi ? '补一份八字解读' : '',
    ].filter(Boolean);

    return {
      id: 'completion',
      label: '认知完善度',
      value: String(normalized),
      hint: missingItems.length
        ? `还差 ${missingItems.slice(0, 2).join('、')}，首页判断会更完整。`
        : '资料与核心测评都比较齐，首页解释会更稳定。',
      tone: normalized >= 82 ? 'positive' : normalized >= 56 ? 'steady' : 'watch',
      numericValue: normalized,
    };
  }

  private buildContextScore(user: UserEntity | null, baziSignal: BaziSignal | null) {
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
      user?.zodiac ?? '',
      this.resolveDominantElement(user, signals.bazi) ? `${this.resolveDominantElement(user, signals.bazi)}元素` : '',
      signals.personality?.dominantDimensionLabel ?? '',
      this.buildEmotionTag(signals.emotion[0]?.riskLevel ?? ''),
    ].filter(Boolean);

    return tags.slice(0, 4);
  }

  private buildConfidenceLabel(signals: HomeSignals, completionScore: number) {
    if (signals.emotion.length && signals.personality && completionScore >= 80) {
      return '依据较完整：近 30 天自检 + 资料档案';
    }

    if (signals.emotion.length || signals.personality) {
      return '依据中等：已接入部分测评结果';
    }

    return '依据偏少：先补 1-2 项测评，判断会更稳定';
  }

  private buildStateTitle(score: number, signals: HomeSignals) {
    const riskLevels = signals.emotion.map((item) => item.riskLevel);

    if (riskLevels.some((item) => item === 'urgent' || item === 'support')) {
      return '今天先把恢复和支持排在第一位';
    }

    if (riskLevels.some((item) => item === 'watch')) {
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

    if (strongestEmotion?.riskLevel === 'urgent' || strongestEmotion?.riskLevel === 'support') {
      return '最近的情绪自检提示当前压力偏高，首页会优先把恢复、减压和支持资源放在建议前面。';
    }

    if (strongestEmotion?.riskLevel === 'watch') {
      return '最近的情绪波动有一点偏高，今天更建议先把多线程收回来，再决定要不要继续加码。';
    }

    if (!signals.emotion.length && !signals.personality) {
      return '当前更多依赖基础资料和最近行为线索做估算，建议先完成性格和情绪两项短测。';
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

    if (strongestEmotion?.riskLevel === 'urgent' || strongestEmotion?.riskLevel === 'support') {
      return strongestEmotion.primarySuggestion;
    }

    if (strongestEmotion?.riskLevel === 'watch') {
      return '把今天的目标先缩到一件最关键的小事，先完成再决定是否继续加码。';
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

    if (signals.emotion.length) {
      evidence.push('近 30 天情绪自检');
    }

    if (signals.personality) {
      evidence.push('最近一次性格测评');
    }

    if (signals.bazi) {
      evidence.push('八字节奏参考');
    }

    if (!evidence.length) {
      return '当前主要基于基础资料和完成情况做估算。';
    }

    return `当前分数优先参考 ${evidence.join(' + ')}。`;
  }

  private buildCurrentScoreHint(score: number, signals: HomeSignals) {
    const riskLevel = signals.emotion[0]?.riskLevel ?? '';

    if (riskLevel === 'urgent' || riskLevel === 'support') {
      return '近期优先看稳定感和支持，不建议继续硬撑。';
    }

    if (riskLevel === 'watch') {
      return '最近有一定起伏，更适合先减压再推进。';
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
          '生日和出生时间补齐后，首页才会开始给你更完整的个性化解释和状态标签。',
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
      secondaryActionRoute: user ? '/pages/records/index' : '/pages/settings/index',
      welcomeNote: !user
        ? '登录后会把历史、状态变化和会员权益都绑定到当前账号。'
        : profileCompleted
          ? '首页已经切到状态总览模式，后续会优先参考你的测评结果和资料完整度。'
          : '资料补齐后，首页判断会更贴近你的实际节奏。',
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

  private resolveDominantElement(user: UserEntity | null, baziSignal: BaziSignal | null) {
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
      personality: null,
      bazi: null,
    };
  }

  private diffDays(value: string) {
    const target = new Date(value).getTime();

    if (!Number.isFinite(target)) {
      return 999;
    }

    return Math.max(0, Math.floor((Date.now() - target) / (24 * 60 * 60 * 1000)));
  }

  private pickString(value: unknown, fallback: string) {
    return typeof value === 'string' && value.trim() ? value.trim() : fallback;
  }

  private pickNullableString(value: unknown) {
    return typeof value === 'string' && value.trim() ? value.trim() : null;
  }

  private clampScore(value: number, min: number, max: number, fallback: number) {
    if (!Number.isFinite(value)) {
      return fallback;
    }

    return Math.max(min, Math.min(max, Math.round(value)));
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
        'http://8.152.214.57:3000/api',
      ),
      redisStatus: this.redisService.getStatus(),
    };
  }
}
