import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class FortuneService {
  constructor(
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
    private readonly redisService: RedisService,
  ) {}

  getMobileDashboard() {
    const apiBaseUrl = `http://8.152.214.57:${this.configService.get<number>('PORT', 3001)}/api/v1`;
    const fileServiceBaseUrl = this.configService.get<string>(
      'FILE_SERVICE_BASE_URL',
      'http://8.152.214.57:3000/api',
    );

    return {
      headline: {
        title: '今日状态平稳，适合上线首版',
        subtitle:
          '星座、性格、情绪筛查和幸运指数都可以先按规则引擎落地，八字模块单独补精算服务。',
      },
      stats: [
        {
          label: '今日幸运指数',
          value: '86',
          hint: '推荐先做日更内容与分享卡片',
        },
        {
          label: '年度幸运指数',
          value: '91',
          hint: '适合配年度报告与会员权益',
        },
        {
          label: '测评引擎',
          value: '规则驱动',
          hint: '评分和文案先做成可配置',
        },
        {
          label: '文件服务',
          value: '独立接入',
          hint: '统一上传头像、海报和分享素材',
        },
      ],
      modules: [
        {
          id: 'zodiac',
          title: '星座测评',
          description: '星座画像、今日运势、幸运物推荐',
          route: '/pages/zodiac/index',
          badge: '基础引流',
        },
        {
          id: 'personality',
          title: '性格分析',
          description: '量表题库、维度评分、会员报告',
          route: '/pages/personality/index',
          badge: '长期留存',
        },
        {
          id: 'emotion',
          title: '情绪状态筛查',
          description: '标准量表 + 风险提示 + 咨询引导',
          route: '/pages/emotion/index',
          badge: '合规重点',
        },
      ],
      integrations: {
        apiBaseUrl,
        fileServiceBaseUrl,
        redisStatus: this.redisService.getStatus(),
      },
    };
  }

  getAdminDashboard() {
    return {
      headline: {
        title: '后台模块已经铺开，可以开始接题库和内容配置',
        subtitle:
          '后台优先做题库、结果文案和幸运物内容库，后面再接用户报告、埋点和运营报表。',
      },
      stats: [
        {
          label: '小程序端',
          value: 'uni-app',
          hint: 'Vue 3 + Vite + Pinia',
        },
        {
          label: 'API',
          value: 'NestJS',
          hint: 'MySQL + Redis',
        },
        {
          label: '文件服务',
          value: '独立接入',
          hint: '复用外部上传中心',
        },
        {
          label: '部署方式',
          value: 'Compose',
          hint: 'Nginx + HTTPS',
        },
      ],
      modules: [
        {
          id: 'question-bank',
          title: '题库管理',
          owner: '运营后台',
          status: '待接入',
          summary: '星座、性格、情绪筛查都从这里配置题目和结果维度。',
        },
        {
          id: 'fortune-content',
          title: '运势内容中心',
          owner: '内容编辑',
          status: '待接入',
          summary: '今日幸运指数、年度幸运物、星座日签都在这里维护。',
        },
        {
          id: 'user-report',
          title: '报告中心',
          owner: '数据服务',
          status: '待接入',
          summary: '结果页模板、会员报告和分享海报统一在这里出图和追踪。',
        },
      ],
      integrations: {
        mysqlStatus: this.dataSource.isInitialized ? 'UP' : 'DOWN',
        redisStatus: this.redisService.getStatus(),
        fileServiceBaseUrl: this.configService.get<string>(
          'FILE_SERVICE_BASE_URL',
          'http://8.152.214.57:3000/api',
        ),
      },
    };
  }
}
