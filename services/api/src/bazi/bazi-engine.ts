import { Injectable } from '@nestjs/common';
import { Solar } from 'lunar-typescript';
import { AnalyzeBaziDto } from './dto/analyze-bazi.dto';

export const BAZI_ALGORITHM_VERSION = 'bazi-engine-v1.2.0';

export const FIVE_ELEMENTS = ['木', '火', '土', '金', '水'] as const;
type FiveElementName = (typeof FIVE_ELEMENTS)[number];
type StemPolarity = 'yang' | 'yin';

export const STEM_TO_ELEMENT: Record<string, string> = {
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

export const BRANCH_TO_ELEMENT: Record<string, string> = {
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

const STEM_POLARITY: Record<string, StemPolarity> = {
  甲: 'yang',
  乙: 'yin',
  丙: 'yang',
  丁: 'yin',
  戊: 'yang',
  己: 'yin',
  庚: 'yang',
  辛: 'yin',
  壬: 'yang',
  癸: 'yin',
};

const GENERATES: Record<FiveElementName, FiveElementName> = {
  木: '火',
  火: '土',
  土: '金',
  金: '水',
  水: '木',
};

const CONTROLS: Record<FiveElementName, FiveElementName> = {
  木: '土',
  火: '金',
  土: '水',
  金: '木',
  水: '火',
};

export interface BaziEngineOptions {
  mode: 'lite' | 'professional';
  applyTrueSolarTime: boolean;
}

export interface BaziCorrectionSnapshot {
  enabled: boolean;
  method: 'none' | 'longitude-true-solar-time';
  originalBirthday: string;
  originalBirthTime: string;
  adjustedBirthday: string;
  adjustedBirthTime: string;
  offsetMinutes: number;
  longitude: number;
  latitude: number;
  timezoneOffset: number;
  standardLongitude: number;
}

export interface BaziEngineResult {
  algorithmVersion: string;
  library: 'lunar-typescript';
  inputSnapshot: {
    birthday: string;
    birthTime: string;
    gender: 'male' | 'female' | 'unknown';
    mode: 'lite' | 'professional';
    calendarType: 'solar';
    birthPlace: string;
    longitude: number;
    latitude: number;
    timezoneOffset: number;
  };
  correctionSnapshot: BaziCorrectionSnapshot;
  chart: {
    yearPillar: string;
    monthPillar: string;
    dayPillar: string;
    hourPillar: string;
  };
  baseProfile: {
    birthday: string;
    birthTime: string;
    adjustedBirthday: string;
    adjustedBirthTime: string;
    birthPlace: string;
    longitude: number;
    latitude: number;
    birthMomentLabel: string;
    gender: 'male' | 'female' | 'unknown';
    zodiac: string;
    dayMaster: string;
  };
  fiveElements: Array<{ name: string; value: number }>;
  dominantElement: { name: string; value: number };
  supportElement: { name: string; value: number };
  dayMasterAnalysis: {
    dayStem: string;
    dayElement: string;
    polarity: StemPolarity;
    monthBranch: string;
    monthElement: string;
    strengthLevel: 'strong' | 'weak' | 'balanced';
    supportScore: number;
    pressureScore: number;
    balanceScore: number;
    usefulElements: Array<{ name: string; reason: string }>;
    avoidElements: Array<{ name: string; reason: string }>;
    tenGodDistribution: Array<{ name: string; count: number }>;
  };
  majorLuck: {
    available: boolean;
    reason?: string;
    gender: 'male' | 'female' | 'unknown';
    direction: 'forward' | 'backward' | 'unknown';
    startAgeYears: number | null;
    startAgeMonths: number | null;
    startAgeDays: number | null;
    startAgeHours: number | null;
    cycles: Array<{
      index: number;
      ganZhi: string;
      startAge: number;
      endAge: number;
      startYear: number;
      endYear: number;
      tenGod: string;
      element: string;
    }>;
  };
  annualFortunes: Array<{
    year: number;
    nominalAge: number;
    ganZhi: string;
    tenGod: string;
    element: string;
    relation: 'support' | 'drain' | 'wealth' | 'officer' | 'peer';
  }>;
  lunar: {
    year: number;
    month: number;
    day: number;
    yearInChinese: string;
    monthInChinese: string;
    dayInChinese: string;
  };
  tenGods: {
    year: string;
    month: string;
    day: string;
    time: string;
  };
  hiddenStems: {
    year: string[];
    month: string[];
    day: string[];
    time: string[];
  };
  naYin: {
    year: string;
    month: string;
    day: string;
    time: string;
  };
}

@Injectable()
export class BaziEngine {
  build(dto: AnalyzeBaziDto, options: BaziEngineOptions): BaziEngineResult {
    const inputSnapshot = this.buildInputSnapshot(dto, options.mode);
    const correctionSnapshot = this.buildCorrectionSnapshot(inputSnapshot, options.applyTrueSolarTime);
    const [year, month, day] = correctionSnapshot.adjustedBirthday
      .split('-')
      .map((item) => Number(item));
    const [hour, minute] = correctionSnapshot.adjustedBirthTime
      .split(':')
      .map((item) => Number(item));
    const solar = Solar.fromYmdHms(year, month, day, hour, minute, 0);
    const lunar = solar.getLunar();
    const eightChar = lunar.getEightChar();
    const chart = {
      yearPillar: eightChar.getYear(),
      monthPillar: eightChar.getMonth(),
      dayPillar: eightChar.getDay(),
      hourPillar: eightChar.getTime(),
    };
    const fiveElements = this.computeFiveElements([
      chart.yearPillar,
      chart.monthPillar,
      chart.dayPillar,
      chart.hourPillar,
    ]);
    const dominantElement = [...fiveElements].sort((left, right) => right.value - left.value)[0];
    const supportElement = [...fiveElements].sort((left, right) => left.value - right.value)[0];
    const dayMaster = STEM_TO_ELEMENT[chart.dayPillar[0]];
    const dayMasterAnalysis = this.buildDayMasterAnalysis(
      chart,
      fiveElements,
      [
        ...Object.values({
          year: eightChar.getYearShiShenGan(),
          month: eightChar.getMonthShiShenGan(),
          day: eightChar.getDayShiShenGan(),
          time: eightChar.getTimeShiShenGan(),
        }),
      ],
    );

    return {
      algorithmVersion: BAZI_ALGORITHM_VERSION,
      library: 'lunar-typescript',
      inputSnapshot,
      correctionSnapshot,
      chart,
      baseProfile: {
        birthday: inputSnapshot.birthday,
        birthTime: inputSnapshot.birthTime,
        adjustedBirthday: correctionSnapshot.adjustedBirthday,
        adjustedBirthTime: correctionSnapshot.adjustedBirthTime,
        birthPlace: inputSnapshot.birthPlace,
        longitude: inputSnapshot.longitude,
        latitude: inputSnapshot.latitude,
        birthMomentLabel: this.resolveBirthMomentLabel(hour, minute),
        gender: inputSnapshot.gender,
        zodiac: lunar.getYearShengXiao(),
        dayMaster,
      },
      fiveElements,
      dominantElement,
      supportElement,
      dayMasterAnalysis,
      majorLuck: this.buildMajorLuck(eightChar, inputSnapshot.gender),
      annualFortunes: this.buildAnnualFortunes(
        chart.dayPillar[0],
        Number(inputSnapshot.birthday.slice(0, 4)),
      ),
      lunar: {
        year: lunar.getYear(),
        month: lunar.getMonth(),
        day: lunar.getDay(),
        yearInChinese: lunar.getYearInChinese(),
        monthInChinese: lunar.getMonthInChinese(),
        dayInChinese: lunar.getDayInChinese(),
      },
      tenGods: {
        year: eightChar.getYearShiShenGan(),
        month: eightChar.getMonthShiShenGan(),
        day: eightChar.getDayShiShenGan(),
        time: eightChar.getTimeShiShenGan(),
      },
      hiddenStems: {
        year: eightChar.getYearHideGan(),
        month: eightChar.getMonthHideGan(),
        day: eightChar.getDayHideGan(),
        time: eightChar.getTimeHideGan(),
      },
      naYin: {
        year: eightChar.getYearNaYin(),
        month: eightChar.getMonthNaYin(),
        day: eightChar.getDayNaYin(),
        time: eightChar.getTimeNaYin(),
      },
    };
  }

  private buildInputSnapshot(dto: AnalyzeBaziDto, mode: 'lite' | 'professional') {
    return {
      birthday: dto.birthday,
      birthTime: dto.birthTime,
      gender: dto.gender ?? 'unknown',
      mode,
      calendarType: 'solar' as const,
      birthPlace: dto.birthPlace?.trim() || '杭州',
      longitude: dto.longitude ?? 120,
      latitude: dto.latitude ?? 30.25,
      timezoneOffset: dto.timezoneOffset ?? 8,
    };
  }

  private buildCorrectionSnapshot(
    input: ReturnType<BaziEngine['buildInputSnapshot']>,
    enabled: boolean,
  ): BaziCorrectionSnapshot {
    const standardLongitude = input.timezoneOffset * 15;
    const offsetMinutes = enabled
      ? Math.round((input.longitude - standardLongitude) * 4)
      : 0;
    const adjusted = this.applyMinuteOffset(input.birthday, input.birthTime, offsetMinutes);

    return {
      enabled,
      method: enabled ? 'longitude-true-solar-time' : 'none',
      originalBirthday: input.birthday,
      originalBirthTime: input.birthTime,
      adjustedBirthday: adjusted.birthday,
      adjustedBirthTime: adjusted.birthTime,
      offsetMinutes,
      longitude: input.longitude,
      latitude: input.latitude,
      timezoneOffset: input.timezoneOffset,
      standardLongitude,
    };
  }

  private applyMinuteOffset(birthday: string, birthTime: string, offsetMinutes: number) {
    const [hour, minute] = birthTime.split(':').map((item) => Number(item));
    const date = new Date(`${birthday}T00:00:00Z`);
    date.setUTCMinutes(hour * 60 + minute + offsetMinutes);

    const yyyy = date.getUTCFullYear();
    const mm = `${date.getUTCMonth() + 1}`.padStart(2, '0');
    const dd = `${date.getUTCDate()}`.padStart(2, '0');
    const hh = `${date.getUTCHours()}`.padStart(2, '0');
    const mi = `${date.getUTCMinutes()}`.padStart(2, '0');

    return {
      birthday: `${yyyy}-${mm}-${dd}`,
      birthTime: `${hh}:${mi}`,
    };
  }

  private computeFiveElements(pillars: string[]) {
    const counters = FIVE_ELEMENTS.map((name) => ({ name, value: 0 }));

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

  private buildDayMasterAnalysis(
    chart: BaziEngineResult['chart'],
    fiveElements: BaziEngineResult['fiveElements'],
    tenGods: string[],
  ): BaziEngineResult['dayMasterAnalysis'] {
    const dayStem = chart.dayPillar[0];
    const dayElement = STEM_TO_ELEMENT[dayStem] as FiveElementName;
    const monthBranch = chart.monthPillar[1];
    const monthElement = BRANCH_TO_ELEMENT[monthBranch] as FiveElementName;
    const resourceElement = this.findElementGenerating(dayElement);
    const outputElement = GENERATES[dayElement];
    const wealthElement = CONTROLS[dayElement];
    const officerElement = this.findElementControlling(dayElement);
    const scoreOf = (name: FiveElementName) =>
      fiveElements.find((item) => item.name === name)?.value ?? 0;
    const supportScore =
      scoreOf(dayElement) +
      scoreOf(resourceElement) * 0.8 +
      (monthElement === dayElement ? 2 : 0) +
      (monthElement === resourceElement ? 1 : 0);
    const pressureScore =
      scoreOf(outputElement) * 0.7 +
      scoreOf(wealthElement) * 0.8 +
      scoreOf(officerElement);
    const balanceScore = Number((supportScore - pressureScore).toFixed(2));
    const strengthLevel =
      balanceScore >= 2 ? 'strong' : balanceScore <= -2 ? 'weak' : 'balanced';

    return {
      dayStem,
      dayElement,
      polarity: STEM_POLARITY[dayStem],
      monthBranch,
      monthElement,
      strengthLevel,
      supportScore: Number(supportScore.toFixed(2)),
      pressureScore: Number(pressureScore.toFixed(2)),
      balanceScore,
      usefulElements: this.resolveUsefulElements(strengthLevel, {
        dayElement,
        resourceElement,
        outputElement,
        wealthElement,
        officerElement,
      }),
      avoidElements: this.resolveAvoidElements(strengthLevel, {
        dayElement,
        resourceElement,
        outputElement,
        wealthElement,
        officerElement,
      }),
      tenGodDistribution: this.countTenGods(tenGods),
    };
  }

  private buildMajorLuck(
    eightChar: ReturnType<ReturnType<typeof Solar.fromYmdHms>['getLunar']>['getEightChar'] extends () => infer T ? T : never,
    gender: 'male' | 'female' | 'unknown',
  ): BaziEngineResult['majorLuck'] {
    if (gender === 'unknown') {
      return {
        available: false,
        reason: '大运顺逆和起运岁数需要明确性别，当前仅保留基础专业排盘。',
        gender,
        direction: 'unknown',
        startAgeYears: null,
        startAgeMonths: null,
        startAgeDays: null,
        startAgeHours: null,
        cycles: [],
      };
    }

    const libraryGender = gender === 'male' ? 1 : 0;
    const yun = eightChar.getYun(libraryGender);
    const cycles = yun
      .getDaYun()
      .filter((cycle) => Boolean(cycle.getGanZhi()))
      .slice(0, 8)
      .map((cycle) => {
        const ganZhi = cycle.getGanZhi();

        return {
          index: cycle.getIndex(),
          ganZhi,
          startAge: cycle.getStartAge(),
          endAge: cycle.getEndAge(),
          startYear: cycle.getStartYear(),
          endYear: cycle.getEndYear(),
          tenGod: this.resolveTenGod(eightChar.getDayGan(), ganZhi[0]),
          element: STEM_TO_ELEMENT[ganZhi[0]],
        };
      });

    return {
      available: true,
      gender,
      direction: yun.isForward() ? 'forward' : 'backward',
      startAgeYears: yun.getStartYear(),
      startAgeMonths: yun.getStartMonth(),
      startAgeDays: yun.getStartDay(),
      startAgeHours: yun.getStartHour(),
      cycles,
    };
  }

  private buildAnnualFortunes(dayStem: string, birthYear: number) {
    const currentYear = new Date().getFullYear();

    return Array.from({ length: 5 }, (_, index) => {
      const year = currentYear + index;
      const ganZhi = Solar.fromYmdHms(year, 7, 1, 12, 0, 0)
        .getLunar()
        .getEightChar()
        .getYear();
      const targetElement = STEM_TO_ELEMENT[ganZhi[0]];

      return {
        year,
        nominalAge: Math.max(1, year - birthYear + 1),
        ganZhi,
        tenGod: this.resolveTenGod(dayStem, ganZhi[0]),
        element: targetElement,
        relation: this.resolveElementRelation(
          STEM_TO_ELEMENT[dayStem] as FiveElementName,
          targetElement as FiveElementName,
        ),
      };
    });
  }

  private resolveUsefulElements(
    strengthLevel: BaziEngineResult['dayMasterAnalysis']['strengthLevel'],
    elements: {
      dayElement: FiveElementName;
      resourceElement: FiveElementName;
      outputElement: FiveElementName;
      wealthElement: FiveElementName;
      officerElement: FiveElementName;
    },
  ) {
    if (strengthLevel === 'strong') {
      return [
        { name: elements.outputElement, reason: '日主偏强，先取泄秀以流通能量。' },
        { name: elements.wealthElement, reason: '日主有力时可承财，适合用事务和结果感来平衡。' },
        { name: elements.officerElement, reason: '适度约束可帮助偏强结构收束。' },
      ];
    }

    if (strengthLevel === 'weak') {
      return [
        { name: elements.resourceElement, reason: '日主偏弱，先取印星生扶。' },
        { name: elements.dayElement, reason: '同类比劫可补足行动和承压能力。' },
      ];
    }

    return [
      { name: elements.resourceElement, reason: '结构接近平衡，少量生扶可保持稳定。' },
      { name: elements.outputElement, reason: '适度输出有利于把能量转成行动。' },
    ];
  }

  private resolveAvoidElements(
    strengthLevel: BaziEngineResult['dayMasterAnalysis']['strengthLevel'],
    elements: {
      dayElement: FiveElementName;
      resourceElement: FiveElementName;
      outputElement: FiveElementName;
      wealthElement: FiveElementName;
      officerElement: FiveElementName;
    },
  ) {
    if (strengthLevel === 'strong') {
      return [
        { name: elements.resourceElement, reason: '继续生扶会让偏强结构更失衡。' },
        { name: elements.dayElement, reason: '同类过多时容易固执和内耗。' },
      ];
    }

    if (strengthLevel === 'weak') {
      return [
        { name: elements.wealthElement, reason: '日主偏弱时财星过重会增加消耗。' },
        { name: elements.officerElement, reason: '约束压力过强时容易先伤承载力。' },
        { name: elements.outputElement, reason: '过度输出会进一步泄身。' },
      ];
    }

    return [
      { name: elements.wealthElement, reason: '平衡结构不宜过度追逐外部结果。' },
      { name: elements.officerElement, reason: '过强约束会压低自然节奏。' },
    ];
  }

  private countTenGods(tenGods: string[]) {
    const counter = new Map<string, number>();

    for (const tenGod of tenGods.filter(Boolean)) {
      counter.set(tenGod, (counter.get(tenGod) ?? 0) + 1);
    }

    return [...counter.entries()].map(([name, count]) => ({ name, count }));
  }

  private resolveTenGod(dayStem: string, targetStem: string) {
    const dayElement = STEM_TO_ELEMENT[dayStem] as FiveElementName;
    const targetElement = STEM_TO_ELEMENT[targetStem] as FiveElementName;
    const samePolarity = STEM_POLARITY[dayStem] === STEM_POLARITY[targetStem];

    if (targetElement === dayElement) {
      return samePolarity ? '比肩' : '劫财';
    }

    if (GENERATES[dayElement] === targetElement) {
      return samePolarity ? '食神' : '伤官';
    }

    if (CONTROLS[dayElement] === targetElement) {
      return samePolarity ? '偏财' : '正财';
    }

    if (GENERATES[targetElement] === dayElement) {
      return samePolarity ? '偏印' : '正印';
    }

    return samePolarity ? '七杀' : '正官';
  }

  private resolveElementRelation(
    dayElement: FiveElementName,
    targetElement: FiveElementName,
  ): BaziEngineResult['annualFortunes'][number]['relation'] {
    if (targetElement === dayElement) {
      return 'peer';
    }

    if (GENERATES[targetElement] === dayElement) {
      return 'support';
    }

    if (GENERATES[dayElement] === targetElement) {
      return 'drain';
    }

    if (CONTROLS[dayElement] === targetElement) {
      return 'wealth';
    }

    return 'officer';
  }

  private findElementGenerating(element: FiveElementName) {
    return FIVE_ELEMENTS.find((item) => GENERATES[item] === element) ?? element;
  }

  private findElementControlling(element: FiveElementName) {
    return FIVE_ELEMENTS.find((item) => CONTROLS[item] === element) ?? element;
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
}
