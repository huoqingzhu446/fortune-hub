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

const SUPPORTED_REPORT_RECORD_TYPES = new Set(['emotion', 'personality']);

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

    if (
      !record ||
      !SUPPORTED_REPORT_RECORD_TYPES.has(record.recordType)
    ) {
      throw new NotFoundException('报告不存在或无权访问');
    }

    return record;
  }

  async buildReportPayload(record: UserRecordEntity, user: UserEntity) {
    if (!SUPPORTED_REPORT_RECORD_TYPES.has(record.recordType)) {
      throw new NotFoundException('报告不存在或无权访问');
    }

    const resultData = this.asRecord(record.resultData);
    const access = this.entitlementsService.buildFullReportAccess(record, user);
    const reportTemplate = await this.resolveReportTemplate(record.recordType);

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
      score: record.score ? Number(record.score) : null,
      level: record.resultLevel,
      completedAt: this.pickString(
        resultData.completedAt,
        this.pickString(resultData.generatedAt, record.createdAt.toISOString()),
      ),
      statusIndex,
      stateDimensions,
      sharePoster,
      baseSections,
      fullSections,
      lockedPreviewSections: [],
      access,
      offers: {
        vipProducts: [],
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

    return {
      label: '状态记录',
      value: this.clampPercent(this.pickNumber(record.score, 0)),
      maxValue: 100,
      levelLabel: this.pickString(record.resultLevel, '结果已生成'),
      rawLabel: '该类型报告已下线',
      formula: '保留历史记录，不再生成该类型报告',
      sourceLabel: '历史记录',
      updatedAt,
      notes: ['该类型报告已下线，不再提供详细解读。'],
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

    return [];
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

    return [
      {
        title: this.pickString(template.baseTitle, '基础版结果'),
        summary: this.pickString(
          resultData.summary,
          this.pickString(template.baseSummary, '这次状态报告已经生成。'),
        ),
        bullets: [
          this.pickString(
            resultData.primarySuggestion,
            '今天先围绕最重要的一件事安排行动。',
          ),
        ],
      },
      {
        title: this.pickString(
          template.secondaryBaseTitle,
          '当下适合做的调整',
        ),
        summary: this.pickString(
          template.secondaryBaseSummary,
          '先从今天能直接用上的两个锚点开始。',
        ),
        bullets: [
          this.pickString(resultData.supportSignal, '先照顾当前状态。'),
          this.pickString(resultData.summary, '本次结果已保存。'),
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

    return [
      {
        title: this.pickString(template.fullTitle, '状态补充说明'),
        summary: this.pickString(
          template.fullSummary,
          '完整版会把这次结果拆成更具体的行动建议。',
        ),
        bullets: this.pickStringArray(resultData.suggestions, []).slice(0, 3),
      },
      {
        title: this.pickString(template.fullSecondaryTitle, '现实行动建议'),
        summary: this.pickString(
          template.fullSecondarySummary,
          '这里会把状态结果翻译成更容易在现实中使用的判断线索。',
        ),
        bullets: [
          this.pickString(resultData.primarySuggestion, '先完成一个最小行动。'),
          this.pickString(resultData.supportSignal, '需要时优先寻求现实支持。'),
        ],
      },
      {
        title: this.pickString(template.fullTertiaryTitle, '节奏建议'),
        summary: this.pickString(
          template.fullTertiarySummary,
          '完整版会把今天能执行的建议整理成更清楚的顺序。',
        ),
        bullets: [
          '先把任务缩小到能开始的一步。',
          '复盘时只记录事实、感受和下一步。',
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
