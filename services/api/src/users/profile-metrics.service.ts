import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { FavoriteEntity } from '../database/entities/favorite.entity';
import { MoodRecordEntity } from '../database/entities/mood-record.entity';
import { PosterJobEntity } from '../database/entities/poster-job.entity';
import { ShareRecordEntity } from '../database/entities/share-record.entity';
import { UserMetricSnapshotEntity } from '../database/entities/user-metric-snapshot.entity';
import { UserRecordEntity } from '../database/entities/user-record.entity';
import { UserEntity } from '../database/entities/user.entity';

export type ProfileMetricKey =
  | 'fortune_index'
  | 'mood_days'
  | 'explore_reports'
  | 'lucky_energy';

type ProfileMetricTone = 'mist' | 'blush' | 'mint' | 'gold';

type MetricConfig = {
  key: ProfileMetricKey;
  title: string;
  unit: string;
  tone: ProfileMetricTone;
  route: string;
};

type MetricSource = {
  id: string;
  sourceType: string;
  sourceTypeLabel: string;
  title: string;
  summary: string;
  date: string;
  happenedAt: string;
  route: string;
  value?: number;
  valueDelta?: number;
};

type RecordSource = MetricSource & {
  recordType: string;
  score: number | null;
};

type MoodSource = MetricSource & {
  moodScore: number;
  moodType: string;
  emotionTags: string[];
};

type MetricContext = {
  user: UserEntity;
  isProfileCompleted: boolean;
  records: RecordSource[];
  moodRecords: MoodSource[];
  favorites: MetricSource[];
  posterSources: MetricSource[];
};

type MetricBreakdownItem = {
  label: string;
  value: string;
  hint?: string;
};

type MetricCalculation = {
  value: number;
  unit: string;
  label: string;
  summary: string;
  hasData: boolean;
  breakdown: MetricBreakdownItem[];
  sources: MetricSource[];
};

const METRIC_CONFIGS: Record<ProfileMetricKey, MetricConfig> = {
  fortune_index: {
    key: 'fortune_index',
    title: '综合气运指数',
    unit: '分',
    tone: 'mist',
    route: '/pages/profile/data/fortune-index/index',
  },
  mood_days: {
    key: 'mood_days',
    title: '心情记录天数',
    unit: '天',
    tone: 'blush',
    route: '/pages/profile/data/mood-days/index',
  },
  explore_reports: {
    key: 'explore_reports',
    title: '探索报告',
    unit: '份',
    tone: 'mint',
    route: '/pages/profile/data/explore-reports/index',
  },
  lucky_energy: {
    key: 'lucky_energy',
    title: '好运能量值',
    unit: '分',
    tone: 'gold',
    route: '/pages/profile/data/lucky-energy/index',
  },
};

const METRIC_KEYS: ProfileMetricKey[] = [
  'fortune_index',
  'mood_days',
  'explore_reports',
  'lucky_energy',
];

const SHARE_STATUSES = new Set(['generated', 'rendered', 'completed']);

@Injectable()
export class ProfileMetricsService {
  constructor(
    @InjectRepository(UserRecordEntity)
    private readonly userRecordRepository: Repository<UserRecordEntity>,
    @InjectRepository(MoodRecordEntity)
    private readonly moodRecordRepository: Repository<MoodRecordEntity>,
    @InjectRepository(FavoriteEntity)
    private readonly favoriteRepository: Repository<FavoriteEntity>,
    @InjectRepository(ShareRecordEntity)
    private readonly shareRecordRepository: Repository<ShareRecordEntity>,
    @InjectRepository(PosterJobEntity)
    private readonly posterJobRepository: Repository<PosterJobEntity>,
    @InjectRepository(UserMetricSnapshotEntity)
    private readonly metricSnapshotRepository: Repository<UserMetricSnapshotEntity>,
    private readonly authService: AuthService,
  ) {}

  buildGuestDataCards() {
    return METRIC_KEYS.map((key) => {
      const config = METRIC_CONFIGS[key];
      return {
        key,
        title: config.title,
        value: '--',
        meta: '登录后同步',
        tone: config.tone,
        route: config.route,
      };
    });
  }

  async buildProfileSummary(user: UserEntity) {
    const context = await this.loadMetricContext(user);
    const todayKey = this.toDateKey(new Date());
    const cards = [];

    for (const key of METRIC_KEYS) {
      const config = METRIC_CONFIGS[key];
      const calculated = this.calculateMetric(key, context, todayKey);
      await this.upsertSnapshot(user.id, key, todayKey, calculated);
      cards.push({
        key,
        title: config.title,
        value: calculated.hasData ? `${calculated.value}` : '--',
        meta: calculated.hasData ? calculated.label : '暂无数据',
        tone: config.tone,
        route: config.route,
      });
    }

    return {
      dataCards: cards,
      counts: {
        recordCount: context.records.length,
        posterCount: context.posterSources.length,
        exploreTotal: context.records.length + context.posterSources.length,
        favoriteCount: context.favorites.length,
      },
    };
  }

  async getMetricDetail(
    user: UserEntity,
    metricKey: string,
    range?: string,
  ) {
    const key = this.normalizeMetricKey(metricKey);

    if (!key) {
      throw new BadRequestException('未知的数据指标');
    }

    const days = this.normalizeRangeDays(range);
    const context = await this.loadMetricContext(user);
    const dateKeys = this.buildDateRange(days);
    const trendPoints = [];

    for (const dateKey of dateKeys) {
      const calculated = this.calculateMetric(key, context, dateKey);
      await this.upsertSnapshot(user.id, key, dateKey, calculated);
      trendPoints.push({
        date: dateKey,
        value: calculated.hasData ? calculated.value : null,
        label: calculated.label,
      });
    }

    const todayKey = dateKeys[dateKeys.length - 1] ?? this.toDateKey(new Date());
    const current = this.calculateMetric(key, context, todayKey);
    const firstPoint = trendPoints.find((point) => point.value !== null);
    const lastValue = current.hasData ? current.value : null;
    const delta =
      firstPoint?.value !== null && firstPoint?.value !== undefined && lastValue !== null
        ? lastValue - firstPoint.value
        : 0;

    return this.buildEnvelope({
      metric: {
        key,
        title: METRIC_CONFIGS[key].title,
        value: current.hasData ? current.value : 0,
        unit: current.unit,
        label: current.label,
        summary: current.summary,
        hasData: current.hasData,
        updatedAt: new Date().toISOString(),
      },
      trend: {
        range: `${days}d`,
        points: trendPoints,
        delta,
        direction: delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat',
      },
      breakdown: current.breakdown,
      history: {
        items: this.buildHistoryItems(key, context),
        nextCursor: null,
      },
      snapshots: trendPoints
        .slice()
        .reverse()
        .map((point) => ({
          id: `${key}:${point.date}`,
          date: point.date,
          value: point.value,
          label: point.label,
          unit: current.unit,
        })),
    });
  }

  private async loadMetricContext(user: UserEntity): Promise<MetricContext> {
    const [records, moodRecords, favorites, shares, posterJobs] =
      await Promise.all([
        this.userRecordRepository.find({
          where: {
            userId: user.id,
          },
          order: {
            createdAt: 'DESC',
          },
          take: 1000,
        }),
        this.moodRecordRepository.find({
          where: {
            userId: user.id,
          },
          order: {
            recordDate: 'DESC',
            updatedAt: 'DESC',
          },
          take: 1000,
        }),
        this.favoriteRepository.find({
          where: {
            userId: user.id,
          },
          order: {
            createdAt: 'DESC',
          },
          take: 1000,
        }),
        this.shareRecordRepository.find({
          where: {
            userId: user.id,
          },
          order: {
            createdAt: 'DESC',
          },
          take: 1000,
        }),
        this.posterJobRepository.find({
          where: {
            userId: user.id,
          },
          order: {
            createdAt: 'DESC',
          },
          take: 1000,
        }),
      ]);

    const sharePosterIds = new Set(
      shares
        .map((share) => share.posterId)
        .filter((value): value is string => Boolean(value)),
    );
    const posterSources = [
      ...shares
        .filter((share) => SHARE_STATUSES.has(share.status))
        .map((share) => this.serializeShareSource(share)),
      ...posterJobs
        .filter((job) => this.shouldIncludePosterJob(job, sharePosterIds))
        .map((job) => this.serializePosterJobSource(job)),
    ].sort((left, right) => right.happenedAt.localeCompare(left.happenedAt));

    return {
      user,
      isProfileCompleted: this.authService.isProfileCompleted(user),
      records: records.map((record) => this.serializeRecordSource(record)),
      moodRecords: moodRecords.map((record) => this.serializeMoodSource(record)),
      favorites: favorites.map((favorite) => this.serializeFavoriteSource(favorite)),
      posterSources,
    };
  }

  private calculateMetric(
    key: ProfileMetricKey,
    context: MetricContext,
    dateKey: string,
  ): MetricCalculation {
    const records = context.records.filter((record) => record.date <= dateKey);
    const moodRecords = context.moodRecords.filter(
      (record) => record.date <= dateKey,
    );
    const favorites = context.favorites.filter((item) => item.date <= dateKey);
    const posters = context.posterSources.filter((item) => item.date <= dateKey);

    if (key === 'fortune_index') {
      const latestScored = records.find((record) => record.score !== null);
      const value = latestScored?.score ?? 0;
      const label = latestScored
        ? value >= 80
          ? '优秀'
          : value >= 60
            ? '平稳'
            : '待修复'
        : '暂无';

      return {
        value,
        unit: METRIC_CONFIGS[key].unit,
        label,
        hasData: Boolean(latestScored),
        summary: latestScored
          ? `最近一次带分数记录为「${latestScored.title}」，当前指数 ${value} 分。`
          : '完成一份带分数的报告后，这里会开始形成趋势。',
        breakdown: [
          {
            label: '最近来源',
            value: latestScored?.title ?? '暂无带分数记录',
          },
          {
            label: '有分数记录',
            value: `${records.filter((record) => record.score !== null).length} 份`,
          },
          {
            label: '更新口径',
            value: '取最近一份带分数的记录',
          },
        ],
        sources: latestScored ? [latestScored] : [],
      };
    }

    if (key === 'mood_days') {
      const moodDateSet = new Set(moodRecords.map((record) => record.date));
      const monthStart = dateKey.slice(0, 8) + '01';
      const monthCount = moodRecords.filter(
        (record) => record.date >= monthStart,
      ).length;
      const continuousDays = this.calculateContinuousDays([...moodDateSet], dateKey);

      return {
        value: moodDateSet.size,
        unit: METRIC_CONFIGS[key].unit,
        label: '天',
        hasData: true,
        summary: moodDateSet.size
          ? `已经在 ${moodDateSet.size} 个不同日期留下心情记录。`
          : '写下第一条心情日记后，这里会沉淀你的情绪照顾节奏。',
        breakdown: [
          { label: '累计记录', value: `${moodDateSet.size} 天` },
          { label: '连续记录', value: `${continuousDays} 天` },
          { label: '本月记录', value: `${monthCount} 条` },
        ],
        sources: moodRecords.slice(0, 5),
      };
    }

    if (key === 'explore_reports') {
      const total = records.length + posters.length;

      return {
        value: total,
        unit: METRIC_CONFIGS[key].unit,
        label: '份',
        hasData: true,
        summary: total
          ? `已沉淀 ${records.length} 份记录/报告，另有 ${posters.length} 张分享海报计入统计。`
          : '完成报告或生成分享海报后，这里会变成你的内容档案。',
        breakdown: [
          { label: '报告与记录', value: `${records.length} 份` },
          { label: '分享海报', value: `${posters.length} 张` },
          {
            label: '合计',
            value: `${total} 份`,
            hint: '分享海报已纳入探索报告统计',
          },
        ],
        sources: [...records, ...posters]
          .sort((left, right) => right.happenedAt.localeCompare(left.happenedAt))
          .slice(0, 8),
      };
    }

    const recordEnergy = records.length * 20;
    const favoriteEnergy = favorites.length * 10;
    const profileEnergy = context.isProfileCompleted ? 80 : 20;
    const posterEnergy = posters.length * 8;
    const value = Math.max(
      120,
      recordEnergy + favoriteEnergy + profileEnergy + posterEnergy,
    );

    return {
      value,
      unit: METRIC_CONFIGS[key].unit,
      label: '分',
      hasData: true,
      summary: `当前能量由记录、收藏、资料完整度和分享海报共同累积，分享海报贡献 ${posterEnergy} 分。`,
      breakdown: [
        { label: '报告与记录', value: `${recordEnergy} 分` },
        { label: '收藏内容', value: `${favoriteEnergy} 分` },
        { label: '资料完整', value: `${profileEnergy} 分` },
        { label: '分享海报', value: `${posterEnergy} 分` },
      ],
      sources: [
        ...records.map((record) => ({ ...record, valueDelta: 20 })),
        ...favorites.map((favorite) => ({ ...favorite, valueDelta: 10 })),
        ...posters.map((poster) => ({ ...poster, valueDelta: 8 })),
      ]
        .sort((left, right) => right.happenedAt.localeCompare(left.happenedAt))
        .slice(0, 8),
    };
  }

  private buildHistoryItems(key: ProfileMetricKey, context: MetricContext) {
    if (key === 'fortune_index') {
      return context.records
        .filter((record) => record.score !== null)
        .slice(0, 80)
        .map((record) => ({
          ...this.toHistoryItem(record),
          value: record.score,
          unit: '分',
        }));
    }

    if (key === 'mood_days') {
      return context.moodRecords.slice(0, 80).map((record) => ({
        ...this.toHistoryItem(record),
        value: record.moodScore,
        unit: '心情分',
      }));
    }

    if (key === 'explore_reports') {
      return [...context.records, ...context.posterSources]
        .sort((left, right) => right.happenedAt.localeCompare(left.happenedAt))
        .slice(0, 80)
        .map((source) => this.toHistoryItem(source));
    }

    return [
      ...context.records.map((record) => ({ ...record, valueDelta: 20 })),
      ...context.favorites.map((favorite) => ({ ...favorite, valueDelta: 10 })),
      ...context.posterSources.map((poster) => ({ ...poster, valueDelta: 8 })),
      {
        id: `profile:${context.user.id}`,
        sourceType: 'profile',
        sourceTypeLabel: '资料完整度',
        title: context.isProfileCompleted ? '资料已完善' : '基础资料待完善',
        summary: context.isProfileCompleted
          ? '生日、出生时间、出生地、星座与性别资料已完整。'
          : '补齐生日、出生时间、出生地等资料后可获得更高能量加成。',
        date: this.toDateKey(context.user.updatedAt),
        happenedAt: context.user.updatedAt.toISOString(),
        route: '/pages/profile/index',
        valueDelta: context.isProfileCompleted ? 80 : 20,
      },
    ]
      .sort((left, right) => right.happenedAt.localeCompare(left.happenedAt))
      .slice(0, 80)
      .map((source) => this.toHistoryItem(source));
  }

  private toHistoryItem(source: MetricSource) {
    return {
      id: source.id,
      date: source.date,
      title: source.title,
      summary: source.summary,
      sourceType: source.sourceType,
      sourceTypeLabel: source.sourceTypeLabel,
      route: source.route,
      happenedAt: source.happenedAt,
      valueDelta: source.valueDelta ?? null,
    };
  }

  private async upsertSnapshot(
    userId: string,
    key: ProfileMetricKey,
    snapshotDate: string,
    calculated: MetricCalculation,
  ) {
    const existing = await this.metricSnapshotRepository.findOne({
      where: {
        userId,
        metricKey: key,
        snapshotDate,
      },
    });
    const payload = existing ?? this.metricSnapshotRepository.create({
      userId,
      metricKey: key,
      snapshotDate,
    });

    payload.value = calculated.value;
    payload.unit = calculated.unit;
    payload.label = calculated.label;
    payload.summary = calculated.summary.slice(0, 255);
    payload.formulaVersion = 'v1';
    payload.breakdownJson = calculated.breakdown.map((item) => ({ ...item }));
    payload.sourceJson = calculated.sources.map((item) => ({
      id: item.id,
      sourceType: item.sourceType,
      sourceTypeLabel: item.sourceTypeLabel,
      title: item.title,
      summary: item.summary,
      happenedAt: item.happenedAt,
      route: item.route,
      valueDelta: item.valueDelta ?? null,
    }));

    await this.metricSnapshotRepository.save(payload);
  }

  private serializeRecordSource(record: UserRecordEntity): RecordSource {
    const resultData = this.asRecord(record.resultData);
    const date = this.resolveRecordDate(record);
    const score = record.score !== null ? Number(record.score) : null;
    const safeScore = Number.isFinite(score) ? score : null;

    return {
      id: `record:${record.id}`,
      sourceType: 'user_record',
      sourceTypeLabel: this.resolveRecordTypeLabel(record.recordType),
      recordType: record.recordType,
      title: record.resultTitle,
      summary: this.pickString(
        resultData.summary,
        this.pickString(resultData.subtitle, '已保存到历史记录'),
      ),
      date,
      happenedAt: this.resolveRecordTime(record),
      route: `/pages/report/index?recordId=${encodeURIComponent(record.id)}`,
      score: safeScore,
      value: safeScore ?? undefined,
    };
  }

  private serializeMoodSource(record: MoodRecordEntity): MoodSource {
    const tags = record.emotionTags ?? [];

    return {
      id: `mood:${record.id}`,
      sourceType: 'mood_record',
      sourceTypeLabel: '心情日记',
      title: `${this.resolveMoodTypeLabel(record.moodType)} · ${record.recordDate}`,
      summary:
        record.content ??
        (tags.length ? tags.join('、') : `心情分 ${record.moodScore}`),
      date: record.recordDate,
      happenedAt: record.updatedAt.toISOString(),
      route: `/pages/journal/index?recordId=${encodeURIComponent(record.id)}&recordDate=${encodeURIComponent(record.recordDate)}`,
      moodScore: record.moodScore,
      moodType: record.moodType,
      emotionTags: tags,
      value: record.moodScore,
    };
  }

  private serializeFavoriteSource(favorite: FavoriteEntity): MetricSource {
    return {
      id: `favorite:${favorite.id}`,
      sourceType: 'favorite',
      sourceTypeLabel: '收藏内容',
      title: favorite.title,
      summary: favorite.summary ?? '已收藏到个人资料',
      date: this.toDateKey(favorite.createdAt),
      happenedAt: favorite.createdAt.toISOString(),
      route: favorite.route,
      valueDelta: 10,
    };
  }

  private serializeShareSource(share: ShareRecordEntity): MetricSource {
    const route = this.resolvePosterRoute({
      sourceType: share.sourceType,
      sourceCode: share.sourceCode,
      recordId: share.recordId,
    });

    return {
      id: `share:${share.id}`,
      sourceType: 'share_record',
      sourceTypeLabel: '分享海报',
      title: share.posterTitle,
      summary: `${this.resolvePosterSourceLabel(share.sourceType)} · 已生成分享海报`,
      date: this.toDateKey(share.createdAt),
      happenedAt: share.createdAt.toISOString(),
      route,
      valueDelta: 8,
    };
  }

  private serializePosterJobSource(job: PosterJobEntity): MetricSource {
    const result = this.asRecord(job.resultJson);
    const request = this.asRecord(job.requestJson);
    const sourceType = this.pickString(
      result.sourceType,
      this.pickString(request.sourceType, job.jobType),
    );
    const recordId = this.pickString(request.recordId, '');
    const sourceCode = this.pickString(request.bizCode, '');

    return {
      id: `poster_job:${job.id}`,
      sourceType: 'poster_job',
      sourceTypeLabel: '分享海报',
      title: this.pickString(result.title, this.resolvePosterSourceLabel(sourceType)),
      summary: `${this.resolvePosterSourceLabel(sourceType)} · 异步海报任务已完成`,
      date: this.toDateKey(job.finishedAt ?? job.updatedAt),
      happenedAt: (job.finishedAt ?? job.updatedAt).toISOString(),
      route: this.resolvePosterRoute({ sourceType, sourceCode, recordId }),
      valueDelta: 8,
    };
  }

  private shouldIncludePosterJob(
    job: PosterJobEntity,
    sharePosterIds: Set<string>,
  ) {
    if (job.status !== 'completed' || job.jobType === 'lucky_wallpaper') {
      return false;
    }

    const result = this.asRecord(job.resultJson);
    const posterId = this.pickString(result.posterId, '');

    return !posterId || !sharePosterIds.has(posterId);
  }

  private resolvePosterRoute(input: {
    sourceType: string;
    sourceCode?: string | null;
    recordId?: string | null;
  }) {
    if (input.recordId) {
      return `/pages/report/index?recordId=${encodeURIComponent(input.recordId)}`;
    }

    if (input.sourceType === 'lucky_sign' && input.sourceCode) {
      return `/pages/lucky/sign/index?bizCode=${encodeURIComponent(input.sourceCode)}`;
    }

    if (input.sourceType === 'zodiac_today') {
      return '/pages/zodiac/index';
    }

    if (input.sourceType === 'today_index') {
      return '/pages/index/index';
    }

    return '/pages/records/index';
  }

  private resolveRecordDate(record: UserRecordEntity) {
    const resultData = this.asRecord(record.resultData);
    const completedAt = this.pickString(
      resultData.completedAt,
      this.pickString(resultData.generatedAt, record.createdAt.toISOString()),
    );
    const date = new Date(completedAt);

    return Number.isNaN(date.getTime())
      ? this.toDateKey(record.createdAt)
      : this.toDateKey(date);
  }

  private resolveRecordTime(record: UserRecordEntity) {
    const resultData = this.asRecord(record.resultData);
    const completedAt = this.pickString(
      resultData.completedAt,
      this.pickString(resultData.generatedAt, record.createdAt.toISOString()),
    );
    const date = new Date(completedAt);

    return Number.isNaN(date.getTime())
      ? record.createdAt.toISOString()
      : date.toISOString();
  }

  private resolveRecordTypeLabel(recordType: string) {
    const mapping: Record<string, string> = {
      personality: '性格测评',
      emotion: '情绪自检',
      bazi: '八字解读',
      zodiac: '星座运势',
      divination: '占卜解读',
    };

    return mapping[recordType] ?? '历史记录';
  }

  private resolvePosterSourceLabel(sourceType: string) {
    const mapping: Record<string, string> = {
      today_index: '今日综合',
      lucky_sign: '幸运签',
      zodiac_today: '星座海报',
      report_poster: '报告海报',
      poster: '分享海报',
      bazi: '八字报告',
      emotion: '情绪报告',
      personality: '性格报告',
      divination: '占卜海报',
    };

    return mapping[sourceType] ?? '分享海报';
  }

  private resolveMoodTypeLabel(moodType: string) {
    const mapping: Record<string, string> = {
      calm: '平静',
      low: '低落',
      anxious: '焦虑',
      happy: '愉悦',
      tired: '疲惫',
    };

    return mapping[moodType] ?? '心情记录';
  }

  private normalizeMetricKey(value: string): ProfileMetricKey | null {
    return METRIC_KEYS.includes(value as ProfileMetricKey)
      ? (value as ProfileMetricKey)
      : null;
  }

  private normalizeRangeDays(range?: string) {
    const parsed = Number(String(range ?? '30d').replace(/d$/i, ''));

    if (parsed === 7 || parsed === 30 || parsed === 90) {
      return parsed;
    }

    return 30;
  }

  private buildDateRange(days: number) {
    const today = new Date();

    return Array.from({ length: days }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - days + index + 1);
      return this.toDateKey(date);
    });
  }

  private calculateContinuousDays(dateKeys: string[], endDateKey: string) {
    const dateSet = new Set(dateKeys);
    const current = new Date(`${endDateKey}T00:00:00`);
    let count = 0;

    while (true) {
      const key = this.toDateKey(current);
      if (!dateSet.has(key)) {
        break;
      }

      count += 1;
      current.setDate(current.getDate() - 1);
    }

    return count;
  }

  private toDateKey(date: Date) {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private asRecord(input: unknown): Record<string, unknown> {
    return input && typeof input === 'object'
      ? (input as Record<string, unknown>)
      : {};
  }

  private pickString(value: unknown, fallback: string) {
    return typeof value === 'string' && value.trim() ? value.trim() : fallback;
  }

  private buildEnvelope<TData>(data: TData) {
    return {
      code: 0,
      message: 'ok',
      data,
      timestamp: new Date().toISOString(),
    };
  }
}
