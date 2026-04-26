import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { normalizeFileServiceUrlToApiProxy } from '../common/file-url.util';
import { AppConfigEntity } from '../database/entities/app-config.entity';
import { MeditationRecordEntity } from '../database/entities/meditation-record.entity';
import { MoodRecordEntity } from '../database/entities/mood-record.entity';
import { OrderEntity } from '../database/entities/order.entity';
import { UserRecordEntity } from '../database/entities/user-record.entity';
import { UserEntity } from '../database/entities/user.entity';
import { FavoritesService } from '../favorites/favorites.service';
import { MembershipService } from '../membership/membership.service';
import { SaveMeditationRecordDto } from './dto/save-meditation-record.dto';
import { SaveMoodRecordDto } from './dto/save-mood-record.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

const WESTERN_ZODIAC_BOUNDARIES = [
  { sign: '摩羯座', start: '01-01', end: '01-19' },
  { sign: '水瓶座', start: '01-20', end: '02-18' },
  { sign: '双鱼座', start: '02-19', end: '03-20' },
  { sign: '白羊座', start: '03-21', end: '04-19' },
  { sign: '金牛座', start: '04-20', end: '05-20' },
  { sign: '双子座', start: '05-21', end: '06-21' },
  { sign: '巨蟹座', start: '06-22', end: '07-22' },
  { sign: '狮子座', start: '07-23', end: '08-22' },
  { sign: '处女座', start: '08-23', end: '09-22' },
  { sign: '天秤座', start: '09-23', end: '10-23' },
  { sign: '天蝎座', start: '10-24', end: '11-22' },
  { sign: '射手座', start: '11-23', end: '12-21' },
  { sign: '摩羯座', start: '12-22', end: '12-31' },
] as const;

const FIVE_ELEMENT_NAMES = ['木', '火', '土', '金', '水'] as const;
const RECORD_WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'] as const;
const RECORD_LEGEND = [
  { type: 'calm', label: '平静' },
  { type: 'low', label: '低落' },
  { type: 'anxious', label: '焦虑' },
  { type: 'happy', label: '愉悦' },
  { type: 'tired', label: '疲惫' },
] as const;

const MEDITATION_CATEGORY_META: Record<
  string,
  {
    label: string;
    defaultTitle: string;
    summary: string;
  }
> = {
  meditation: {
    label: '基础静心',
    defaultTitle: '基础静心练习',
    summary: '适合晨间、午休或任何想重新安定下来的时刻。',
  },
  sleep: {
    label: '睡前安睡',
    defaultTitle: '睡前安睡练习',
    summary: '适合入睡前关掉白天的紧绷，给身体一个下线信号。',
  },
  breath: {
    label: '呼吸减压',
    defaultTitle: '呼吸减压练习',
    summary: '适合焦虑、烦躁或节奏过快时，用呼吸把注意力带回当下。',
  },
  focus: {
    label: '专注启动',
    defaultTitle: '专注启动练习',
    summary: '适合开始工作或学习前，先确认优先级并降低分心。',
  },
  healing: {
    label: '情绪修复',
    defaultTitle: '情绪修复练习',
    summary: '适合情绪起伏后，允许感受存在，同时重新稳定身体。',
  },
  body: {
    label: '身体扫描',
    defaultTitle: '身体扫描练习',
    summary: '适合久坐、疲惫或身体紧绷时，逐段观察并松开压力。',
  },
};

const MEDITATION_SOURCE_LABELS: Record<string, string> = {
  explore: '探索推荐',
  emotion: '情绪疗愈',
  sleep: '睡眠放松',
  music: '冥想音乐',
  custom: '自定义练习',
};

const DEFAULT_MEDITATION_MUSIC_LIBRARY = [
  {
    id: 'evening-body-scan',
    title: '睡前身体扫描',
    subtitle: '从脚到头慢慢放松，适合睡前 15 分钟关闭白天的紧绷。',
    category: 'sleep',
    categoryLabel: '睡前安睡',
    durationMinutes: 12,
    atmosphere: '低频环境音',
    scene: '入睡困难、身体紧绷、脑内还在复盘白天时使用。',
    guide: ['调暗灯光，放下手机', '从脚趾开始逐段放松', '结束后不再处理复杂信息'],
    tags: ['安睡', '身体放松', '晚间'],
    previewUrl: 'https://actions.google.com/sounds/v1/ambiences/ocean_waves.ogg',
  },
  {
    id: 'box-breath-reset',
    title: '四拍呼吸复位',
    subtitle: '吸气、停顿、呼气、停顿各四拍，快速把注意力带回身体。',
    category: 'breath',
    categoryLabel: '呼吸减压',
    durationMinutes: 5,
    atmosphere: '极简提示音',
    scene: '焦虑上头、会议前、通勤中或需要马上降速时使用。',
    guide: ['吸气 4 拍', '停顿 4 拍', '呼气 4 拍，再停顿 4 拍'],
    tags: ['急救', '短练习', '呼吸'],
    previewUrl: 'https://actions.google.com/sounds/v1/ambiences/woodland_night.ogg',
  },
  {
    id: 'forest-focus',
    title: '林间专注启动',
    subtitle: '先稳定呼吸，再给今天最重要的一件事留出清晰入口。',
    category: 'focus',
    categoryLabel: '专注启动',
    durationMinutes: 10,
    atmosphere: '自然环境音',
    scene: '开始工作、学习前，或注意力碎片化时使用。',
    guide: ['写下一个任务', '跟随 10 次自然呼吸', '结束后立刻开始第一步'],
    tags: ['专注', '工作前', '清晰'],
    previewUrl: 'https://actions.google.com/sounds/v1/ambiences/birds_in_forest.ogg',
  },
  {
    id: 'tidal-emotion-reset',
    title: '潮汐情绪复位',
    subtitle: '允许情绪像潮水一样来去，练习不评判地观察和安放。',
    category: 'healing',
    categoryLabel: '情绪修复',
    durationMinutes: 8,
    atmosphere: '海浪与低频铺底',
    scene: '情绪起伏、委屈、烦躁或需要重新稳定身体节奏时使用。',
    guide: ['给情绪命名', '把注意力放到胸口或腹部', '用一句温柔的话收束'],
    tags: ['情绪', '接纳', '复位'],
    previewUrl: 'https://actions.google.com/sounds/v1/water/dripping_water.ogg',
  },
  {
    id: 'morning-grounding',
    title: '晨间安定练习',
    subtitle: '用 7 分钟确认身体、环境和今天的优先级，让一天不被推着走。',
    category: 'meditation',
    categoryLabel: '基础静心',
    durationMinutes: 7,
    atmosphere: '清晨轻环境音',
    scene: '起床后、出门前，或想给一天定一个稳定基调时使用。',
    guide: ['感受双脚和坐骨', '观察三处环境声音', '确认今天只先做好一件事'],
    tags: ['晨间', '安定', '意图'],
    previewUrl: 'https://actions.google.com/sounds/v1/ambiences/birds_in_forest.ogg',
  },
  {
    id: 'shoulder-release',
    title: '肩颈松开练习',
    subtitle: '把注意力放到肩颈、下颌和眼周，适合久坐后的身体修复。',
    category: 'body',
    categoryLabel: '身体扫描',
    durationMinutes: 9,
    atmosphere: '柔和白噪',
    scene: '久坐、肩颈紧、头脑疲惫但又不想睡觉时使用。',
    guide: ['觉察肩膀高度', '放松下颌和眼周', '缓慢转动肩颈后记录身体变化'],
    tags: ['肩颈', '久坐', '身体觉察'],
    previewUrl: 'https://actions.google.com/sounds/v1/ambiences/ocean_waves.ogg',
  },
] as const;

const USER_PREFERENCE_DEFAULTS = {
  dailyReminderEnabled: true,
  luckyPushEnabled: true,
  quietModeEnabled: false,
  saveHistoryCardsEnabled: true,
  themeMode: 'auto',
  manualThemeKey: '',
} as const;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(AppConfigEntity)
    private readonly appConfigRepository: Repository<AppConfigEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(UserRecordEntity)
    private readonly userRecordRepository: Repository<UserRecordEntity>,
    @InjectRepository(MoodRecordEntity)
    private readonly moodRecordRepository: Repository<MoodRecordEntity>,
    @InjectRepository(MeditationRecordEntity)
    private readonly meditationRecordRepository: Repository<MeditationRecordEntity>,
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
    private readonly favoritesService: FavoritesService,
    private readonly membershipService: MembershipService,
  ) {}

  getCurrentProfile(user: UserEntity) {
    return this.buildEnvelope({
      user: this.authService.serializeUser(user),
      isProfileCompleted: Boolean(user.birthday && user.zodiac),
    });
  }

  getPreferences(user: UserEntity) {
    return this.buildEnvelope({
      settings: this.normalizeUserPreferences(user.preferencesJson),
    });
  }

  async getProfilePage(user: UserEntity | null) {
    const serializedUser = user ? this.authService.serializeUser(user) : null;
    const isLoggedIn = Boolean(user);
    const isProfileCompleted = Boolean(user?.birthday && user?.zodiac);
    const isVipActive = this.membershipService.isVipActive(user);
    const recentHistory = user ? await this.loadUnifiedHistoryItems(user, 3) : [];
    const latestScore = recentHistory.find((item) => item.score !== null)?.score ?? null;

    const [totalRecords, moodDayCount, orderCount, paidOrderCount, favoriteCount] = user
      ? await Promise.all([
          this.userRecordRepository.count({
            where: { userId: user.id },
          }),
          this.countDistinctMoodDays(user.id),
          this.orderRepository.count({
            where: { userId: user.id },
          }),
          this.orderRepository.count({
            where: { userId: user.id, status: 'paid' },
          }),
          this.favoritesService.countFavorites(user.id),
        ])
      : [0, 0, 0, 0, 0];

    const vipExpireText = isVipActive ? this.formatDate(serializedUser?.vipExpiredAt) : null;

    return this.buildEnvelope({
      isLoggedIn,
      user: serializedUser,
      isProfileCompleted,
      hero: {
        displayName: serializedUser?.nickname ?? '清浅',
        vipLabel: isVipActive ? 'VIP' : '普通用户',
        signature: !isLoggedIn
          ? '愿你成为自己的光，温柔而有力量。'
          : isProfileCompleted
            ? '愿你成为自己的光，温柔而有力量。'
            : '补齐资料后，你的主题、报告与状态判断会更贴近自己。',
        sessionHint: !isLoggedIn
          ? '登录后会把记录、会员状态和主题偏好绑定到当前账号。'
          : isProfileCompleted
            ? '资料已完善，首页与探索页会优先参考你的资料。'
            : '生日和出生时间补齐后，会自动生成星座与五行信息。',
      },
      membershipCard: {
        title: '开通会员 · 解锁全部权益',
        summary: isVipActive
          ? `当前会员已生效${vipExpireText ? `，有效期至 ${vipExpireText}` : ''}。`
          : orderCount
            ? `你已有 ${orderCount} 笔订单记录，开通后可自动解锁更多完整内容。`
            : '享受专属报告、好运加持等 12 项特权。',
        buttonText: isVipActive ? '查看权益' : '立即开通',
        route: '/pages/membership/index',
      },
      dataCards: [
        {
          title: '综合气运指数',
          value: latestScore !== null ? `${latestScore}` : '--',
          meta: latestScore !== null ? (latestScore >= 80 ? '优秀' : '平稳') : '登录后同步',
          tone: 'mist',
        },
        {
          title: '心情记录天数',
          value: isLoggedIn ? `${moodDayCount}` : '--',
          meta: isLoggedIn ? '天' : '登录后同步',
          tone: 'blush',
        },
        {
          title: '探索报告',
          value: isLoggedIn ? `${totalRecords}` : '--',
          meta: isLoggedIn ? '份' : '登录后同步',
          tone: 'mint',
        },
        {
          title: '好运能量值',
          value: isLoggedIn
            ? `${Math.max(120, totalRecords * 20 + favoriteCount * 10 + (isProfileCompleted ? 80 : 20))}`
            : '--',
          meta: isLoggedIn ? '分' : '登录后同步',
          tone: 'gold',
        },
      ],
      tools: this.buildProfileTools(),
      services: this.buildProfileServices({
        orderCount,
        paidOrderCount,
        reportCount: totalRecords,
        favoriteCount,
      }),
      recentHistory,
    });
  }

  async updateProfile(user: UserEntity, dto: UpdateProfileDto) {
    const profile = this.buildProfile(dto);

    user.nickname = dto.nickname ?? user.nickname;
    user.avatarUrl = dto.avatarUrl ?? user.avatarUrl;
    user.birthday = dto.birthday;
    user.birthTime = dto.birthTime ?? user.birthTime ?? null;
    user.gender = dto.gender;
    user.zodiac = profile.zodiac;
    user.baziSummary = profile.baziSummary;
    user.fiveElements = profile.fiveElements;

    const savedUser = await this.userRepository.save(user);

    return {
      code: 0,
      message: 'ok',
      data: {
        user: this.authService.serializeUser(savedUser),
        isProfileCompleted: true,
      },
      timestamp: new Date().toISOString(),
    };
  }

  async updatePreferences(user: UserEntity, dto: UpdatePreferencesDto) {
    const currentSettings = this.normalizeUserPreferences(user.preferencesJson);
    const nextSettings = {
      ...currentSettings,
      ...this.pickDefinedPreferencePatch(dto),
    };

    if (nextSettings.themeMode !== 'manual') {
      nextSettings.manualThemeKey = nextSettings.manualThemeKey || '';
    }

    user.preferencesJson = nextSettings;
    const savedUser = await this.userRepository.save(user);

    return this.buildEnvelope({
      settings: this.normalizeUserPreferences(savedUser.preferencesJson),
    });
  }

  async getUnifiedHistory(user: UserEntity, limit?: number) {
    return this.buildEnvelope({
      items: await this.loadUnifiedHistoryItems(
        user,
        Math.min(30, Math.max(1, Number(limit) || 20)),
      ),
    });
  }

  async getMoodRecords(user: UserEntity) {
    const records = await this.moodRecordRepository.find({
      where: {
        userId: user.id,
      },
      order: {
        recordDate: 'DESC',
        updatedAt: 'DESC',
      },
      take: 30,
    });

    return this.buildEnvelope({
      items: records.map((record) => this.serializeMoodRecord(record)),
    });
  }

  async getMoodRecordDetail(
    user: UserEntity,
    query: {
      recordDate?: string;
      recordId?: string;
    },
  ) {
    const targetRecord = query.recordId
      ? await this.moodRecordRepository.findOne({
          where: {
            id: query.recordId,
            userId: user.id,
          },
        })
      : query.recordDate
        ? await this.moodRecordRepository.findOne({
            where: {
              userId: user.id,
              recordDate: query.recordDate,
            },
          })
        : null;

    const recentRecords = await this.moodRecordRepository.find({
      where: {
        userId: user.id,
      },
      order: {
        recordDate: 'DESC',
        updatedAt: 'DESC',
      },
      take: 6,
    });

    return this.buildEnvelope({
      item: targetRecord ? this.serializeMoodRecord(targetRecord) : null,
      recentItems: recentRecords
        .filter((record) => record.id !== targetRecord?.id)
        .slice(0, 4)
        .map((record) => this.serializeMoodRecord(record)),
    });
  }

  async saveMoodRecord(user: UserEntity, dto: SaveMoodRecordDto) {
    const existing = dto.recordId
      ? await this.moodRecordRepository.findOne({
          where: {
            id: dto.recordId,
            userId: user.id,
          },
        })
      : await this.moodRecordRepository.findOne({
          where: {
            userId: user.id,
            recordDate: dto.recordDate,
          },
        });

    const record =
      existing ??
      this.moodRecordRepository.create({
        userId: user.id,
      });

    record.recordDate = dto.recordDate;
    record.moodType = dto.moodType;
    record.moodScore = dto.moodScore;
    record.emotionTags = dto.emotionTags?.slice(0, 8) ?? [];
    record.content = dto.content?.trim() || null;

    const saved = await this.moodRecordRepository.save(record);

    return this.buildEnvelope({
      item: this.serializeMoodRecord(saved),
    });
  }

  async getMeditationRecords(user: UserEntity) {
    const records = await this.meditationRecordRepository.find({
      where: {
        userId: user.id,
      },
      order: {
        recordDate: 'DESC',
        updatedAt: 'DESC',
      },
      take: 30,
    });

    return this.buildEnvelope({
      items: records.map((record) => this.serializeMeditationRecord(record)),
    });
  }

  async getMeditationMusicLibrary() {
    const config = await this.appConfigRepository.findOne({
      where: {
        namespace: 'meditation',
        configKey: 'music_library',
        status: 'published',
      },
      order: {
        publishedAt: 'DESC',
        updatedAt: 'DESC',
      },
    });

    const rawItems = Array.isArray((config?.valueJson as { items?: unknown[] } | null)?.items)
      ? ((config?.valueJson as { items?: unknown[] }).items ?? [])
      : [];

    const items = rawItems
      .map((item, index) => this.normalizeMeditationMusicItem(item, index))
      .filter((item): item is NonNullable<typeof item> => Boolean(item));

    return this.buildEnvelope({
      source: items.length ? 'config' : 'fallback',
      items: items.length ? items : DEFAULT_MEDITATION_MUSIC_LIBRARY,
    });
  }

  async getMeditationRecordDetail(user: UserEntity, recordId?: string) {
    const targetRecord = recordId
      ? await this.meditationRecordRepository.findOne({
          where: {
            id: recordId,
            userId: user.id,
          },
        })
      : null;

    const recentRecords = await this.meditationRecordRepository.find({
      where: {
        userId: user.id,
      },
      order: {
        recordDate: 'DESC',
        updatedAt: 'DESC',
      },
      take: 6,
    });

    return this.buildEnvelope({
      item: targetRecord ? this.serializeMeditationRecord(targetRecord) : null,
      recentItems: recentRecords
        .filter((record) => record.id !== targetRecord?.id)
        .slice(0, 4)
        .map((record) => this.serializeMeditationRecord(record)),
    });
  }

  async saveMeditationRecord(user: UserEntity, dto: SaveMeditationRecordDto) {
    const existing = dto.recordId
      ? await this.meditationRecordRepository.findOne({
          where: {
            id: dto.recordId,
            userId: user.id,
          },
        })
      : null;

    const completionStatus = dto.completionStatus ?? (dto.completed === false ? 'partial' : 'completed');
    const record =
      existing ??
      this.meditationRecordRepository.create({
        userId: user.id,
      });

    const category = this.normalizeMeditationCategory(dto.category);
    const categoryMeta = this.resolveMeditationCategoryMeta(category);

    record.recordDate = dto.recordDate;
    record.title = dto.title.trim() || categoryMeta.defaultTitle;
    record.category = category;
    record.sourceType = dto.sourceType?.trim() || 'custom';
    record.sourceTitle = dto.sourceTitle?.trim() || null;
    record.durationMinutes = dto.durationMinutes;
    record.completed = completionStatus === 'completed';
    record.completionStatus = completionStatus;
    record.summary = dto.summary?.trim() || null;
    record.intention = dto.intention?.trim() || null;
    record.moodBefore = dto.moodBefore?.trim() || null;
    record.moodAfter = dto.moodAfter?.trim() || null;
    record.focusScore = dto.focusScore ?? null;
    record.bodySignal = dto.bodySignal?.trim() || null;
    record.insight = dto.insight?.trim() || null;
    record.nextAction = dto.nextAction?.trim() || null;

    const saved = await this.meditationRecordRepository.save(record);

    return this.buildEnvelope({
      item: this.serializeMeditationRecord(saved),
    });
  }

  async getRecordOverview(user: UserEntity | null) {
    const isLoggedIn = Boolean(user);
    const [testRecords, moodRecords, meditationRecords] = user
      ? await Promise.all([
          this.userRecordRepository.find({
            where: {
              userId: user.id,
            },
            order: {
              createdAt: 'DESC',
            },
            take: 24,
          }),
          this.moodRecordRepository.find({
            where: {
              userId: user.id,
            },
            order: {
              recordDate: 'DESC',
              updatedAt: 'DESC',
            },
            take: 31,
          }),
          this.meditationRecordRepository.find({
            where: {
              userId: user.id,
            },
            order: {
              recordDate: 'DESC',
              updatedAt: 'DESC',
            },
            take: 60,
          }),
        ])
      : [[], [], []];
    const meditationAggregate = user
      ? await this.loadMeditationAggregate(user.id)
      : { totalCount: 0, totalMinutes: 0 };

    const latestMoodScore =
      moodRecords[0]?.moodScore ??
      this.resolveLatestEmotionScore(testRecords.filter((record) => record.recordType === 'emotion'));
    const trendPoints = this.buildTrendPoints(moodRecords);
    const hasEnoughTrendData =
      trendPoints.filter((point) => point.value !== null).length >= 3;
    const recordedDays = new Set(
      [
        ...testRecords.map((record) => this.resolveResultRecordDate(record)),
        ...moodRecords.map((record) => record.recordDate),
        ...meditationRecords.map((record) => record.recordDate),
      ].filter((value): value is string => Boolean(value)),
    ).size;

    const overview = {
      recordedDays: isLoggedIn ? recordedDays : 0,
      emotionalStability: latestMoodScore,
      healingProgress:
        isLoggedIn && latestMoodScore > 0
          ? Math.max(62, Math.min(96, latestMoodScore + 8))
          : 0,
      encouragement: isLoggedIn
        ? '你正在慢慢靠近更平和的自己'
        : '先建立第一条记录，变化会开始被看见',
      actionText: isLoggedIn ? '继续记录' : '去登录',
    };

    const monthKeywords = isLoggedIn
      ? latestMoodScore >= 75
        ? '放松 · 接纳 · 修复'
        : latestMoodScore >= 60
          ? '稳定 · 呼吸 · 调整'
          : '减压 · 休息 · 支持'
      : '放松 · 接纳 · 修复';

    return this.buildEnvelope({
      isLoggedIn,
      overview,
      calendar: {
        monthLabel: this.getCurrentMonthLabel(),
        weekdays: ['一', '二', '三', '四', '五', '六', '日'],
        days: this.buildCalendarDays(moodRecords),
        legend: RECORD_LEGEND,
      },
      trend: {
        summary: !isLoggedIn
          ? '登录后可以看到你的趋势变化'
          : hasEnoughTrendData
            ? '最近一周整体趋于平稳'
            : '继续记录几天后，就能看到更清晰的变化曲线',
        hasEnoughData: hasEnoughTrendData,
        points: trendPoints,
      },
      moodRecords: moodRecords.slice(0, 12).map((record) => this.serializeMoodRecord(record)),
      testRecords: user
        ? testRecords.map((record) =>
            this.serializeUnifiedHistoryItem(
              record,
              this.membershipService.isVipActive(user),
            ),
          )
        : [],
      meditationRecords: meditationRecords
        .slice(0, 12)
        .map((record) => this.serializeMeditationRecord(record)),
      meditationStats: this.buildMeditationStats(
        meditationRecords,
        meditationAggregate,
        isLoggedIn,
      ),
      growth: {
        continuousDays: this.calculateContinuousDays(
          [
            ...testRecords.map((record) => this.resolveResultRecordDate(record)),
            ...moodRecords.map((record) => record.recordDate),
            ...meditationRecords.map((record) => record.recordDate),
          ].filter((value): value is string => Boolean(value)),
        ),
        monthKeywords,
      },
      favorites: user
        ? await this.favoritesService.listRecentFavorites(user.id, 2)
        : this.buildFavoriteItems(),
    });
  }

  private buildProfile(dto: UpdateProfileDto) {
    const zodiac = this.computeWesternZodiac(dto.birthday);
    const fiveElements = this.computeFiveElements(dto.birthday, dto.birthTime);
    const dominantElement = Object.entries(fiveElements).sort(
      (left, right) => right[1] - left[1],
    )[0][0];

    return {
      zodiac,
      fiveElements,
      baziSummary: `简易测算显示你的能量偏向${dominantElement}，建议保持节奏与情绪平衡。`,
    };
  }

  private computeWesternZodiac(birthday: string) {
    const date = birthday.slice(5, 10);

    return (
      WESTERN_ZODIAC_BOUNDARIES.find(
        (item) => date >= item.start && date <= item.end,
      )?.sign ?? '摩羯座'
    );
  }

  private computeFiveElements(birthday: string, birthTime?: string) {
    const [year, month, day] = birthday.split('-').map((value) => Number(value));
    const hour = birthTime ? Number.parseInt(birthTime.slice(0, 2), 10) : 12;
    const seed = year + month * 3 + day * 5 + hour * 7;

    return FIVE_ELEMENT_NAMES.reduce<Record<string, number>>((result, element, index) => {
      result[element] = ((seed + index * 11) % 9) + 1;
      return result;
    }, {});
  }

  private serializeUnifiedHistoryItem(record: UserRecordEntity, hasVipAccess: boolean) {
    const resultData = record.resultData as {
      summary?: string;
      subtitle?: string;
      scoreRangeLabel?: string;
      dominantDimension?: { label?: string };
      supportSignal?: string;
      completedAt?: string;
    };
    const typeMeta = this.resolveRecordTypeMeta(record.recordType);

    return {
      id: record.id,
      recordType: record.recordType,
      recordTypeLabel: typeMeta.label,
      sourceCode: record.sourceCode,
      title: record.resultTitle,
      score: record.score ? Number(record.score) : null,
      level: record.resultLevel,
      summary: resultData.summary ?? '',
      subtitle: resultData.subtitle ?? '',
      detailHint:
        resultData.dominantDimension?.label ??
        resultData.scoreRangeLabel ??
        resultData.supportSignal ??
        '',
      completedAt: resultData.completedAt ?? record.createdAt.toISOString(),
      route: `/pages/report/index?recordId=${record.id}`,
      isFullReportUnlocked: record.isFullReportUnlocked || hasVipAccess,
    };
  }

  private serializeMoodRecord(record: MoodRecordEntity) {
    return {
      id: record.id,
      recordDate: record.recordDate,
      moodType: record.moodType,
      moodScore: record.moodScore,
      emotionTags: record.emotionTags ?? [],
      content: record.content ?? '',
      updatedAt: record.updatedAt.toISOString(),
      route: `/pages/journal/index?recordId=${encodeURIComponent(record.id)}&recordDate=${encodeURIComponent(record.recordDate)}`,
    };
  }

  private serializeMeditationRecord(record: MeditationRecordEntity) {
    const categoryMeta = this.resolveMeditationCategoryMeta(record.category);

    return {
      id: record.id,
      recordDate: record.recordDate,
      title: record.title,
      category: record.category,
      categoryLabel: categoryMeta.label,
      categorySummary: categoryMeta.summary,
      sourceType: record.sourceType,
      sourceTypeLabel: MEDITATION_SOURCE_LABELS[record.sourceType] ?? '自定义练习',
      sourceTitle: record.sourceTitle ?? '',
      durationMinutes: record.durationMinutes,
      completed: record.completed,
      completionStatus: record.completionStatus,
      summary: record.summary ?? record.insight ?? record.nextAction ?? '',
      intention: record.intention ?? '',
      moodBefore: record.moodBefore ?? '',
      moodAfter: record.moodAfter ?? '',
      focusScore: record.focusScore ?? null,
      bodySignal: record.bodySignal ?? '',
      insight: record.insight ?? '',
      nextAction: record.nextAction ?? '',
      updatedAt: record.updatedAt.toISOString(),
      route: `/pages/meditation/index?recordId=${encodeURIComponent(record.id)}`,
    };
  }

  private resolveRecordTypeMeta(recordType: string) {
    const mapping: Record<string, { label: string; route: string }> = {
      personality: {
        label: '性格测评',
        route: '/pages/personality/index',
      },
      emotion: {
        label: '情绪自检',
        route: '/pages/emotion/index',
      },
      bazi: {
        label: '八字解读',
        route: '/pages/bazi/index',
      },
      zodiac: {
        label: '星座运势',
        route: '/pages/zodiac/index',
      },
    };

    return (
      mapping[recordType] ?? {
        label: '历史记录',
        route: '/pages/profile/index',
      }
    );
  }

  private async loadUnifiedHistoryItems(user: UserEntity, take: number) {
    const hasVipAccess = this.membershipService.isVipActive(user);
    const records = await this.userRecordRepository.find({
      where: {
        userId: user.id,
      },
      order: {
        createdAt: 'DESC',
      },
      take,
    });

    return records.map((record) =>
      this.serializeUnifiedHistoryItem(record, hasVipAccess),
    );
  }

  private resolveLatestEmotionScore(records: Array<{ score: string | number | null }>) {
    const latest = records.find((record) => record.score !== null);
    const parsed = latest && latest.score !== null ? Number(latest.score) : NaN;

    return Number.isFinite(parsed) ? Math.round(parsed) : 0;
  }

  private buildCalendarDays(records: MoodRecordEntity[]) {
    const scoreByDate = new Map<string, number>();
    const moodTypeByDate = new Map<string, string>();

    for (const record of records) {
      const dateKey = record.recordDate;

      if (!dateKey || scoreByDate.has(dateKey)) {
        continue;
      }

      scoreByDate.set(dateKey, record.moodScore);
      moodTypeByDate.set(dateKey, record.moodType);
    }

    const today = new Date();

    return Array.from({ length: 14 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - 13 + index);
      const dateKey = this.toDateKey(date);
      const score = scoreByDate.get(dateKey);

      return {
        date: dateKey,
        day: date.getDate(),
        moodType: (moodTypeByDate.get(dateKey) ?? this.resolveMoodType(score)) as
          | 'calm'
          | 'low'
          | 'anxious'
          | 'happy'
          | 'tired',
        hasRecord: scoreByDate.has(dateKey),
      };
    });
  }

  private buildTrendPoints(records: MoodRecordEntity[]) {
    const scoreByDate = new Map<string, number>();

    for (const record of records) {
      const dateKey = record.recordDate;

      if (!dateKey || scoreByDate.has(dateKey)) {
        continue;
      }

      scoreByDate.set(dateKey, record.moodScore);
    }

    const today = new Date();

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - 6 + index);
      const dateKey = this.toDateKey(date);

      return {
        day: RECORD_WEEKDAYS[date.getDay()],
        value: scoreByDate.get(dateKey) ?? null,
      };
    });
  }

  private calculateContinuousDays(recordDates: string[]) {
    const dateSet = new Set(recordDates);

    let count = 0;
    const current = new Date();

    while (true) {
      const key = this.toDateKey(current);
      if (!dateSet.has(key)) {
        break;
      }

      count += 1;
      current.setDate(current.getDate() - 1);
    }

    return Math.max(count, recordDates.length ? 1 : 0);
  }

  private async loadMeditationAggregate(userId: string) {
    const raw = await this.meditationRecordRepository
      .createQueryBuilder('record')
      .select('COUNT(record.id)', 'totalCount')
      .addSelect('COALESCE(SUM(record.durationMinutes), 0)', 'totalMinutes')
      .where('record.userId = :userId', { userId })
      .getRawOne<{ totalCount?: string | number; totalMinutes?: string | number }>();

    return {
      totalCount: Number(raw?.totalCount ?? 0),
      totalMinutes: Number(raw?.totalMinutes ?? 0),
    };
  }

  private buildMeditationStats(
    records: MeditationRecordEntity[],
    aggregate: { totalCount: number; totalMinutes: number },
    isLoggedIn: boolean,
  ) {
    if (!isLoggedIn) {
      return {
        weeklyCount: 0,
        weeklyMinutes: 0,
        totalCount: 0,
        totalMinutes: 0,
        favoriteCategory: '暂无',
        favoriteCategoryCount: 0,
        improvementRate: 0,
        improvedCount: 0,
        bestAfterState: '暂无',
        insight: '登录后会根据冥想记录生成练习洞察。',
      };
    }

    const today = new Date();
    const todayKey = this.toDateKey(today);
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 6);
    const weekStartKey = this.toDateKey(weekStart);
    const weeklyRecords = records.filter(
      (record) => record.recordDate >= weekStartKey && record.recordDate <= todayKey,
    );
    const completedRecords = records.filter(
      (record) => record.completionStatus !== 'skipped',
    );
    const categoryCounts = new Map<string, number>();
    const afterStateCounts = new Map<string, number>();

    for (const record of completedRecords) {
      categoryCounts.set(record.category, (categoryCounts.get(record.category) ?? 0) + 1);

      if (record.moodAfter) {
        afterStateCounts.set(record.moodAfter, (afterStateCounts.get(record.moodAfter) ?? 0) + 1);
      }
    }

    const [favoriteCategoryCode = '', favoriteCategoryCount = 0] =
      Array.from(categoryCounts.entries()).sort((left, right) => right[1] - left[1])[0] ?? [];
    const [bestAfterStateCode = ''] =
      Array.from(afterStateCounts.entries()).sort((left, right) => right[1] - left[1])[0] ?? [];
    const improvedAfterStates = new Set(['settled', 'clear', 'relaxed', 'sleepy']);
    const afterStateRecords = records.filter((record) => Boolean(record.moodAfter));
    const improvedCount = afterStateRecords.filter((record) =>
      improvedAfterStates.has(record.moodAfter ?? ''),
    ).length;
    const improvementRate = afterStateRecords.length
      ? Math.round((improvedCount / afterStateRecords.length) * 100)
      : 0;
    const favoriteCategory = favoriteCategoryCode
      ? this.resolveMeditationCategoryMeta(favoriteCategoryCode).label
      : '暂无';
    const bestAfterState = this.resolveMeditationMoodLabel(bestAfterStateCode);

    return {
      weeklyCount: weeklyRecords.length,
      weeklyMinutes: weeklyRecords.reduce((sum, record) => sum + record.durationMinutes, 0),
      totalCount: aggregate.totalCount,
      totalMinutes: aggregate.totalMinutes,
      favoriteCategory,
      favoriteCategoryCount,
      improvementRate,
      improvedCount,
      bestAfterState,
      insight: this.buildMeditationInsightText({
        weeklyCount: weeklyRecords.length,
        weeklyMinutes: weeklyRecords.reduce((sum, record) => sum + record.durationMinutes, 0),
        favoriteCategory,
        improvementRate,
        totalCount: aggregate.totalCount,
      }),
    };
  }

  private buildMeditationInsightText(input: {
    weeklyCount: number;
    weeklyMinutes: number;
    favoriteCategory: string;
    improvementRate: number;
    totalCount: number;
  }) {
    if (!input.totalCount) {
      return '完成 3 次以上练习后，会开始生成更贴近你的冥想洞察。';
    }

    if (input.improvementRate >= 60 && input.favoriteCategory !== '暂无') {
      return `最近更适合${input.favoriteCategory}，${input.improvementRate}% 的记录显示练后状态有改善。`;
    }

    if (input.weeklyCount > 0) {
      return `本周已练习 ${input.weeklyCount} 次，共 ${input.weeklyMinutes} 分钟，继续记录会让偏好更清楚。`;
    }

    return '这周还没有冥想记录，可以从一次 5 分钟呼吸练习开始。';
  }

  private resolveMeditationMoodLabel(value?: string | null) {
    const mapping: Record<string, string> = {
      tense: '紧绷',
      tired: '疲惫',
      anxious: '焦虑',
      scattered: '分心',
      calm: '平稳',
      settled: '更平静',
      clear: '更清晰',
      relaxed: '放松了',
      sleepy: '有点困',
      unchanged: '变化不大',
    };

    return value ? mapping[value] ?? value : '暂无';
  }

  private async countDistinctMoodDays(userId: string) {
    const records = await this.moodRecordRepository.find({
      where: { userId },
      select: {
        recordDate: true,
      },
      take: 365,
    });

    return new Set(records.map((item) => item.recordDate)).size;
  }

  private buildProfileTools() {
    return [
      {
        title: '心情日记',
        description: '记录心情',
        icon: '记',
        route: '/pages/journal/index',
      },
      {
        title: '冥想放松',
        description: '舒缓身心',
        icon: '静',
        route: '/pages/meditation/index',
      },
      {
        title: '睡眠助手',
        description: '晚间疗愈',
        icon: '眠',
        route: '/pages/meditation/index',
      },
      {
        title: '专注计时',
        description: '回到当下',
        icon: '时',
        route: '/pages/meditation/index',
      },
      {
        title: '能量音乐',
        description: '稳定节奏',
        icon: '乐',
        route: '/pages/lucky/index',
      },
    ];
  }

  private buildProfileServices(input: {
    orderCount: number;
    paidOrderCount: number;
    reportCount: number;
    favoriteCount: number;
  }) {
    return [
      {
        title: '我的订单',
        description: input.orderCount
          ? `共 ${input.orderCount} 笔订单${input.paidOrderCount ? `，已支付 ${input.paidOrderCount} 笔` : ''}`
          : '暂无订单记录',
        icon: '单',
        route: '/pages/membership/index',
      },
      {
        title: '我的报告',
        description: input.reportCount ? `已生成 ${input.reportCount} 份报告` : '暂无报告记录',
        icon: '报',
        route: '/pages/records/index',
      },
      {
        title: '我的收藏',
        description: input.favoriteCount
          ? `已收藏 ${input.favoriteCount} 项内容`
          : '暂无保存内容',
        icon: '藏',
        route: '/pages/favorites/index',
      },
      {
        title: '我的咨询',
        description: '',
        icon: '询',
        route: '/pages/settings/feedback/index',
      },
      {
        title: '邀请好友',
        description: '得 7 天会员',
        icon: '邀',
        route: '/pages/membership/index',
      },
    ];
  }

  private buildFavoriteItems() {
    return [
      {
        id: 'sleep',
        title: '睡前呼吸音频',
        description: '温柔呼吸，安心入眠',
        icon: '眠',
        action: '播放',
        route: '/pages/meditation/index',
      },
      {
        id: 'reset',
        title: '情绪复位练习',
        description: '平复情绪，找回平衡',
        icon: '莲',
        action: '练习',
        route: '/pages/emotion/index',
      },
    ];
  }

  private resolveMoodType(score?: number) {
    if (!Number.isFinite(score)) {
      return 'calm';
    }

    if ((score ?? 0) >= 80) {
      return 'happy';
    }

    if ((score ?? 0) >= 65) {
      return 'calm';
    }

    if ((score ?? 0) >= 50) {
      return 'tired';
    }

    if ((score ?? 0) >= 35) {
      return 'low';
    }

    return 'anxious';
  }

  private resolveResultRecordDate(record: UserRecordEntity) {
    const resultData = record.resultData as { completedAt?: string };
    const raw = resultData.completedAt ?? record.createdAt.toISOString();
    const date = new Date(raw);

    return Number.isNaN(date.getTime()) ? null : this.toDateKey(date);
  }

  private toDateKey(date: Date) {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private getCurrentMonthLabel() {
    const now = new Date();
    return `${now.getFullYear()}年${now.getMonth() + 1}月`;
  }

  private buildEnvelope<TData>(data: TData) {
    return {
      code: 0,
      message: 'ok',
      data,
      timestamp: new Date().toISOString(),
    };
  }

  private formatDate(value: string | Date | null | undefined) {
    if (!value) {
      return null;
    }

    const date = value instanceof Date ? value : new Date(value);

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private normalizeUserPreferences(input: Record<string, unknown> | null | undefined) {
    return {
      ...USER_PREFERENCE_DEFAULTS,
      ...(input || {}),
      manualThemeKey:
        typeof input?.manualThemeKey === 'string' ? input.manualThemeKey : '',
      themeMode: input?.themeMode === 'manual' ? 'manual' : 'auto',
      dailyReminderEnabled:
        typeof input?.dailyReminderEnabled === 'boolean'
          ? input.dailyReminderEnabled
          : USER_PREFERENCE_DEFAULTS.dailyReminderEnabled,
      luckyPushEnabled:
        typeof input?.luckyPushEnabled === 'boolean'
          ? input.luckyPushEnabled
          : USER_PREFERENCE_DEFAULTS.luckyPushEnabled,
      quietModeEnabled:
        typeof input?.quietModeEnabled === 'boolean'
          ? input.quietModeEnabled
          : USER_PREFERENCE_DEFAULTS.quietModeEnabled,
      saveHistoryCardsEnabled:
        typeof input?.saveHistoryCardsEnabled === 'boolean'
          ? input.saveHistoryCardsEnabled
          : USER_PREFERENCE_DEFAULTS.saveHistoryCardsEnabled,
    };
  }

  private pickDefinedPreferencePatch(dto: UpdatePreferencesDto) {
    return Object.fromEntries(
      Object.entries({
        dailyReminderEnabled: dto.dailyReminderEnabled,
        luckyPushEnabled: dto.luckyPushEnabled,
        quietModeEnabled: dto.quietModeEnabled,
        saveHistoryCardsEnabled: dto.saveHistoryCardsEnabled,
        themeMode: dto.themeMode,
        manualThemeKey: dto.manualThemeKey,
      }).filter(([, value]) => value !== undefined),
    );
  }

  private normalizeMeditationCategory(category?: string | null) {
    const value = category?.trim();

    if (!value) {
      return 'meditation';
    }

    const matchedEntry = Object.entries(MEDITATION_CATEGORY_META).find(
      ([code, meta]) => code === value || meta.label === value,
    );

    return matchedEntry?.[0] ?? value;
  }

  private resolveMeditationCategoryMeta(category: string) {
    return (
      MEDITATION_CATEGORY_META[category] ?? {
        label: category || '冥想练习',
        defaultTitle: '冥想练习',
        summary: '适合按自己的节奏完成一次安静练习。',
      }
    );
  }

  private normalizeMeditationMusicItem(input: unknown, index: number) {
    if (!input || typeof input !== 'object') {
      return null;
    }

    const item = input as Record<string, unknown>;
    const enabled = item.enabled !== false;

    if (!enabled) {
      return null;
    }

    const id =
      typeof item.id === 'string' && item.id.trim()
        ? item.id.trim()
        : `music-${index + 1}`;
    const title =
      typeof item.title === 'string' && item.title.trim()
        ? item.title.trim()
        : null;

    if (!title) {
      return null;
    }

    const category = this.normalizeMeditationCategory(
      typeof item.category === 'string' && item.category.trim()
        ? item.category.trim()
        : 'healing',
    );
    const categoryMeta = this.resolveMeditationCategoryMeta(category);

    return {
      id,
      title,
      subtitle:
        typeof item.subtitle === 'string' && item.subtitle.trim()
          ? item.subtitle.trim()
          : '冥想音乐',
      category,
      categoryLabel:
        typeof item.categoryLabel === 'string' && item.categoryLabel.trim()
          ? item.categoryLabel.trim()
          : categoryMeta.label,
      durationMinutes: Math.max(
        1,
        Math.min(180, Number(item.durationMinutes) || 5),
      ),
      atmosphere:
        typeof item.atmosphere === 'string' && item.atmosphere.trim()
          ? item.atmosphere.trim()
          : '轻环境音',
      scene:
        typeof item.scene === 'string' && item.scene.trim()
          ? item.scene.trim()
          : categoryMeta.summary,
      guide: Array.isArray(item.guide)
        ? item.guide
            .filter((step): step is string => typeof step === 'string' && Boolean(step.trim()))
            .slice(0, 4)
            .map((step) => step.trim())
        : [],
      tags: Array.isArray(item.tags)
        ? item.tags
            .filter((tag): tag is string => typeof tag === 'string' && Boolean(tag.trim()))
            .slice(0, 4)
            .map((tag) => tag.trim())
        : [],
      previewUrl:
        typeof item.previewUrl === 'string' && item.previewUrl.trim()
          ? normalizeFileServiceUrlToApiProxy(item.previewUrl.trim(), {
              internalBaseUrl: this.configService.get<string>(
                'FILE_SERVICE_BASE_URL',
                'http://8.152.214.57:3000/api',
              ),
              publicApiBaseUrl: this.configService.get<string>('PUBLIC_API_BASE_URL'),
            })
          : '',
    };
  }
}
