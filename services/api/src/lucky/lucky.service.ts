import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { FortuneContentEntity } from '../database/entities/fortune-content.entity';
import { UserEntity } from '../database/entities/user.entity';
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

@Injectable()
export class LuckyService {
  constructor(
    @InjectRepository(FortuneContentEntity)
    private readonly fortuneContentRepository: Repository<FortuneContentEntity>,
  ) {}

  async getToday(user: UserEntity | null) {
    await this.ensureSeedData();

    const sign = await this.resolveTodaySign();
    const recommendations = await this.resolveRecommendations(user);
    const dominantElement = this.resolveDominantElement(user);
    const todayLuckyScore = this.buildTodayLuckyScore(user, dominantElement);
    const annualLuckyScore = this.buildAnnualLuckyScore(user, dominantElement);
    const signContent = this.readSignContent(sign);

    return this.buildEnvelope({
      profile: {
        personalized: Boolean(user),
        nickname: user?.nickname ?? null,
        zodiac: user?.zodiac ?? null,
        dominantElement,
        guidance: user
          ? `今天的推荐优先参考了你的${dominantElement}能量和${user?.zodiac ?? '当前'}节奏。`
          : '登录并完善生日资料后，会结合你的星座和五行做更个性化的推荐。',
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
      wallpaperThemes: recommendations.slice(0, 2).map((item, index) => ({
        id: `${item.bizCode}-wallpaper`,
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

    return {
      bizCode: sign.bizCode,
      title: sign.title,
      summary: sign.summary ?? '把节奏放慢一点，今天更适合温柔但清晰的推进。',
      tag: content.tag ?? '今日吉签',
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

    return this.buildEnvelope({
      profile: {
        personalized: Boolean(user),
        zodiac: user?.zodiac ?? null,
        dominantElement: this.resolveDominantElement(user),
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
      },
    });
  }

  private async ensureSeedData() {
    await this.ensureContentSeeds(LUCKY_SIGN_SEEDS);
    await this.ensureContentSeeds(LUCKY_ITEM_SEEDS);
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

  private async resolveRecommendations(user: UserEntity | null) {
    const items = await this.fortuneContentRepository.find({
      where: {
        contentType: 'lucky_item',
        status: 'published',
      },
      order: {
        id: 'ASC',
      },
    });

    const dominantElement = this.resolveDominantElement(user);
    const zodiac = user?.zodiac ?? null;
    const seed = this.buildDateSeed();

    return items
      .map((item, index) => {
        const content = this.readItemContent(item);
        let fitScore = 70 + ((seed + index * 7) % 10);

        if (content.elements?.includes(dominantElement)) {
          fitScore += 12;
        }

        if (zodiac && content.zodiacs?.includes(zodiac)) {
          fitScore += 9;
        }

        fitScore = Math.min(98, fitScore);

        return {
          bizCode: item.bizCode,
          title: item.title,
          summary: item.summary ?? '今天适合把它放在你容易看见的位置。',
          category: content.category ?? '幸运物',
          fitScore,
          highlight: content.recommendationReason ?? '今天它会帮你把节奏稳下来。',
          useMoment: content.useMoment ?? '今天需要一点秩序和温柔的时候',
          styleHint: content.styleHint ?? '尽量选更轻盈、干净的配色。',
          palette: content.palette ?? ['#e8eef7', '#ffffff', '#aac0d9'],
          wallpaperPrompt:
            content.wallpaperPrompt ??
            'clean apple style still life, soft light, airy product composition',
        };
      })
      .sort((left, right) => right.fitScore - left.fitScore)
      .slice(0, 3);
  }

  private resolveDominantElement(user: UserEntity | null) {
    const fiveElements = user?.fiveElements;

    if (fiveElements && Object.keys(fiveElements).length) {
      return (
        Object.entries(fiveElements).sort((left, right) => right[1] - left[1])[0]?.[0] ?? '木'
      );
    }

    const fallbackElements = ['木', '火', '土', '金', '水'] as const;
    return fallbackElements[this.buildDateSeed() % fallbackElements.length];
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

  private readSignContent(content: FortuneContentEntity) {
    return (content.contentJson ?? {}) as LuckySignContent;
  }

  private readItemContent(content: FortuneContentEntity) {
    return (content.contentJson ?? {}) as LuckyItemContent;
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
