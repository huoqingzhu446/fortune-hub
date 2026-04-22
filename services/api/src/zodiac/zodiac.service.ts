import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { FortuneContentEntity } from '../database/entities/fortune-content.entity';
import {
  ZODIAC_ELEMENT_LABELS,
  ZODIAC_KEY_MONTHS,
  ZODIAC_LUCKY_STYLES,
  ZODIAC_MODALITY_LABELS,
  ZODIAC_PROFILES,
  ZODIAC_QUARTER_TEMPLATES,
  ZODIAC_SIGNS,
  ZODIAC_WEEKLY_RHYTHM,
  ZODIAC_YEARLY_FOCUS,
  isKnownZodiacSign,
  type ZodiacElement,
  type ZodiacSign,
} from './zodiac.constants';

type TimelineItem = {
  label: string;
  summary: string;
};

type QuarterForecast = {
  quarter: string;
  title: string;
  summary: string;
};

@Injectable()
export class ZodiacService {
  constructor(
    @InjectRepository(FortuneContentEntity)
    private readonly fortuneContentRepository: Repository<FortuneContentEntity>,
  ) {}

  async getDailyFortune(zodiac?: string) {
    const sign = this.normalizeSign(zodiac);
    const today = this.getToday();
    const content = await this.findContent('zodiac_daily', [sign]);
    const base = ZODIAC_LUCKY_STYLES[sign];
    const contentJson = content?.contentJson ?? {};

    return this.buildEnvelope({
      zodiac: sign,
      date: today,
      profile: this.buildProfileSnippet(sign),
      summary: this.pickString(contentJson.summary, content?.summary || base.summary),
      metrics: {
        love: this.pickString(contentJson.love, base.love),
        career: this.pickString(contentJson.career, base.career),
        wealth: this.pickString(contentJson.wealth, base.wealth),
        health: this.pickString(contentJson.health, base.health),
      },
      lucky: {
        color: this.pickString(contentJson.color, base.color),
        number: this.pickString(contentJson.number, base.number),
        direction: this.pickString(contentJson.direction, base.direction),
      },
      compatibility: {
        bestMatch: this.pickString(contentJson.bestMatch, base.partner),
        message: this.pickString(
          contentJson.compatibilityMessage,
          `今天与${base.partner}的沟通更容易找到默契，适合轻松交流。`,
        ),
      },
      knowledge: this.pickString(contentJson.knowledge, base.knowledge),
      suggestion: this.pickString(
        contentJson.suggestion,
        `今天可以围绕“${ZODIAC_PROFILES[sign].keywords[0]}”做一个小而明确的决定，节奏会更顺。`,
      ),
    });
  }

  async getWeeklyFortune(zodiac?: string) {
    const sign = this.normalizeSign(zodiac);
    const profile = ZODIAC_PROFILES[sign];
    const content = await this.findContent('zodiac_weekly', [sign]);
    const contentJson = content?.contentJson ?? {};

    return this.buildEnvelope({
      zodiac: sign,
      weekRange: this.getWeekRange(),
      profile: this.buildProfileSnippet(sign),
      theme: this.pickString(contentJson.theme, profile.weeklyTheme),
      overview: this.pickString(
        contentJson.overview,
        `${profile.knowledge} 这一周更适合把“${profile.keywords[0]}”变成真正可执行的安排。`,
      ),
      rhythm: this.pickTimeline(contentJson.rhythm, ZODIAC_WEEKLY_RHYTHM[profile.element]),
      focus: {
        love: this.pickString(
          contentJson.love,
          `关系里，${profile.relationshipStyle}`,
        ),
        career: this.pickString(
          contentJson.career,
          `工作与学习方面，${profile.workStyle}`,
        ),
        wealth: this.pickString(
          contentJson.wealth,
          `财务上先把资源投向能强化“${profile.keywords[0]}”与长期价值的方向。`,
        ),
        health: this.pickString(
          contentJson.health,
          `身体与情绪节奏上，${profile.growthTip}`,
        ),
      },
      luckyWindow: this.pickString(
        contentJson.luckyWindow,
        this.buildLuckyWindow(profile.element),
      ),
      bestMatch: this.pickString(contentJson.bestMatch, profile.bestMatches[0]),
      action: this.pickString(contentJson.action, profile.weeklyAction),
      caution: this.pickString(
        contentJson.caution,
        `别让“${profile.keywords[1]}”带着你一路往前冲，周中安排一次复盘会更稳。`,
      ),
    });
  }

  async getYearlyFortune(zodiac?: string, year?: number) {
    const sign = this.normalizeSign(zodiac);
    const targetYear = year && year >= 2024 ? year : new Date().getFullYear();
    const profile = ZODIAC_PROFILES[sign];
    const content = await this.findContent('zodiac_yearly', [sign, `${sign}:${targetYear}`]);
    const contentJson = content?.contentJson ?? {};
    const yearlyFocus = ZODIAC_YEARLY_FOCUS[profile.element];

    return this.buildEnvelope({
      zodiac: sign,
      year: targetYear,
      profile: this.buildProfileSnippet(sign),
      theme: {
        title: this.pickString(contentJson.themeTitle, profile.yearlyTheme),
        summary: this.pickString(
          contentJson.themeSummary,
          `${profile.yearlyAdvice} 这一年适合围绕“${profile.keywords.join(' / ')}”持续打磨。`,
        ),
      },
      quarterForecasts: this.pickQuarterForecasts(
        contentJson.quarterForecasts,
        ZODIAC_QUARTER_TEMPLATES[profile.modality],
      ),
      focus: {
        relationship: this.pickString(contentJson.relationship, yearlyFocus.relationship),
        career: this.pickString(contentJson.career, yearlyFocus.career),
        money: this.pickString(contentJson.money, yearlyFocus.money),
        wellbeing: this.pickString(contentJson.wellbeing, yearlyFocus.wellbeing),
      },
      keyMonths: this.pickStringArray(contentJson.keyMonths, ZODIAC_KEY_MONTHS[profile.element]),
      anchorAdvice: this.pickString(contentJson.anchorAdvice, profile.yearlyAdvice),
    });
  }

  async getCompatibility(zodiac?: string, partner?: string) {
    const sign = this.normalizeSign(zodiac);
    const basePartner = this.normalizePartner(sign, partner);
    const content = await this.findContent(
      'zodiac_compatibility',
      this.buildCompatibilityBizCodes(sign, basePartner),
    );
    const contentJson = content?.contentJson ?? {};
    const currentPartner = this.normalizePartner(
      sign,
      this.pickString(contentJson.partner, basePartner),
    );
    const profile = ZODIAC_PROFILES[sign];
    const partnerProfile = ZODIAC_PROFILES[currentPartner];
    const { score, level } = this.calculateCompatibility(sign, currentPartner);

    return this.buildEnvelope({
      zodiac: sign,
      partner: currentPartner,
      score: this.pickNumber(contentJson.score, score),
      level: this.pickString(contentJson.level, level),
      summary: this.pickString(
        contentJson.summary,
        this.buildCompatibilitySummary(sign, currentPartner, score),
      ),
      chemistry: {
        emotion: this.pickString(
          contentJson.emotion,
          this.describeEmotionChemistry(profile.element, partnerProfile.element),
        ),
        communication: this.pickString(
          contentJson.communication,
          this.describeCommunicationChemistry(profile.modality, partnerProfile.modality),
        ),
        growth: this.pickString(
          contentJson.growth,
          `这组组合最适合在“${profile.keywords[0]}”与“${partnerProfile.keywords[0]}”之间找到互补。`,
        ),
      },
      highlights: this.pickStringArray(contentJson.highlights, [
        `${sign}的${profile.strengths[0]}会让关系有明确的起势感。`,
        `${currentPartner}的${partnerProfile.strengths[0]}会让互动更容易落到实处。`,
        `${this.describeElementPair(profile.element, partnerProfile.element)}让你们更容易在交流里碰出亮点。`,
      ]),
      caution: this.pickString(
        contentJson.caution,
        this.buildCompatibilityCaution(sign, currentPartner),
      ),
      tips: this.pickStringArray(contentJson.tips, [
        '先对齐节奏期待，再决定一起推进什么。',
        '把最重要的话题留在状态平稳的时候说，会更容易被听见。',
        '给彼此留一点独处和缓冲空间，关系反而更舒服。',
      ]),
    });
  }

  async getKnowledge(zodiac?: string) {
    const sign = this.normalizeSign(zodiac);
    const profile = ZODIAC_PROFILES[sign];
    const content = await this.findContent('zodiac_knowledge', [sign]);
    const contentJson = content?.contentJson ?? {};

    return this.buildEnvelope({
      zodiac: sign,
      title: this.pickString(contentJson.title, `${sign}性格速写`),
      overview: this.pickString(contentJson.overview, profile.knowledge),
      quickFacts: this.pickFacts(contentJson.quickFacts, [
        { label: '元素', value: ZODIAC_ELEMENT_LABELS[profile.element] },
        { label: '模式', value: ZODIAC_MODALITY_LABELS[profile.modality] },
        { label: '季节', value: profile.season },
      ]),
      strengths: this.pickStringArray(contentJson.strengths, profile.strengths),
      relationshipStyle: this.pickString(contentJson.relationshipStyle, profile.relationshipStyle),
      workStyle: this.pickString(contentJson.workStyle, profile.workStyle),
      growthTip: this.pickString(contentJson.growthTip, profile.growthTip),
      keywords: this.pickStringArray(contentJson.keywords, profile.keywords),
    });
  }

  getSigns() {
    return [...ZODIAC_SIGNS];
  }

  private buildEnvelope<TData>(data: TData) {
    return {
      code: 0,
      message: 'ok',
      data,
      timestamp: new Date().toISOString(),
    };
  }

  private buildProfileSnippet(zodiac: ZodiacSign) {
    const profile = ZODIAC_PROFILES[zodiac];
    return {
      element: ZODIAC_ELEMENT_LABELS[profile.element],
      modality: ZODIAC_MODALITY_LABELS[profile.modality],
      keywords: [...profile.keywords],
    };
  }

  private normalizeSign(sign?: string): ZodiacSign {
    return sign && isKnownZodiacSign(sign) ? sign : '狮子座';
  }

  private normalizePartner(zodiac: ZodiacSign, partner?: string): ZodiacSign {
    if (partner && isKnownZodiacSign(partner)) {
      return partner;
    }

    return ZODIAC_LUCKY_STYLES[zodiac].partner;
  }

  private async findContent(contentType: string, bizCodes: string[]) {
    const today = this.getToday();
    const uniqueBizCodes = Array.from(new Set(bizCodes));
    const records = await this.fortuneContentRepository.find({
      where: uniqueBizCodes.flatMap((bizCode) => [
        {
          contentType,
          bizCode,
          status: 'published',
          publishDate: today,
        },
        {
          contentType,
          bizCode,
          status: 'published',
          publishDate: IsNull(),
        },
      ]),
      order: {
        publishDate: 'DESC',
        id: 'DESC',
      },
      take: 1,
    });

    return records[0] ?? null;
  }

  private getToday() {
    return new Date().toISOString().slice(0, 10);
  }

  private getWeekRange() {
    const now = new Date();
    const day = now.getDay();
    const monday = new Date(now);
    const sunday = new Date(now);
    const diffToMonday = (day + 6) % 7;
    monday.setDate(now.getDate() - diffToMonday);
    sunday.setDate(monday.getDate() + 6);

    return `${this.formatMonthDay(monday)} - ${this.formatMonthDay(sunday)}`;
  }

  private formatMonthDay(date: Date) {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${month}.${day}`;
  }

  private buildLuckyWindow(element: ZodiacElement) {
    const mapping: Record<ZodiacElement, string> = {
      fire: '周二至周四上午',
      earth: '周三至周五傍晚',
      air: '周二至周四晚间',
      water: '周一夜间至周三午后',
    };

    return mapping[element];
  }

  private buildCompatibilityBizCodes(zodiac: ZodiacSign, partner: ZodiacSign) {
    return [
      `${zodiac}:${partner}`,
      `${partner}:${zodiac}`,
      `${zodiac}-${partner}`,
      `${partner}-${zodiac}`,
    ];
  }

  private calculateCompatibility(zodiac: ZodiacSign, partner: ZodiacSign) {
    const profile = ZODIAC_PROFILES[zodiac];
    const partnerProfile = ZODIAC_PROFILES[partner];
    const sameElement = profile.element === partnerProfile.element;
    const complementary = this.isComplementaryElement(profile.element, partnerProfile.element);
    const sameModality = profile.modality === partnerProfile.modality;
    const mutualBestMatch =
      profile.bestMatches.includes(partner) || partnerProfile.bestMatches.includes(zodiac);

    let score = 68;
    score += sameElement ? 12 : 0;
    score += complementary ? 8 : 0;
    score += mutualBestMatch ? 6 : 0;
    score += sameModality ? (zodiac === partner ? 8 : 2) : 0;
    score += zodiac === partner ? 5 : 0;
    score -= !sameElement && !complementary ? 4 : 0;

    const limitedScore = Math.max(58, Math.min(96, score));
    let level = '需要经营';

    if (limitedScore >= 88) {
      level = '高默契';
    } else if (limitedScore >= 78) {
      level = '顺畅互补';
    } else if (limitedScore >= 68) {
      level = '可持续磨合';
    }

    return {
      score: limitedScore,
      level,
    };
  }

  private isComplementaryElement(left: ZodiacElement, right: ZodiacElement) {
    return (
      (left === 'fire' && right === 'air') ||
      (left === 'air' && right === 'fire') ||
      (left === 'earth' && right === 'water') ||
      (left === 'water' && right === 'earth')
    );
  }

  private buildCompatibilitySummary(zodiac: ZodiacSign, partner: ZodiacSign, score: number) {
    if (score >= 88) {
      return `${zodiac}和${partner}的节奏很容易一拍即合，既有吸引力，也有把事情推进下去的默契。`;
    }

    if (score >= 78) {
      return `${zodiac}和${partner}属于顺畅互补型组合，彼此会在不同维度上提供支持。`;
    }

    if (score >= 68) {
      return `${zodiac}和${partner}需要一点时间找到相处节奏，但一旦对齐方式，关系会很稳。`;
    }

    return `${zodiac}和${partner}的差异会比较明显，越是把期待说清楚，越能避免无谓消耗。`;
  }

  private describeEmotionChemistry(left: ZodiacElement, right: ZodiacElement) {
    if (left === right) {
      return '情绪表达频率接近，容易快速理解对方当下的状态。';
    }

    if (this.isComplementaryElement(left, right)) {
      return '一方提供推动力，一方提供缓冲感，情绪互补度较高。';
    }

    return '情绪表达方式不同，需要更多确认和回应来建立安心感。';
  }

  private describeCommunicationChemistry(left: string, right: string) {
    if (left === right) {
      return '做决定的方式接近，沟通效率高，但偶尔也会在主导权上拉扯。';
    }

    return '你们在行动和回应上各有节奏，先对齐优先级会更顺。';
  }

  private describeElementPair(left: ZodiacElement, right: ZodiacElement) {
    if (left === right) {
      return '同元素的天然熟悉感';
    }

    if (this.isComplementaryElement(left, right)) {
      return '互补元素的推进与承接';
    }

    return '不同元素的视角碰撞';
  }

  private buildCompatibilityCaution(zodiac: ZodiacSign, partner: ZodiacSign) {
    if (zodiac === partner) {
      return '你们很容易看懂彼此，也可能同步放大情绪，记得留一点呼吸空间。';
    }

    const profile = ZODIAC_PROFILES[zodiac];
    const partnerProfile = ZODIAC_PROFILES[partner];

    if (profile.modality === partnerProfile.modality) {
      return '两个人都想按自己的方式推进时，容易在小决定上拉扯，先定规则会更省力。';
    }

    return '当一方想快一点、一方想稳一点时，先把期待和边界讲清楚会更舒服。';
  }

  private pickString(value: unknown, fallback: string) {
    return typeof value === 'string' && value ? value : fallback;
  }

  private pickNumber(value: unknown, fallback: number) {
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  }

  private pickStringArray(value: unknown, fallback: string[]) {
    if (!Array.isArray(value)) {
      return fallback;
    }

    const nextValue = value
      .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      .map((item) => item.trim());

    return nextValue.length ? nextValue : fallback;
  }

  private pickTimeline(value: unknown, fallback: TimelineItem[]) {
    if (!Array.isArray(value)) {
      return fallback;
    }

    const nextValue = value
      .map((item) => {
        if (!item || typeof item !== 'object') {
          return null;
        }

        const candidate = item as Record<string, unknown>;
        const label = this.pickString(candidate.label, '');
        const summary = this.pickString(candidate.summary, '');

        if (!label || !summary) {
          return null;
        }

        return { label, summary };
      })
      .filter((item): item is TimelineItem => Boolean(item));

    return nextValue.length ? nextValue : fallback;
  }

  private pickQuarterForecasts(value: unknown, fallback: QuarterForecast[]) {
    if (!Array.isArray(value)) {
      return fallback;
    }

    const nextValue = value
      .map((item) => {
        if (!item || typeof item !== 'object') {
          return null;
        }

        const candidate = item as Record<string, unknown>;
        const quarter = this.pickString(candidate.quarter, '');
        const title = this.pickString(candidate.title, '');
        const summary = this.pickString(candidate.summary, '');

        if (!quarter || !title || !summary) {
          return null;
        }

        return { quarter, title, summary };
      })
      .filter((item): item is QuarterForecast => Boolean(item));

    return nextValue.length ? nextValue : fallback;
  }

  private pickFacts(
    value: unknown,
    fallback: Array<{ label: string; value: string }>,
  ) {
    if (!Array.isArray(value)) {
      return fallback;
    }

    const nextValue = value
      .map((item) => {
        if (!item || typeof item !== 'object') {
          return null;
        }

        const candidate = item as Record<string, unknown>;
        const label = this.pickString(candidate.label, '');
        const factValue = this.pickString(candidate.value, '');

        if (!label || !factValue) {
          return null;
        }

        return {
          label,
          value: factValue,
        };
      })
      .filter((item): item is { label: string; value: string } => Boolean(item));

    return nextValue.length ? nextValue : fallback;
  }
}
