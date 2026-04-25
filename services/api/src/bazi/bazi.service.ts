import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRecordEntity } from '../database/entities/user-record.entity';
import { UserEntity } from '../database/entities/user.entity';
import { AnalyzeBaziDto } from './dto/analyze-bazi.dto';

const HEAVENLY_STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const;
const EARTHLY_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const;
const CHINESE_ZODIACS = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'] as const;
const FIVE_ELEMENTS = ['木', '火', '土', '金', '水'] as const;

const STEM_TO_ELEMENT: Record<string, string> = {
  甲: '木',
  乙: '木',
  丙: '火',
  丁: '火',
  戊: '土',
  己: '土',
  庚: '金',
  辛: '金',
  壬: '水',
  癸: '水',
};

const BRANCH_TO_ELEMENT: Record<string, string> = {
  子: '水',
  丑: '土',
  寅: '木',
  卯: '木',
  辰: '土',
  巳: '火',
  午: '火',
  未: '土',
  申: '金',
  酉: '金',
  戌: '土',
  亥: '水',
};

const ELEMENT_TO_COLOR: Record<string, string> = {
  木: '青绿色',
  火: '暖赤色',
  土: '砂金色',
  金: '银白色',
  水: '雾蓝色',
};

const ELEMENT_TO_DIRECTION: Record<string, string> = {
  木: '东方',
  火: '南方',
  土: '中央与西南',
  金: '西方',
  水: '北方',
};

const ELEMENT_TO_KEYWORD: Record<string, string[]> = {
  木: ['舒展', '生发', '向上'],
  火: ['表达', '热度', '主动'],
  土: ['稳住', '沉淀', '承接'],
  金: ['边界', '判断', '收束'],
  水: ['感受', '流动', '观察'],
};

const COMPLIANCE_NOTICE =
  '当前结果为简化版四柱体验，未结合节气换月、真太阳时与专业命理校准，仅用于内容体验和自我观察。';

@Injectable()
export class BaziService {
  constructor(
    @InjectRepository(UserRecordEntity)
    private readonly userRecordRepository: Repository<UserRecordEntity>,
  ) {}

  async analyze(dto: AnalyzeBaziDto, user: UserEntity | null) {
    const result =
      dto.mode === 'professional' ? this.buildProfessionalResult(dto) : this.buildResult(dto);
    let recordId: string | null = null;

    if (user) {
      const record = this.userRecordRepository.create({
        userId: user.id,
        recordType: 'bazi',
        sourceCode: 'lite-bazi-chart',
        resultTitle: result.title,
        score: result.dominantElement.value.toFixed(2),
        resultLevel: result.dominantElement.name,
        resultData: result,
        isFullReportUnlocked: false,
        unlockType: null,
      });

      const savedRecord = await this.userRecordRepository.save(record);
      recordId = savedRecord.id;
    }

    return {
      code: 0,
      message: 'ok',
      data: {
        recordId,
        isSaved: Boolean(recordId),
        result,
      },
      timestamp: new Date().toISOString(),
    };
  }

  async analyzeProfessional(dto: AnalyzeBaziDto, user: UserEntity | null) {
    const result = this.buildProfessionalResult({
      ...dto,
      mode: 'professional',
    });
    let recordId: string | null = null;

    if (user) {
      const record = this.userRecordRepository.create({
        userId: user.id,
        recordType: 'bazi',
        sourceCode: 'professional-bazi-chart',
        resultTitle: result.title,
        score: result.dominantElement.value.toFixed(2),
        resultLevel: result.dominantElement.name,
        resultData: result,
        isFullReportUnlocked: false,
        unlockType: null,
      });

      const savedRecord = await this.userRecordRepository.save(record);
      recordId = savedRecord.id;
    }

    return {
      code: 0,
      message: 'ok',
      data: {
        recordId,
        isSaved: Boolean(recordId),
        result,
      },
      timestamp: new Date().toISOString(),
    };
  }

  async getHistory(user: UserEntity) {
    const records = await this.userRecordRepository.find({
      where: {
        userId: user.id,
        recordType: 'bazi',
      },
      order: {
        createdAt: 'DESC',
      },
      take: 6,
    });

    return {
      code: 0,
      message: 'ok',
      data: {
        items: records.map((record) => {
          const result = record.resultData as {
            title?: string;
            subtitle?: string;
            summary?: string;
            chart?: { yearPillar?: string; dayPillar?: string };
            dominantElement?: { name?: string };
            generatedAt?: string;
          };

          return {
            id: record.id,
            title: record.resultTitle,
            subtitle: result.subtitle ?? '',
            summary: result.summary ?? '',
            dominantElementName: result.dominantElement?.name ?? '',
            yearPillar: result.chart?.yearPillar ?? '',
            dayPillar: result.chart?.dayPillar ?? '',
            createdAt: result.generatedAt ?? record.createdAt.toISOString(),
          };
        }),
      },
      timestamp: new Date().toISOString(),
    };
  }

  private buildResult(dto: AnalyzeBaziDto) {
    const [year, month, day] = dto.birthday.split('-').map((item) => Number(item));
    const hour = Number.parseInt(dto.birthTime.slice(0, 2), 10);
    const minute = Number.parseInt(dto.birthTime.slice(3, 5), 10);

    const yearIndex = this.normalizeIndex(year - 1984, 60);
    const monthIndex = this.normalizeIndex((year - 1984) * 12 + month + 15, 60);
    const dayIndex = this.computeDayIndex(dto.birthday);
    const hourBranchIndex = this.computeHourBranchIndex(hour);
    const hourIndex = this.normalizeIndex(dayIndex * 12 + hourBranchIndex + 3, 60);

    const yearPillar = this.getPillar(yearIndex);
    const monthPillar = this.getPillar(monthIndex);
    const dayPillar = this.getPillar(dayIndex);
    const hourPillar = this.getPillar(hourIndex);
    const zodiac = CHINESE_ZODIACS[yearIndex % 12];

    const fiveElements = this.computeFiveElements([
      yearPillar,
      monthPillar,
      dayPillar,
      hourPillar,
    ]);
    const dominantElement = [...fiveElements].sort((left, right) => right.value - left.value)[0];
    const supportElement = [...fiveElements].sort((left, right) => left.value - right.value)[0];
    const dayMaster = STEM_TO_ELEMENT[dayPillar[0]];
    const birthMomentLabel = this.resolveBirthMomentLabel(hour, minute);
    const keywords = ELEMENT_TO_KEYWORD[dominantElement.name].slice(0, 3);

    return {
      title: `${dominantElement.name}势偏旺型`,
      subtitle: `${dayMaster}日主气质更明显，当前命盘更偏向${dominantElement.name}的表达方式。`,
      summary: `这份简化排盘显示，你的节奏更适合先稳住内在状态，再把力量放到真正重要的方向上。${supportElement.name}元素偏弱，意味着你在压力大的时候更需要有意识地补足对应节奏。`,
      chart: {
        yearPillar,
        monthPillar,
        dayPillar,
        hourPillar,
      },
      baseProfile: {
        birthday: dto.birthday,
        birthTime: dto.birthTime,
        birthMomentLabel,
        gender: dto.gender ?? 'unknown',
        zodiac,
        dayMaster,
      },
      dominantElement,
      supportElement,
      fiveElements,
      keywords,
      reading: {
        career:
          dominantElement.name === '土'
            ? '更适合做长期、稳定、需要耐心积累的事，节奏一旦定下来会比较稳。'
            : dominantElement.name === '火'
              ? '适合承担需要表达、推动和带动气氛的任务，但要避免过度消耗。'
              : dominantElement.name === '木'
                ? '更适合做成长型、需要持续延展和创造空间的事情。'
                : dominantElement.name === '金'
                  ? '适合做判断、筛选和优化型工作，优势在于清晰和果断。'
                  : '适合先观察、再布局，往往在感受环境变化后更容易找到机会。',
        relationship:
          supportElement.name === '火'
            ? '关系里可以更主动表达温度，别总等情绪完全整理好再开口。'
            : supportElement.name === '木'
              ? '多给关系留一点生长空间，少用“马上要有结果”的心态看待连接。'
              : supportElement.name === '土'
                ? '关系里更需要稳定反馈和确定感，规律回应会比一次性热情更重要。'
                : supportElement.name === '金'
                  ? '试着把边界说清楚，会比反复揣测更省力。'
                  : '允许情绪慢一点流动出来，关系会更柔和。',
        rhythm:
          `当前更建议你用“${dominantElement.name}主轴 + ${supportElement.name}补位”的方式安排节奏。先用擅长的方式启动，再给偏弱的一面留一点照顾。`,
      },
      practicalTips: {
        favorableDirection: ELEMENT_TO_DIRECTION[dominantElement.name],
        supportiveColor: ELEMENT_TO_COLOR[supportElement.name],
        dailyFocus: `今天适合围绕“${keywords.join(' / ')}”来安排主要任务。`,
      },
      sharePoster: {
        themeName: dominantElement.name === '火' ? 'warm-amber' : 'oriental-gold',
        title: `${dominantElement.name}势偏旺型`,
        subtitle: `${dayMaster}日主更突出，当前更适合顺势安排节奏。`,
        accentText: `${dominantElement.name}主轴 · ${supportElement.name}补位`,
        footerText: '简化排盘仅用于内容体验与自我观察。',
      },
      complianceNotice: COMPLIANCE_NOTICE,
      generatedAt: new Date().toISOString(),
    };
  }

  private buildProfessionalResult(dto: AnalyzeBaziDto) {
    const adjusted = this.applyTrueSolarTime(dto);
    const liteResult = this.buildResult({
      ...dto,
      birthday: adjusted.birthday,
      birthTime: adjusted.birthTime,
      mode: 'lite',
    });
    const [year, month] = adjusted.birthday.split('-').map((item) => Number(item));
    const monthBranchIndex = this.resolveSolarTermMonthBranchIndex(adjusted.birthday);
    const monthStemIndex = this.normalizeIndex((year - 1984) * 12 + monthBranchIndex + 1, 10);
    const professionalMonthPillar = `${HEAVENLY_STEMS[monthStemIndex]}${EARTHLY_BRANCHES[monthBranchIndex]}`;
    const professionalElements = this.computeFiveElements([
      liteResult.chart.yearPillar,
      professionalMonthPillar,
      liteResult.chart.dayPillar,
      liteResult.chart.hourPillar,
    ]);
    const dominantElement = [...professionalElements].sort((left, right) => right.value - left.value)[0];
    const supportElement = [...professionalElements].sort((left, right) => left.value - right.value)[0];

    return {
      ...liteResult,
      title: `${dominantElement.name}势专业校正版`,
      subtitle: `已按节气换月与真太阳时近似校正，${professionalMonthPillar}月柱用于专业版参考。`,
      chart: {
        ...liteResult.chart,
        monthPillar: professionalMonthPillar,
      },
      dominantElement,
      supportElement,
      fiveElements: professionalElements,
      professional: {
        mode: 'professional',
        adjustedBirthday: adjusted.birthday,
        adjustedBirthTime: adjusted.birthTime,
        trueSolarOffsetMinutes: adjusted.offsetMinutes,
        longitude: dto.longitude ?? 120,
        timezoneOffset: dto.timezoneOffset ?? 8,
        monthRule: '节气换月近似：按固定节气日切换月令，适合产品专业版首轮校准。',
        regressionSamples: [
          { birthday: '1984-02-04', expectedYearPillar: '甲子' },
          { birthday: '1990-01-27', expectedZodiac: '蛇/马交界需按立春校验' },
        ],
      },
      complianceNotice:
        '当前为专业版近似校准：已纳入节气换月和真太阳时修正，但未接入天文历表级精算，仅用于内容体验和自我观察。',
      generatedAt: new Date().toISOString(),
    };
  }

  private applyTrueSolarTime(dto: AnalyzeBaziDto) {
    const longitude = dto.longitude ?? 120;
    const timezoneOffset = dto.timezoneOffset ?? 8;
    const standardLongitude = timezoneOffset * 15;
    const offsetMinutes = Math.round((longitude - standardLongitude) * 4);
    const [hour, minute] = dto.birthTime.split(':').map((item) => Number(item));
    const date = new Date(`${dto.birthday}T00:00:00Z`);
    date.setUTCMinutes(hour * 60 + minute + offsetMinutes);

    const yyyy = date.getUTCFullYear();
    const mm = `${date.getUTCMonth() + 1}`.padStart(2, '0');
    const dd = `${date.getUTCDate()}`.padStart(2, '0');
    const hh = `${date.getUTCHours()}`.padStart(2, '0');
    const mi = `${date.getUTCMinutes()}`.padStart(2, '0');

    return {
      birthday: `${yyyy}-${mm}-${dd}`,
      birthTime: `${hh}:${mi}`,
      offsetMinutes,
    };
  }

  private resolveSolarTermMonthBranchIndex(birthday: string) {
    const monthDay = birthday.slice(5, 10);
    const boundaries = [
      { start: '02-04', branchIndex: 2 },
      { start: '03-06', branchIndex: 3 },
      { start: '04-05', branchIndex: 4 },
      { start: '05-06', branchIndex: 5 },
      { start: '06-06', branchIndex: 6 },
      { start: '07-07', branchIndex: 7 },
      { start: '08-08', branchIndex: 8 },
      { start: '09-08', branchIndex: 9 },
      { start: '10-08', branchIndex: 10 },
      { start: '11-07', branchIndex: 11 },
      { start: '12-07', branchIndex: 0 },
      { start: '01-06', branchIndex: 1 },
    ];

    const matched = [...boundaries]
      .sort((left, right) => right.start.localeCompare(left.start))
      .find((item) => monthDay >= item.start);

    return matched?.branchIndex ?? 1;
  }

  private computeFiveElements(pillars: string[]) {
    const counters = FIVE_ELEMENTS.reduce<Array<{ name: string; value: number }>>(
      (result, name) => [...result, { name, value: 0 }],
      [],
    );

    for (const pillar of pillars) {
      const stemElement = STEM_TO_ELEMENT[pillar[0]];
      const branchElement = BRANCH_TO_ELEMENT[pillar[1]];
      const stemTarget = counters.find((item) => item.name === stemElement);
      const branchTarget = counters.find((item) => item.name === branchElement);

      if (stemTarget) {
        stemTarget.value += 2;
      }

      if (branchTarget) {
        branchTarget.value += 1;
      }
    }

    return counters;
  }

  private getPillar(index: number) {
    return `${HEAVENLY_STEMS[index % 10]}${EARTHLY_BRANCHES[index % 12]}`;
  }

  private computeDayIndex(birthday: string) {
    const baseDate = Date.UTC(1984, 1, 2);
    const currentDate = Date.parse(`${birthday}T00:00:00Z`);
    const diffDays = Math.floor((currentDate - baseDate) / (24 * 60 * 60 * 1000));

    return this.normalizeIndex(diffDays, 60);
  }

  private computeHourBranchIndex(hour: number) {
    return Math.floor(((hour + 1) % 24) / 2);
  }

  private resolveBirthMomentLabel(hour: number, minute: number) {
    const totalMinutes = hour * 60 + minute;

    if (totalMinutes < 300) {
      return '夜深偏静';
    }

    if (totalMinutes < 720) {
      return '晨间初升';
    }

    if (totalMinutes < 1020) {
      return '日间外放';
    }

    return '夜幕收束';
  }

  private normalizeIndex(value: number, modulo: number) {
    return ((value % modulo) + modulo) % modulo;
  }
}
