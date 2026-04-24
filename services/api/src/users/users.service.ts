import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { OrderEntity } from '../database/entities/order.entity';
import { ShareRecordEntity } from '../database/entities/share-record.entity';
import { UserRecordEntity } from '../database/entities/user-record.entity';
import { UserEntity } from '../database/entities/user.entity';
import { MembershipService } from '../membership/membership.service';
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

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(UserRecordEntity)
    private readonly userRecordRepository: Repository<UserRecordEntity>,
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
    @InjectRepository(ShareRecordEntity)
    private readonly shareRecordRepository: Repository<ShareRecordEntity>,
    private readonly authService: AuthService,
    private readonly membershipService: MembershipService,
  ) {}

  getCurrentProfile(user: UserEntity) {
    return this.buildEnvelope({
      user: this.authService.serializeUser(user),
      isProfileCompleted: Boolean(user.birthday && user.zodiac),
    });
  }

  async getProfilePage(user: UserEntity | null) {
    const serializedUser = user ? this.authService.serializeUser(user) : null;
    const isLoggedIn = Boolean(user);
    const isProfileCompleted = Boolean(user?.birthday && user?.zodiac);
    const isVipActive = this.membershipService.isVipActive(user);
    const recentHistory = user ? await this.loadUnifiedHistoryItems(user, 3) : [];
    const latestScore = recentHistory.find((item) => item.score !== null)?.score ?? null;
    const [totalRecords, emotionCount, orderCount, paidOrderCount, savedPosterCount] = user
      ? await Promise.all([
          this.userRecordRepository.count({
            where: { userId: user.id },
          }),
          this.userRecordRepository.count({
            where: { userId: user.id, recordType: 'emotion' },
          }),
          this.orderRepository.count({
            where: { userId: user.id },
          }),
          this.orderRepository.count({
            where: { userId: user.id, status: 'paid' },
          }),
          this.shareRecordRepository.count({
            where: { userId: user.id },
          }),
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
          value: isLoggedIn ? `${Math.max(0, emotionCount * 7) || 0}` : '--',
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
            ? `${Math.max(120, totalRecords * 20 + savedPosterCount * 10 + (isProfileCompleted ? 80 : 20))}`
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
        savedPosterCount,
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

  async getUnifiedHistory(user: UserEntity, limit?: number) {
    return this.buildEnvelope({
      items: await this.loadUnifiedHistoryItems(
        user,
        Math.min(30, Math.max(1, Number(limit) || 20)),
      ),
    });
  }

  async getRecordOverview(user: UserEntity | null) {
    const isLoggedIn = Boolean(user);
    const records = user
      ? await this.userRecordRepository.find({
          where: {
            userId: user.id,
          },
          order: {
            createdAt: 'DESC',
          },
          take: 24,
        })
      : [];
    const recentRecords =
      user && records.length
        ? records.map((record) =>
            this.serializeUnifiedHistoryItem(
              record,
              this.membershipService.isVipActive(user),
            ),
          )
        : [];
    const emotionRecords = records.filter((record) => record.recordType === 'emotion');
    const latestEmotionScore = this.resolveLatestEmotionScore(emotionRecords);
    const trendPoints = this.buildTrendPoints(emotionRecords);
    const hasEnoughTrendData =
      trendPoints.filter((point) => point.value !== null).length >= 3;
    const recordedDays = new Set(
      records
        .map((record) => this.resolveRecordDate(record))
        .filter((value): value is string => Boolean(value)),
    ).size;
    const overview = {
      recordedDays: isLoggedIn ? recordedDays : 0,
      emotionalStability: latestEmotionScore,
      healingProgress: isLoggedIn && latestEmotionScore > 0
        ? Math.max(62, Math.min(96, latestEmotionScore + 8))
        : 0,
      encouragement: isLoggedIn
        ? '你正在慢慢靠近更平和的自己'
        : '先建立第一条记录，变化会开始被看见',
      actionText: isLoggedIn ? '继续记录' : '去登录',
    };
    const monthKeywords = isLoggedIn
      ? latestEmotionScore >= 75
        ? '放松 · 接纳 · 修复'
        : latestEmotionScore >= 60
          ? '稳定 · 呼吸 · 调整'
          : '减压 · 休息 · 支持'
      : '放松 · 接纳 · 修复';

    return this.buildEnvelope({
      isLoggedIn,
      overview,
      calendar: {
        monthLabel: this.getCurrentMonthLabel(),
        weekdays: ['一', '二', '三', '四', '五', '六', '日'],
        days: this.buildCalendarDays(emotionRecords),
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
      recentRecords,
      growth: {
        continuousDays: this.calculateContinuousDays(records),
        monthKeywords,
      },
      favorites: this.buildFavoriteItems(),
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
      meditation: {
        label: '冥想足迹',
        route: '/pages/emotion/index',
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

  private resolveLatestEmotionScore(records: UserRecordEntity[]) {
    const latest = records.find((record) => record.score !== null);
    const parsed = latest?.score ? Number(latest.score) : NaN;

    return Number.isFinite(parsed) ? Math.round(parsed) : 0;
  }

  private buildCalendarDays(records: UserRecordEntity[]) {
    const scoreByDate = new Map<string, number>();

    for (const record of records) {
      const dateKey = this.resolveRecordDate(record);

      if (!dateKey || scoreByDate.has(dateKey)) {
        continue;
      }

      const parsed = record.score ? Number(record.score) : NaN;
      scoreByDate.set(dateKey, Number.isFinite(parsed) ? Math.round(parsed) : 68);
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
        moodType: this.resolveMoodType(score),
        hasRecord: scoreByDate.has(dateKey),
      };
    });
  }

  private buildTrendPoints(records: UserRecordEntity[]) {
    const scoreByDate = new Map<string, number>();

    for (const record of records) {
      const dateKey = this.resolveRecordDate(record);

      if (!dateKey || scoreByDate.has(dateKey)) {
        continue;
      }

      const parsed = record.score ? Number(record.score) : NaN;
      scoreByDate.set(dateKey, Number.isFinite(parsed) ? Math.round(parsed) : 68);
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

  private calculateContinuousDays(records: UserRecordEntity[]) {
    const dateSet = new Set(
      records
        .map((record) => this.resolveRecordDate(record))
        .filter((value): value is string => Boolean(value)),
    );

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

    return Math.max(count, records.length ? 1 : 0);
  }

  private buildProfileTools() {
    return [
      {
        title: '心情日记',
        description: '记录心情',
        icon: '记',
        route: '/pages/records/index',
      },
      {
        title: '冥想放松',
        description: '舒缓身心',
        icon: '静',
        route: '/pages/emotion/index',
      },
      {
        title: '睡眠助手',
        description: '晚间疗愈',
        icon: '眠',
        route: '/pages/emotion/index',
      },
      {
        title: '专注计时',
        description: '回到当下',
        icon: '时',
        route: '/pages/emotion/index',
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
    savedPosterCount: number;
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
        description: input.savedPosterCount
          ? `已保存 ${input.savedPosterCount} 张海报`
          : '暂无保存内容',
        icon: '藏',
        route: '/pages/lucky/index',
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
        route: '/pages/emotion/index',
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

  private resolveRecordDate(record: UserRecordEntity) {
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
}
