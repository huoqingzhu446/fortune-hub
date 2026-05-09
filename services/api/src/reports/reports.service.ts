import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReportTemplateEntity } from '../database/entities/report-template.entity';
import { UserRecordEntity } from '../database/entities/user-record.entity';
import { UserEntity } from '../database/entities/user.entity';
import { EntitlementsService } from '../entitlements/entitlements.service';
import { MembershipService } from '../membership/membership.service';

type ReportSection = {
  title: string;
  summary: string;
  bullets: string[];
};

type StateTone = 'positive' | 'steady' | 'watch';

type StatusIndex = {
  label: string;
  value: number;
  maxValue: number;
  levelLabel: string;
  rawLabel: string;
  formula: string;
  sourceLabel: string;
  updatedAt: string;
  notes: string[];
};

type StateDimension = {
  key: string;
  label: string;
  value: number;
  maxValue: number;
  percent: number;
  tone: StateTone;
  summary: string;
  evidence: string;
};

type ReportResultRecord = Record<string, unknown>;

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(UserRecordEntity)
    private readonly userRecordRepository: Repository<UserRecordEntity>,
    @InjectRepository(ReportTemplateEntity)
    private readonly reportTemplateRepository: Repository<ReportTemplateEntity>,
    private readonly membershipService: MembershipService,
    private readonly entitlementsService: EntitlementsService,
  ) {}

  async getReport(recordId: string, user: UserEntity) {
    const record = await this.getOwnedRecordOrThrow(recordId, user.id);
    return {
      code: 0,
      message: 'ok',
      data: {
        report: await this.buildReportPayload(record, user),
      },
      timestamp: new Date().toISOString(),
    };
  }

  async getOwnedRecordOrThrow(recordId: string, userId: string) {
    const record = await this.userRecordRepository.findOne({
      where: {
        id: recordId,
        userId,
      },
    });

    if (!record) {
      throw new NotFoundException('报告不存在或无权访问');
    }

    return record;
  }

  async buildReportPayload(record: UserRecordEntity, user: UserEntity) {
    const resultData = this.asRecord(record.resultData);
    const access = this.entitlementsService.buildFullReportAccess(record, user);
    const isUnlocked = access.isFullReportUnlocked;
    const reportTemplate = await this.resolveReportTemplate(record.recordType);
    const products = await this.membershipService.listProducts();

    const sharePoster = this.resolveSharePoster(
      record,
      resultData,
      reportTemplate,
    );
    const baseSections = this.buildBaseSections(
      record,
      resultData,
      reportTemplate,
    );
    const fullSections = this.buildFullSections(
      record,
      resultData,
      reportTemplate,
    );
    const statusIndex = this.buildStatusIndex(record, resultData);
    const stateDimensions = this.buildStateDimensions(
      record,
      resultData,
      statusIndex,
    );

    return {
      recordId: record.id,
      recordType: record.recordType,
      sourceCode: record.sourceCode,
      title: record.resultTitle,
      subtitle: this.pickString(resultData.subtitle, ''),
      summary: this.pickString(resultData.summary, ''),
      score:
        record.recordType === 'bazi'
          ? null
          : record.score
            ? Number(record.score)
            : null,
      level: record.resultLevel,
      completedAt: this.pickString(
        resultData.completedAt,
        this.pickString(resultData.generatedAt, record.createdAt.toISOString()),
      ),
      statusIndex,
      stateDimensions,
      sharePoster,
      baseSections,
      fullSections: isUnlocked ? fullSections : [],
      lockedPreviewSections: !isUnlocked
        ? fullSections.slice(0, 2).map((item) => ({
            title: item.title,
            summary: item.summary,
          }))
        : [],
      access,
      offers: {
        vipProducts: products.map((product) =>
          this.membershipService.serializeProduct(product),
        ),
      },
    };
  }

  private buildStatusIndex(
    record: UserRecordEntity,
    resultData: ReportResultRecord,
  ): StatusIndex {
    const updatedAt = this.pickString(
      resultData.completedAt,
      this.pickString(resultData.generatedAt, record.createdAt.toISOString()),
    );

    if (record.recordType === 'emotion') {
      const range = this.resolveScoreRange(record, resultData);
      const pressurePercent = this.clampPercent(
        Math.round((range.raw / Math.max(range.max, 1)) * 100),
      );
      const value = this.clampPercent(100 - pressurePercent);

      return {
        label: '状态指数',
        value,
        maxValue: 100,
        levelLabel: this.resolveEmotionLevelLabel(record.resultLevel),
        rawLabel: `原始压力分 ${range.raw}/${range.max}`,
        formula: '100 - 原始压力分 ÷ 量表满分 × 100',
        sourceLabel: '最近 7 天情绪自检',
        updatedAt,
        notes: [
          '原始分越高，代表压力信号越密集。',
          '状态指数做反向换算，方便直接判断当前余量。',
          '状态标签由本套量表的阈值区间决定。',
        ],
      };
    }

    if (record.recordType === 'personality') {
      const score = this.clampPercent(
        this.pickNumber(record.score, this.pickNumber(resultData.score, 0)),
      );

      return {
        label: '画像清晰度',
        value: score,
        maxValue: 100,
        levelLabel: this.resolvePersonalityLevelLabel(record.resultLevel),
        rawLabel: `综合得分 ${score}/100`,
        formula: '答题得分 ÷ 可得分 × 100',
        sourceLabel: '性格测评答题结果',
        updatedAt,
        notes: [
          '每道题会把分数计入对应维度。',
          '维度占比来自各维度得分在总分中的权重。',
          '最高维度用于生成当前画像标题。',
        ],
      };
    }

    const fiveElements = this.resolveFiveElements(resultData);
    const total = fiveElements.reduce((sum, item) => sum + item.value, 0);
    const dominant =
      [...fiveElements].sort((left, right) => right.value - left.value)[0] ??
      null;
    const support =
      [...fiveElements].sort((left, right) => left.value - right.value)[0] ??
      null;
    const concentration = dominant
      ? this.clampPercent(Math.round((dominant.value / Math.max(total, 1)) * 100))
      : this.clampPercent(this.pickNumber(record.score, 0));

    return {
      label: '五行主轴',
      value: concentration,
      maxValue: 100,
      levelLabel: dominant
        ? `${dominant.name}主轴`
        : this.pickString(record.resultLevel, '结构已生成'),
      rawLabel: this.buildFiveElementRawLabel(dominant, support, fiveElements),
      formula: '按主轴、补位与整体倾向综合判断',
      sourceLabel: '出生信息排盘',
      updatedAt,
      notes: [
        '五行倾向由四柱天干地支映射后归纳。',
        '主轴代表当前更突出的表达方式。',
        '补位代表日常节奏里更需要照顾的一面。',
        '报告建议会结合日主、补位元素和实际节奏生成。',
      ],
    };
  }

  private buildStateDimensions(
    record: UserRecordEntity,
    resultData: ReportResultRecord,
    statusIndex: StatusIndex,
  ): StateDimension[] {
    if (record.recordType === 'emotion') {
      const range = this.resolveScoreRange(record, resultData);
      const pressurePercent = this.clampPercent(
        Math.round((range.raw / Math.max(range.max, 1)) * 100),
      );
      const riskPercent = this.resolveEmotionRiskPercent(record.resultLevel);
      const supportPercent = this.resolveEmotionSupportPercent(
        record.resultLevel,
      );

      return [
        {
          key: 'pressure',
          label: '压力信号',
          value: pressurePercent,
          maxValue: 100,
          percent: pressurePercent,
          tone: this.toneByPercent(pressurePercent, 'higherNeedsCare'),
          summary: '所有题目的原始分占比。',
          evidence: statusIndex.rawLabel,
        },
        {
          key: 'capacity',
          label: '恢复余量',
          value: statusIndex.value,
          maxValue: 100,
          percent: statusIndex.value,
          tone: this.toneByPercent(statusIndex.value, 'higherBetter'),
          summary: '由压力信号反向换算。',
          evidence: statusIndex.formula,
        },
        {
          key: 'rhythm',
          label: '节奏风险',
          value: riskPercent,
          maxValue: 100,
          percent: riskPercent,
          tone: this.toneByPercent(riskPercent, 'higherNeedsCare'),
          summary: '由当前阈值区间判断。',
          evidence: this.pickString(
            resultData.primarySuggestion,
            '先把今天的任务缩小到能完成的一步。',
          ),
        },
        {
          key: 'support',
          label: '支持需求',
          value: supportPercent,
          maxValue: 100,
          percent: supportPercent,
          tone: this.toneByPercent(supportPercent, 'higherNeedsCare'),
          summary: '用支持提醒判断是否需要把求助提前。',
          evidence: this.pickString(
            resultData.supportSignal,
            '如果状态持续影响生活，需要及时寻求现实支持。',
          ),
        },
      ];
    }

    if (record.recordType === 'personality') {
      const dimensions = Array.isArray(resultData.dimensionScores)
        ? resultData.dimensionScores.map((item) => this.asRecord(item))
        : [];

      return dimensions
        .map((item, index) => {
          const ratio = this.clampPercent(this.pickNumber(item.ratio, 0));
          const rawValue = this.pickNumber(item.value, 0);
          const label = this.pickString(item.label, `维度 ${index + 1}`);

          return {
            key: this.pickString(item.key, `dimension-${index + 1}`),
            label,
            value: ratio,
            maxValue: 100,
            percent: ratio,
            tone: index === 0 ? 'positive' : this.toneByPercent(ratio, 'higherBetter'),
            summary: index === 0 ? '当前最突出的自然倾向。' : '参与形成整体画像的辅助维度。',
            evidence: `原始维度分 ${rawValue}，占比 ${ratio}%`,
          };
        })
        .filter((item) => item.value > 0);
    }

    const fiveElements = this.resolveFiveElements(resultData);
    const total = fiveElements.reduce((sum, item) => sum + item.value, 0);

    return fiveElements.map((item, index) => {
      const percent = this.clampPercent(
        Math.round((item.value / Math.max(total, 1)) * 100),
      );

      return {
        key: item.name,
        label: item.name,
        value: percent,
        maxValue: 100,
        percent,
        tone: index === 0 ? 'positive' : this.toneByPercent(percent, 'higherBetter'),
        summary:
          index === 0
            ? '当前结构里更突出的主轴元素。'
            : '用于判断补位与节奏调和的元素倾向。',
        evidence: `五行倾向：${this.resolveFiveElementLevel(item, fiveElements)}`,
      };
    });
  }

  private buildBaseSections(
    record: UserRecordEntity,
    resultData: ReportResultRecord,
    template: Record<string, unknown>,
  ): ReportSection[] {
    if (record.recordType === 'personality') {
      const dominantDimension = this.asRecord(resultData.dominantDimension);
      const strengths = this.pickStringArray(resultData.strengths, []);
      return [
        {
          title: this.pickString(template.baseTitle, '基础版结果'),
          summary: this.pickString(
            resultData.summary,
            this.pickString(template.baseSummary, '这次测评已经生成基础结果。'),
          ),
          bullets: [
            dominantDimension.label
              ? `当前最突出的维度：${String(dominantDimension.label)}`
              : '当前维度结果已生成',
            record.score
              ? `综合得分：${Number(record.score)} 分`
              : '本次结果已记录',
          ],
        },
        {
          title: this.pickString(template.secondaryBaseTitle, '当前优势'),
          summary: this.pickString(
            template.secondaryBaseSummary,
            '先看最容易被你用上的两个优势点。',
          ),
          bullets: strengths.slice(0, 2),
        },
      ];
    }

    if (record.recordType === 'emotion') {
      const relaxSteps = this.pickStringArray(resultData.relaxSteps, []);
      return [
        {
          title: this.pickString(template.baseTitle, '基础版提醒'),
          summary: this.pickString(
            resultData.primarySuggestion,
            this.pickString(
              template.baseSummary,
              '先把今天最优先的一件事缩小到最容易完成的一步。',
            ),
          ),
          bullets: [
            this.pickString(
              resultData.supportSignal,
              '先留意最近的情绪起伏变化。',
            ),
          ],
        },
        {
          title: this.pickString(template.secondaryBaseTitle, '现在先做什么'),
          summary: this.pickString(
            template.secondaryBaseSummary,
            '先从最小、最温和的照顾动作开始。',
          ),
          bullets: relaxSteps.slice(0, 2),
        },
      ];
    }

    const practicalTips = this.asRecord(resultData.practicalTips);
    return [
      {
        title: this.pickString(template.baseTitle, '基础版排盘结论'),
        summary: this.pickString(
          resultData.summary,
          this.pickString(template.baseSummary, '这次八字轻解读已经生成。'),
        ),
        bullets: [
          this.pickString(
            practicalTips.dailyFocus,
            '今天先围绕最重要的一件事安排行动。',
          ),
        ],
      },
      {
        title: this.pickString(
          template.secondaryBaseTitle,
          '当下适合抓住的节奏',
        ),
        summary: this.pickString(
          template.secondaryBaseSummary,
          '先从今天能直接用上的两个锚点开始。',
        ),
        bullets: [
          this.pickString(practicalTips.favorableDirection, '方向提示待补充'),
          this.pickString(practicalTips.supportiveColor, '辅助颜色待补充'),
        ],
      },
    ];
  }

  private buildFullSections(
    record: UserRecordEntity,
    resultData: ReportResultRecord,
    template: Record<string, unknown>,
  ): ReportSection[] {
    if (record.recordType === 'personality') {
      const dimensionScores = Array.isArray(resultData.dimensionScores)
        ? resultData.dimensionScores.map((item) => this.asRecord(item))
        : [];

      return [
        {
          title: this.pickString(template.fullTitle, '维度拆解'),
          summary: this.pickString(
            template.fullSummary,
            '完整版会把你这次结果里每个维度的权重关系讲清楚。',
          ),
          bullets: dimensionScores.map((item) => {
            const label = this.pickString(item.label, '未命名维度');
            const ratio = Number(item.ratio ?? 0);
            return `${label}：${ratio}%`;
          }),
        },
        {
          title: this.pickString(template.fullSecondaryTitle, '关系与协作建议'),
          summary: this.pickString(
            template.fullSecondarySummary,
            '这部分会更偏向你在沟通、协作和自我推进时的具体打法。',
          ),
          bullets: [
            `先用“${this.pickString(this.asRecord(resultData.dominantDimension).label, '当前优势')}”去处理最需要起势的任务。`,
            '在需要稳定输出的时候，优先安排固定节奏和可复盘的小闭环。',
            '表达时先讲重点，再补情绪或案例，会更容易被接住。',
          ],
        },
        {
          title: this.pickString(template.fullTertiaryTitle, '一周行动建议'),
          summary: this.pickString(
            template.fullTertiarySummary,
            '完整版会把结果翻译成更容易执行的 3 条行动建议。',
          ),
          bullets: this.pickStringArray(resultData.suggestions, []).slice(0, 3),
        },
      ];
    }

    if (record.recordType === 'emotion') {
      return [
        {
          title: this.pickString(template.fullTitle, '状态深读'),
          summary: this.pickString(
            template.fullSummary,
            '完整版会把你这次结果更细地拆成风险识别、消耗来源和节奏建议。',
          ),
          bullets: [
            `当前状态标签：${this.pickString(resultData.riskLevel, 'watch')}`,
            this.pickString(
              resultData.supportSignal,
              '先观察最近一周最消耗你的事情。',
            ),
            '先把“恢复节奏”放在“再多做一点”之前，会更有帮助。',
          ],
        },
        {
          title: this.pickString(template.fullSecondaryTitle, '恢复计划'),
          summary: this.pickString(
            template.fullSecondarySummary,
            '这里会把建议拆成更容易立刻开始的动作清单。',
          ),
          bullets: [
            ...this.pickStringArray(resultData.relaxSteps, []).slice(0, 3),
            '如果连续两周都没有缓和，可以优先联系现实中的支持资源。',
          ],
        },
        {
          title: this.pickString(template.fullTertiaryTitle, '支持提醒'),
          summary: this.pickString(
            template.fullTertiarySummary,
            '完整版会把需要升级支持的信号讲得更直接，避免继续一个人硬撑。',
          ),
          bullets: [
            '当睡眠、食欲、学习或工作连续受到影响时，要主动升级支持。',
            '如果已经出现明显失控感或自伤想法，请优先联系急救、医院或当地危机干预热线。',
          ],
        },
      ];
    }

    const fiveElements = this.resolveFiveElements(resultData);
    const reading = this.asRecord(resultData.reading);

    return [
      {
        title: this.pickString(template.fullTitle, '五行结构'),
        summary: this.pickString(
          template.fullSummary,
          '完整版会把你当前主轴和补位元素拆成更具体的节奏建议。',
        ),
        bullets: fiveElements.map(
          (item) =>
            `${item.name}：${this.resolveFiveElementLevel(item, fiveElements)}`,
        ),
      },
      {
        title: this.pickString(template.fullSecondaryTitle, '事业与关系解读'),
        summary: this.pickString(
          template.fullSecondarySummary,
          '这里会把八字简化结果翻译成更容易在现实中使用的判断线索。',
        ),
        bullets: [
          this.pickString(reading.career, '事业节奏解读待补充。'),
          this.pickString(reading.relationship, '关系状态解读待补充。'),
        ],
      },
      {
        title: this.pickString(template.fullTertiaryTitle, '节奏建议'),
        summary: this.pickString(
          template.fullTertiarySummary,
          '完整版会把今天能执行的建议整理成更清楚的顺序。',
        ),
        bullets: [
          this.pickString(reading.rhythm, '当前节奏建议待补充。'),
          this.pickString(
            this.asRecord(resultData.practicalTips).dailyFocus,
            '日常焦点待补充。',
          ),
        ],
      },
    ];
  }

  private resolveSharePoster(
    record: UserRecordEntity,
    resultData: ReportResultRecord,
    template: Record<string, unknown>,
  ) {
    const sharePoster = this.asRecord(resultData.sharePoster);

    if (record.recordType !== 'bazi') {
      return {
        themeName: this.pickString(
          sharePoster.themeName,
          this.pickString(template.shareThemeName, 'fresh-mint'),
        ),
        title: this.pickString(
          sharePoster.title,
          this.pickString(template.shareTitle, record.resultTitle),
        ),
        subtitle: this.pickString(
          sharePoster.subtitle,
          this.pickString(resultData.subtitle, ''),
        ),
        accentText: this.pickString(
          sharePoster.accentText,
          this.pickString(template.shareAccentText, 'Fortune Hub'),
        ),
        footerText: this.pickString(
          sharePoster.footerText,
          this.pickString(
            template.shareFooterText,
            '今天也给自己留一点顺势推进的空间。',
          ),
        ),
      };
    }

    const baseProfile = this.asRecord(resultData.baseProfile);
    const dominantElement = this.asRecord(resultData.dominantElement);
    const dayMasterAnalysis = this.asRecord(resultData.dayMasterAnalysis);
    const dayStem = this.pickString(dayMasterAnalysis.dayStem, '');
    const dayElement = this.pickString(
      dayMasterAnalysis.dayElement,
      this.pickString(baseProfile.dayMaster, '未知'),
    );
    const dayMaster = dayStem ? `${dayStem}${dayElement}` : dayElement;

    return {
      themeName: this.pickString(
        sharePoster.themeName,
        this.pickString(template.shareThemeName, 'oriental-gold'),
      ),
      title: this.pickString(
        sharePoster.title,
        this.pickString(template.shareTitle, '我的八字命盘'),
      ),
      subtitle: this.pickString(
        sharePoster.subtitle,
        this.pickString(
          template.shareSubtitle,
          '根据出生日期与出生地生成的专属命理画像',
        ),
      ),
      accentText: this.pickString(
        sharePoster.accentText,
        `${dayMaster}日主 · ${this.pickString(dominantElement.name, '木')}旺`,
      ),
      footerText: this.pickString(
        sharePoster.footerText,
        this.pickString(template.shareFooterText, '知命而后，更懂自己'),
      ),
    };
  }

  private resolveScoreRange(
    record: UserRecordEntity,
    resultData: ReportResultRecord,
  ) {
    const rangeLabel = this.pickString(resultData.scoreRangeLabel, '');
    const rangeMatch = rangeLabel.match(
      /(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/,
    );
    const raw = rangeMatch
      ? Number(rangeMatch[1])
      : this.pickNumber(resultData.score, this.pickNumber(record.score, 0));
    const max = rangeMatch ? Number(rangeMatch[2]) : 15;

    return {
      raw: Number.isFinite(raw) ? raw : 0,
      max: Number.isFinite(max) && max > 0 ? max : 15,
    };
  }

  private resolveFiveElements(resultData: ReportResultRecord) {
    if (!Array.isArray(resultData.fiveElements)) {
      return [];
    }

    return resultData.fiveElements
      .map((item) => {
        const record = this.asRecord(item);
        return {
          name: this.pickString(record.name, ''),
          value: this.pickNumber(record.value, 0),
        };
      })
      .filter((item) => item.name && item.value > 0)
      .sort((left, right) => right.value - left.value);
  }

  private buildFiveElementRawLabel(
    dominant: { name: string; value: number } | null,
    support: { name: string; value: number } | null,
    fiveElements: Array<{ name: string; value: number }>,
  ) {
    if (!dominant) {
      return '五行结构已生成';
    }

    const dominantText = `${dominant.name}${this.resolveFiveElementLevel(dominant, fiveElements)}`;

    if (!support || support.name === dominant.name) {
      return dominantText;
    }

    return `${dominantText}，${support.name}${this.resolveFiveElementLevel(support, fiveElements)}`;
  }

  private resolveFiveElementLevel(
    item: { name: string; value: number },
    fiveElements: Array<{ name: string; value: number }>,
  ) {
    const values = fiveElements
      .map((element) => element.value)
      .filter((value) => Number.isFinite(value));

    if (!values.length || !Number.isFinite(item.value)) {
      return '适中';
    }

    const max = Math.max(...values);
    const min = Math.min(...values);

    if (max === min) {
      return '均衡';
    }

    if (item.value === max) {
      return '偏旺';
    }

    if (item.value === min) {
      return '待补';
    }

    const ratio = item.value / Math.max(max, 1);

    if (ratio >= 0.75) {
      return '有势';
    }

    if (ratio <= 0.45) {
      return '偏弱';
    }

    return '适中';
  }

  private resolveEmotionLevelLabel(level: string | null) {
    const mapping: Record<string, string> = {
      steady: '平稳观察',
      watch: '轻度紧绷',
      support: '需要支持',
      urgent: '优先求助',
    };

    return mapping[level ?? ''] ?? '状态已生成';
  }

  private resolvePersonalityLevelLabel(level: string | null) {
    const mapping: Record<string, string> = {
      high: '优势清晰',
      balanced: '相对均衡',
      gentle: '正在形成',
    };

    return mapping[level ?? ''] ?? '画像已生成';
  }

  private resolveEmotionRiskPercent(level: string | null) {
    const mapping: Record<string, number> = {
      steady: 22,
      watch: 48,
      support: 72,
      urgent: 92,
    };

    return mapping[level ?? ''] ?? 48;
  }

  private resolveEmotionSupportPercent(level: string | null) {
    const mapping: Record<string, number> = {
      steady: 18,
      watch: 36,
      support: 70,
      urgent: 94,
    };

    return mapping[level ?? ''] ?? 36;
  }

  private toneByPercent(
    value: number,
    mode: 'higherBetter' | 'higherNeedsCare',
  ): StateTone {
    if (mode === 'higherNeedsCare') {
      return value >= 68 ? 'watch' : value >= 38 ? 'steady' : 'positive';
    }

    return value >= 72 ? 'positive' : value >= 48 ? 'steady' : 'watch';
  }

  private async resolveReportTemplate(recordType: string) {
    const template = await this.reportTemplateRepository.findOne({
      where: {
        templateType: 'report_result',
        bizCode: recordType,
        status: 'published',
      },
      order: {
        sortOrder: 'ASC',
        updatedAt: 'DESC',
      },
    });

    return this.asRecord(template?.payloadJson);
  }

  private pickString(value: unknown, fallback: string) {
    return typeof value === 'string' && value.trim() ? value.trim() : fallback;
  }

  private pickStringArray(value: unknown, fallback: string[]) {
    if (!Array.isArray(value)) {
      return fallback;
    }

    const items = value.map((item) => String(item).trim()).filter(Boolean);
    return items.length ? items : fallback;
  }

  private pickNumber(value: unknown, fallback: number) {
    const nextValue =
      typeof value === 'number'
        ? value
        : typeof value === 'string'
          ? Number(value)
          : Number.NaN;

    return Number.isFinite(nextValue) ? nextValue : fallback;
  }

  private clampPercent(value: number) {
    if (!Number.isFinite(value)) {
      return 0;
    }

    return Math.max(0, Math.min(100, Math.round(value)));
  }

  private asRecord(value: unknown) {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  }
}
