import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRecordEntity } from '../database/entities/user-record.entity';
import { UserEntity } from '../database/entities/user.entity';
import { BaziEngine, BaziEngineResult } from './bazi-engine';
import { searchBirthPlaceCatalog } from './birth-place.catalog';
import { AnalyzeBaziDto } from './dto/analyze-bazi.dto';

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
  '当前结果为轻解读四柱体验，已统一使用农历/干支库排盘，但未启用真太阳时和专业命理校准，仅用于内容体验和自我观察。';

@Injectable()
export class BaziService {
  constructor(
    @InjectRepository(UserRecordEntity)
    private readonly userRecordRepository: Repository<UserRecordEntity>,
    private readonly baziEngine: BaziEngine,
  ) {}

  async analyze(dto: AnalyzeBaziDto, user: UserEntity | null) {
    const isProfessionalMode = dto.mode === 'professional';
    const result = isProfessionalMode ? this.buildProfessionalResult(dto) : this.buildResult(dto);
    let recordId: string | null = null;

    if (user) {
      const record = this.userRecordRepository.create({
        userId: user.id,
        recordType: 'bazi',
        sourceCode: isProfessionalMode ? 'professional-bazi-chart' : 'lite-bazi-chart',
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
            professional?: unknown;
            generatedAt?: string;
          };

          return {
            id: record.id,
            title: record.resultTitle,
            sourceCode: record.sourceCode ?? '',
            isProfessional:
              record.sourceCode === 'professional-bazi-chart' || Boolean(result.professional),
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

  async getProfessionalDetail(recordId: string, user: UserEntity) {
    const record = await this.userRecordRepository.findOne({
      where: {
        id: recordId,
        userId: user.id,
        recordType: 'bazi',
      },
    });

    if (!record) {
      throw new NotFoundException('专业排盘不存在或无权访问');
    }

    const result = this.resolveProfessionalDetailResult(record.resultData);

    if (!result.professional) {
      throw new NotFoundException('该记录不是专业排盘');
    }

    return {
      code: 0,
      message: 'ok',
      data: {
        detail: {
          recordId: record.id,
          title: result.title,
          subtitle: result.subtitle,
          summary: result.summary,
          algorithmVersion: result.algorithmVersion,
          inputSnapshot: result.inputSnapshot,
          correctionSnapshot: result.correctionSnapshot,
          chart: result.chart,
          baseProfile: result.baseProfile,
          dominantElement: result.dominantElement,
          supportElement: result.supportElement,
          fiveElements: result.fiveElements,
          dayMasterAnalysis: result.dayMasterAnalysis,
          professional: result.professional,
          annualFortunes: result.professional.annualFortunes,
          majorLuck: result.professional.majorLuck,
          reading: result.reading,
          practicalTips: result.practicalTips,
          complianceNotice: result.complianceNotice,
          generatedAt: result.generatedAt ?? record.createdAt.toISOString(),
        },
      },
      timestamp: new Date().toISOString(),
    };
  }

  searchBirthPlaces(keyword = '', limit = 10) {
    return {
      code: 0,
      message: 'ok',
      data: {
        items: searchBirthPlaceCatalog(keyword, limit),
      },
      timestamp: new Date().toISOString(),
    };
  }

  private resolveProfessionalDetailResult(rawResult: unknown) {
    const result = this.asRecord(rawResult);
    const professional = this.asRecord(result.professional);

    if (professional.majorLuck && result.dayMasterAnalysis && result.inputSnapshot) {
      return result as Record<string, any>;
    }

    if (!professional.mode) {
      return result as Record<string, any>;
    }

    const baseProfile = this.asRecord(result.baseProfile);
    const inputSnapshot = this.asRecord(result.inputSnapshot);
    const birthday = this.pickString(
      baseProfile.birthday,
      this.pickString(inputSnapshot.birthday, ''),
    );
    const birthTime = this.pickString(
      baseProfile.birthTime,
      this.pickString(inputSnapshot.birthTime, ''),
    );

    if (!birthday || !birthTime) {
      throw new NotFoundException('专业排盘缺少出生时间，无法生成详情');
    }

    const rebuilt = this.buildProfessionalResult({
      birthday,
      birthTime,
      gender: this.pickGender(baseProfile.gender),
      birthPlace: this.pickString(professional.birthPlace, '杭州'),
      longitude: Number(professional.longitude ?? 120),
      latitude: Number(professional.latitude ?? 30.25),
      timezoneOffset: Number(professional.timezoneOffset ?? 8),
      mode: 'professional',
    });

    return {
      ...result,
      ...rebuilt,
      generatedAt: this.pickString(result.generatedAt, rebuilt.generatedAt),
    };
  }

  private asRecord(value: unknown) {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, any>)
      : {};
  }

  private pickString(value: unknown, fallback: string) {
    return typeof value === 'string' && value.trim() ? value : fallback;
  }

  private pickGender(value: unknown): 'male' | 'female' | 'unknown' {
    return value === 'male' || value === 'female' || value === 'unknown' ? value : 'unknown';
  }

  private buildResult(dto: AnalyzeBaziDto) {
    const engineResult = this.baziEngine.build(dto, {
      mode: 'lite',
      applyTrueSolarTime: false,
    });

    return this.buildInterpretedResult(engineResult, false);
  }

  private buildProfessionalResult(dto: AnalyzeBaziDto) {
    const engineResult = this.baziEngine.build(
      {
        ...dto,
        mode: 'professional',
      },
      {
        mode: 'professional',
        applyTrueSolarTime: true,
      },
    );

    return this.buildInterpretedResult(engineResult, true);
  }

  private buildInterpretedResult(engineResult: BaziEngineResult, isProfessional: boolean) {
    const { dominantElement, supportElement } = engineResult;
    const { dayMaster } = engineResult.baseProfile;
    const keywords = ELEMENT_TO_KEYWORD[dominantElement.name].slice(0, 3);

    return {
      algorithmVersion: engineResult.algorithmVersion,
      inputSnapshot: engineResult.inputSnapshot,
      correctionSnapshot: engineResult.correctionSnapshot,
      title: isProfessional
        ? `${dominantElement.name}势专业校正版`
        : `${dominantElement.name}势偏旺型`,
      subtitle: isProfessional
        ? `已按节气换月、立春年界与真太阳时校正，${engineResult.chart.monthPillar}月柱用于专业版参考。`
        : `${dayMaster}日主气质更明显，当前命盘更偏向${dominantElement.name}的表达方式。`,
      summary: isProfessional
        ? `专业版使用农历/干支库重新排盘：日主为${dayMaster}，四柱呈现${dominantElement.name}势更明显。${supportElement.name}元素相对需要补位，适合在日常节奏里用方向、颜色和行动方式做轻量调和。`
        : `这份轻解读也已统一使用农历/干支库排盘。你的节奏更适合先稳住内在状态，再把力量放到真正重要的方向上。${supportElement.name}元素偏弱，意味着你在压力大的时候更需要有意识地补足对应节奏。`,
      chart: engineResult.chart,
      baseProfile: isProfessional
        ? engineResult.baseProfile
        : {
            birthday: engineResult.baseProfile.birthday,
            birthTime: engineResult.baseProfile.birthTime,
            birthMomentLabel: engineResult.baseProfile.birthMomentLabel,
            gender: engineResult.baseProfile.gender,
            zodiac: engineResult.baseProfile.zodiac,
            dayMaster: engineResult.baseProfile.dayMaster,
          },
      dominantElement,
      supportElement,
      fiveElements: engineResult.fiveElements,
      dayMasterAnalysis: engineResult.dayMasterAnalysis,
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
        title: isProfessional
          ? `${dominantElement.name}势专业校正版`
          : `${dominantElement.name}势偏旺型`,
        subtitle: isProfessional
          ? `${dayMaster}日主 · ${engineResult.chart.monthPillar}月令`
          : `${dayMaster}日主更突出，当前更适合顺势安排节奏。`,
        accentText: `${dominantElement.name}主轴 · ${supportElement.name}补位`,
        footerText: isProfessional
          ? '专业版已纳入节气换月、立春年界与真太阳时。'
          : '轻解读已统一使用农历/干支库排盘。',
      },
      ...(isProfessional
        ? {
            professional: {
              mode: 'professional',
              library: engineResult.library,
              algorithmVersion: engineResult.algorithmVersion,
              adjustedBirthday: engineResult.correctionSnapshot.adjustedBirthday,
              adjustedBirthTime: engineResult.correctionSnapshot.adjustedBirthTime,
              birthPlace: engineResult.inputSnapshot.birthPlace,
              trueSolarOffsetMinutes: engineResult.correctionSnapshot.offsetMinutes,
              longitude: engineResult.inputSnapshot.longitude,
              latitude: engineResult.inputSnapshot.latitude,
              timezoneOffset: engineResult.inputSnapshot.timezoneOffset,
              monthRule: '由农历/干支库按节气换月计算，年柱按立春年界校正。',
              lunar: engineResult.lunar,
              tenGods: engineResult.tenGods,
              hiddenStems: engineResult.hiddenStems,
              naYin: engineResult.naYin,
              dayMasterAnalysis: engineResult.dayMasterAnalysis,
              majorLuck: engineResult.majorLuck,
              annualFortunes: engineResult.annualFortunes,
              regressionSamples: [
                { birthday: '1984-02-04 00:00', expectedYearPillar: '甲子' },
                { birthday: '1990-01-27 12:00', expectedYearPillar: '己巳' },
              ],
            },
          }
        : {}),
      complianceNotice: isProfessional
        ? '当前为专业版排盘：已纳入农历/干支库、节气换月、立春年界和真太阳时修正，仅用于内容体验和自我观察。'
        : COMPLIANCE_NOTICE,
      generatedAt: new Date().toISOString(),
    };
  }
}
