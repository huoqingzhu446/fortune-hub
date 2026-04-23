import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserEntity } from '../database/entities/user.entity';
import { LuckyService } from '../lucky/lucky.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class HomeService {
  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly luckyService: LuckyService,
  ) {}

  async getHomeIndex(user: UserEntity | null) {
    const luckySign = await this.luckyService.getTodaySignSnapshot();
    const luckyToday = await this.luckyService.getToday(user);
    const luckyData = luckyToday.data;
    const integrations = this.buildIntegrations();
    const featureEntries = [
      {
        id: 'zodiac',
        title: '星座运势',
        description: '查看今日、本周、年度运势与幸运提示。',
        route: '/pages/zodiac/index',
        badge: '主入口',
      },
      {
        id: 'bazi',
        title: '八字解读',
        description: '录入生日与时辰，生成简易排盘与五行解读。',
        route: '/pages/bazi/index',
        badge: '待完善',
      },
      {
        id: 'personality',
        title: '性格测评',
        description: '完成答题后生成精简报告与分享卡片。',
        route: '/pages/personality/index',
        badge: '长期留存',
      },
      {
        id: 'emotion',
        title: '情绪自检',
        description: '简化量表 + 风险提示 + 放松建议。',
        route: '/pages/emotion/index',
        badge: '合规重点',
      },
      {
        id: 'lucky-item',
        title: '幸运物',
        description: '结合幸运指数推荐每日幸运物、壁纸和今日分享图。',
        route: '/pages/lucky/index',
        badge: '内容化',
      },
    ];
    const isLoggedIn = Boolean(user);
    const profileCompleted = Boolean(user?.birthday && user?.zodiac);
    const isVipActive =
      user?.vipStatus === 'active' &&
      user.vipExpiredAt instanceof Date &&
      user.vipExpiredAt.getTime() > Date.now();
    const quickEntries = [
      {
        id: 'profile',
        title: isLoggedIn ? '完善资料' : '先去登录',
        description: isLoggedIn
          ? profileCompleted
            ? '资料已就绪，随时可以回来调整生日、时辰和昵称。'
            : '先补齐生日和出生时间，首页推荐会更准确。'
          : '从个人中心发起微信登录，后续历史和会员都会绑定到账号。',
        route: '/pages/profile/index',
        badge: isLoggedIn ? (profileCompleted ? '已登录' : '待完善') : '立即开始',
      },
      {
        id: 'records',
        title: '查看历史',
        description: '把八字、性格和情绪结果集中回看，避免每次重新找入口。',
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
        description: isLoggedIn ? '当前账号已连接，可以继续沉淀历史和会员权益。' : '先从个人中心发起登录，避免结果只停留在当前设备。',
        completed: isLoggedIn,
      },
      {
        id: 'profile',
        title: '完善资料',
        description: profileCompleted
          ? `当前会结合${user?.zodiac ?? '你的资料'}和五行信息，给出更贴近你的推荐。`
          : '补齐生日、出生时间和性别后，星座、简易八字和幸运推荐都会同步变得更完整。',
        completed: profileCompleted,
      },
      {
        id: 'lucky',
        title: '进入今日闭环',
        description: isLoggedIn
          ? '现在可以从幸运签、幸运物和历史记录之间顺畅切换。'
          : '登录后会更方便把幸运物、结果页和历史记录串起来。',
        completed: isLoggedIn && profileCompleted,
      },
    ];
    const headline = this.buildHeadline(user, profileCompleted, isVipActive);
    const userSummary = this.buildUserSummary(user, profileCompleted, isVipActive);

    return {
      code: 0,
      message: 'ok',
      data: {
        headline,
        todayLuckyScore: luckyData.scores.today,
        annualLuckyScore: luckyData.scores.annual,
        todayLuckySign: luckySign,
        todayFortuneSummary: luckyData.profile.guidance,
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
            label: '今日幸运签',
            value: luckySign.tag,
            hint: luckySign.title,
          },
          {
            label: '功能入口',
            value: String(featureEntries.length),
            hint: '星座、八字、测评、情绪、幸运物将逐步完善。',
          },
        ],
        modules: featureEntries,
        integrations,
        userSummary,
      },
      timestamp: new Date().toISOString(),
    };
  }

  private buildHeadline(
    user: UserEntity | null,
    profileCompleted: boolean,
    isVipActive: boolean,
  ) {
    if (!user) {
      return {
        title: '先登录，再把今天的闭环跑顺',
        subtitle:
          '从首页进入核心功能没有问题，接下来只差把微信登录、资料完善和历史沉淀真正串起来。',
      };
    }

    if (!profileCompleted) {
      return {
        title: `${user.nickname || '欢迎回来'}，还差一步就更完整了`,
        subtitle:
          '先补齐生日与出生时间，首页、幸运物和结果页会开始给你更稳定的个性化内容。',
      };
    }

    if (isVipActive) {
      return {
        title: `${user.nickname || '欢迎回来'}，今天已经可以直接进入完整版闭环`,
        subtitle:
          '资料、幸运体系、历史和会员权益都已经就位，可以从首页继续往下看今天的重点内容。',
      };
    }

    return {
      title: `${user.nickname || '欢迎回来'}，今天的首页已经准备好了`,
      subtitle:
        '资料已完善，可以顺着幸运签、幸运物、测评和历史记录一路往下看，不需要再回头补入口。',
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
          ? '查看今日幸运物'
          : '先完善资料'
        : '去个人中心登录',
      primaryActionRoute: user
        ? profileCompleted
          ? '/pages/lucky/index'
          : '/pages/profile/index'
        : '/pages/profile/index',
      secondaryActionTitle: user ? '查看历史记录' : '看看设置与说明',
      secondaryActionRoute: user ? '/pages/records/index' : '/pages/settings/index',
      welcomeNote: !user
        ? '登录后会把历史、幸运推荐和会员状态都绑定到当前账号。'
        : profileCompleted
          ? '你的首页已经切到个性化模式，幸运推荐会优先参考资料和最近结果。'
          : '资料补齐后，首页和幸运体系会更贴近你的节奏。',
    };
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
