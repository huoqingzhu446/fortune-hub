import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { FortuneContentEntity } from '../database/entities/fortune-content.entity';
import { RedisService } from '../redis/redis.service';

type LuckySignSnapshot = {
  title: string;
  summary: string;
  tag: string;
};

@Injectable()
export class HomeService {
  constructor(
    @InjectRepository(FortuneContentEntity)
    private readonly fortuneContentRepository: Repository<FortuneContentEntity>,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  async getHomeIndex() {
    const luckySign = await this.getLuckySign();
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
        description: '结合幸运指数推荐每日幸运物与壁纸主题。',
        route: '/pages/lucky/index',
        badge: '内容化',
      },
    ];

    return {
      code: 0,
      message: 'ok',
      data: {
        headline: {
          title: '今天的好运正在刷新中',
          subtitle:
            '先完成生日信息与星座识别，再逐步解锁八字、测评、幸运物和分享海报。',
        },
        todayLuckyScore: {
          label: '今日幸运指数',
          value: '86',
          hint: '适合整理节奏、做出清晰的小决定。',
        },
        annualLuckyScore: {
          label: '年度幸运指数',
          value: '92',
          hint: '今年适合打磨长期计划与个人表达。',
        },
        todayLuckySign: luckySign,
        todayFortuneSummary:
          '运势整体平稳，适合先完成手头事务，再安排一次轻量社交或自我奖励。',
        featureEntries,
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
            label: '今日幸运指数',
            value: '86',
            hint: '推荐先完成一件最重要的小目标。',
          },
          {
            label: '年度幸运指数',
            value: '92',
            hint: '适合持续建设个人作品与表达。',
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
        userSummary: {
          profileCompleted: false,
          vipStatus: 'inactive',
        },
      },
      timestamp: new Date().toISOString(),
    };
  }

  private async getLuckySign(): Promise<LuckySignSnapshot> {
    const today = new Date().toISOString().slice(0, 10);
    const content = await this.fortuneContentRepository.findOne({
      where: [
        {
          contentType: 'lucky_sign',
          status: 'published',
          publishDate: today,
        },
        {
          contentType: 'lucky_sign',
          status: 'published',
          publishDate: IsNull(),
        },
      ],
      order: {
        publishDate: 'DESC',
        id: 'DESC',
      },
    });

    if (!content) {
      return {
        title: '今日幸运签',
        summary: '慢下来一点，答案会在下一次呼吸里浮现。',
        tag: '静观有得',
      };
    }

    return {
      title: content.title,
      summary: content.summary || '保持平衡，今天适合做柔和而坚定的决定。',
      tag:
        typeof content.contentJson.tag === 'string'
          ? content.contentJson.tag
          : '今日吉签',
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
