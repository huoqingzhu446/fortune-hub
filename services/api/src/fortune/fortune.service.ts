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
        title: '后台基础能力已成型，题库、内容和商业化都可继续运营化',
        subtitle:
          '当前已接入管理员登录、题库管理、内容中心、会员商品和广告配置，可继续细化发布流与审计能力。',
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
          label: '商业化',
          value: '已接入',
          hint: '会员商品 / 订单 / 激励广告',
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
          status: '已接入',
          summary: '性格测评与情绪自检已经可以通过后台配置题目、结果画像和分享海报文案。',
        },
        {
          id: 'fortune-content',
          title: '运势内容中心',
          owner: '内容编辑',
          status: '已接入',
          summary: '幸运签、幸运物和部分星座内容已经支持通过内容中心统一维护。',
        },
        {
          id: 'user-report',
          title: '报告中心',
          owner: '数据服务',
          status: '已接入',
          summary: '完整版报告、广告解锁、会员权益和分享海报已经形成最小闭环。',
        },
        {
          id: 'commerce-center',
          title: '商业化配置',
          owner: '增长运营',
          status: '已接入',
          summary: '会员商品、广告位开关和奖励策略已经支持后台查看与编辑。',
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
