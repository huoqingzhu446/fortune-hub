import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdConfigEntity } from '../database/entities/ad-config.entity';
import { ReportTemplateEntity } from '../database/entities/report-template.entity';
import { UserRecordEntity } from '../database/entities/user-record.entity';
import { UserEntity } from '../database/entities/user.entity';
import { MembershipService } from '../membership/membership.service';
import { DEFAULT_AD_CONFIGS } from '../commerce/commerce.defaults';

type ReportSection = {
  title: string;
  summary: string;
  bullets: string[];
};

type ReportResultRecord = Record<string, unknown>;

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(UserRecordEntity)
    private readonly userRecordRepository: Repository<UserRecordEntity>,
    @InjectRepository(AdConfigEntity)
    private readonly adConfigRepository: Repository<AdConfigEntity>,
    @InjectRepository(ReportTemplateEntity)
    private readonly reportTemplateRepository: Repository<ReportTemplateEntity>,
    private readonly membershipService: MembershipService,
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
    await this.ensureDefaultAdConfigs();
    const resultData = this.asRecord(record.resultData);
    const hasVipAccess = this.membershipService.isVipActive(user);
    const isUnlocked = record.isFullReportUnlocked || hasVipAccess;
    const reportTemplate = await this.resolveReportTemplate(record.recordType);
    const [rewardConfig, products] = await Promise.all([
      this.adConfigRepository.findOne({
        where: {
          slotCode: DEFAULT_AD_CONFIGS[0].slotCode,
        },
      }),
      this.membershipService.listProducts(),
    ]);

    const sharePoster = this.resolveSharePoster(record, resultData, reportTemplate);
    const baseSections = this.buildBaseSections(record, resultData, reportTemplate);
    const fullSections = this.buildFullSections(record, resultData, reportTemplate);

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
      sharePoster,
      baseSections,
      fullSections: isUnlocked ? fullSections : [],
      lockedPreviewSections: !isUnlocked
        ? fullSections.slice(0, 2).map((item) => ({
            title: item.title,
            summary: item.summary,
          }))
        : [],
      access: {
        isFullReportUnlocked: isUnlocked,
        persistedUnlocked: record.isFullReportUnlocked,
        unlockType: isUnlocked ? record.unlockType ?? (hasVipAccess ? 'vip' : 'free') : null,
        hasVipAccess,
        canUnlockByAd: !hasVipAccess && Boolean(rewardConfig?.enabled),
        requiresLogin: false,
      },
      offers: {
        adSlotCode: !hasVipAccess && rewardConfig?.enabled ? rewardConfig.slotCode : null,
        adTitle: rewardConfig?.enabled ? rewardConfig.title : null,
        vipProducts: products.map((product) =>
          this.membershipService.serializeProduct(product),
        ),
      },
    };
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
          summary: this.pickString(resultData.summary, this.pickString(template.baseSummary, '这次测评已经生成基础结果。')),
          bullets: [
            dominantDimension.label
              ? `当前最突出的维度：${String(dominantDimension.label)}`
              : '当前维度结果已生成',
            record.score ? `综合得分：${Number(record.score)} 分` : '本次结果已记录',
          ],
        },
        {
          title: this.pickString(template.secondaryBaseTitle, '当前优势'),
          summary: this.pickString(template.secondaryBaseSummary, '先看最容易被你用上的两个优势点。'),
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
            this.pickString(template.baseSummary, '先把今天最优先的一件事缩小到最容易完成的一步。'),
          ),
          bullets: [
            this.pickString(resultData.supportSignal, '先留意最近的情绪起伏变化。'),
          ],
        },
        {
          title: this.pickString(template.secondaryBaseTitle, '现在先做什么'),
          summary: this.pickString(template.secondaryBaseSummary, '先从最小、最温和的照顾动作开始。'),
          bullets: relaxSteps.slice(0, 2),
        },
      ];
    }

    const practicalTips = this.asRecord(resultData.practicalTips);
    return [
      {
        title: this.pickString(template.baseTitle, '基础版排盘结论'),
        summary: this.pickString(resultData.summary, this.pickString(template.baseSummary, '这次八字轻解读已经生成。')),
        bullets: [
          this.pickString(practicalTips.dailyFocus, '今天先围绕最重要的一件事安排行动。'),
        ],
      },
      {
        title: this.pickString(template.secondaryBaseTitle, '当下适合抓住的节奏'),
        summary: this.pickString(template.secondaryBaseSummary, '先从今天能直接用上的两个锚点开始。'),
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
          summary: this.pickString(template.fullSummary, '完整版会把你这次结果里每个维度的权重关系讲清楚。'),
          bullets: dimensionScores.map((item) => {
            const label = this.pickString(item.label, '未命名维度');
            const ratio = Number(item.ratio ?? 0);
            return `${label}：${ratio}%`;
          }),
        },
        {
          title: this.pickString(template.fullSecondaryTitle, '关系与协作建议'),
          summary: this.pickString(template.fullSecondarySummary, '这部分会更偏向你在沟通、协作和自我推进时的具体打法。'),
          bullets: [
            `先用“${this.pickString(this.asRecord(resultData.dominantDimension).label, '当前优势')}”去处理最需要起势的任务。`,
            '在需要稳定输出的时候，优先安排固定节奏和可复盘的小闭环。',
            '表达时先讲重点，再补情绪或案例，会更容易被接住。',
          ],
        },
        {
          title: this.pickString(template.fullTertiaryTitle, '一周行动建议'),
          summary: this.pickString(template.fullTertiarySummary, '完整版会把结果翻译成更容易执行的 3 条行动建议。'),
          bullets: this.pickStringArray(resultData.suggestions, []).slice(0, 3),
        },
      ];
    }

    if (record.recordType === 'emotion') {
      return [
        {
          title: this.pickString(template.fullTitle, '状态深读'),
          summary: this.pickString(template.fullSummary, '完整版会把你这次结果更细地拆成风险识别、消耗来源和节奏建议。'),
          bullets: [
            `当前状态标签：${this.pickString(resultData.riskLevel, 'watch')}`,
            this.pickString(resultData.supportSignal, '先观察最近一周最消耗你的事情。'),
            '先把“恢复节奏”放在“再多做一点”之前，会更有帮助。',
          ],
        },
        {
          title: this.pickString(template.fullSecondaryTitle, '恢复计划'),
          summary: this.pickString(template.fullSecondarySummary, '这里会把建议拆成更容易立刻开始的动作清单。'),
          bullets: [
            ...this.pickStringArray(resultData.relaxSteps, []).slice(0, 3),
            '如果连续两周都没有缓和，可以优先联系现实中的支持资源。',
          ],
        },
        {
          title: this.pickString(template.fullTertiaryTitle, '支持提醒'),
          summary: this.pickString(template.fullTertiarySummary, '完整版会把需要升级支持的信号讲得更直接，避免继续一个人硬撑。'),
          bullets: [
            '当睡眠、食欲、学习或工作连续受到影响时，要主动升级支持。',
            '如果已经出现明显失控感或自伤想法，请优先联系急救、医院或当地危机干预热线。',
          ],
        },
      ];
    }

    const fiveElements = Array.isArray(resultData.fiveElements)
      ? resultData.fiveElements.map((item) => this.asRecord(item))
      : [];
    const reading = this.asRecord(resultData.reading);

    return [
      {
        title: this.pickString(template.fullTitle, '五行结构'),
        summary: this.pickString(template.fullSummary, '完整版会把你当前主轴和补位元素拆成更具体的节奏建议。'),
        bullets: fiveElements.map((item) => {
          const name = this.pickString(item.name, '未知');
          const value = Number(item.value ?? 0);
          return `${name}：${value}`;
        }),
      },
      {
        title: this.pickString(template.fullSecondaryTitle, '事业与关系解读'),
        summary: this.pickString(template.fullSecondarySummary, '这里会把八字简化结果翻译成更容易在现实中使用的判断线索。'),
        bullets: [
          this.pickString(reading.career, '事业节奏解读待补充。'),
          this.pickString(reading.relationship, '关系状态解读待补充。'),
        ],
      },
      {
        title: this.pickString(template.fullTertiaryTitle, '节奏建议'),
        summary: this.pickString(template.fullTertiarySummary, '完整版会把今天能执行的建议整理成更清楚的顺序。'),
        bullets: [
          this.pickString(reading.rhythm, '当前节奏建议待补充。'),
          this.pickString(this.asRecord(resultData.practicalTips).dailyFocus, '日常焦点待补充。'),
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
        themeName: this.pickString(sharePoster.themeName, this.pickString(template.shareThemeName, 'fresh-mint')),
        title: this.pickString(sharePoster.title, this.pickString(template.shareTitle, record.resultTitle)),
        subtitle: this.pickString(sharePoster.subtitle, this.pickString(resultData.subtitle, '')),
        accentText: this.pickString(sharePoster.accentText, this.pickString(template.shareAccentText, 'Fortune Hub')),
        footerText: this.pickString(sharePoster.footerText, this.pickString(template.shareFooterText, '今天也给自己留一点顺势推进的空间。')),
      };
    }

    const baseProfile = this.asRecord(resultData.baseProfile);
    const dominantElement = this.asRecord(resultData.dominantElement);

      return {
      themeName: this.pickString(sharePoster.themeName, this.pickString(template.shareThemeName, 'oriental-gold')),
      title: this.pickString(sharePoster.title, this.pickString(template.shareTitle, record.resultTitle)),
      subtitle: this.pickString(
        sharePoster.subtitle,
        this.pickString(resultData.subtitle, this.pickString(template.shareSubtitle, '我刚完成了一次八字轻解读。')),
      ),
      accentText: this.pickString(
        sharePoster.accentText,
        `${this.pickString(baseProfile.dayMaster, '未知')}日主 · ${this.pickString(
          dominantElement.name,
          '木',
        )}元素主轴`,
      ),
      footerText: this.pickString(
        sharePoster.footerText,
        this.pickString(template.shareFooterText, '简化排盘仅用于内容体验与自我观察。'),
      ),
    };
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

  private asRecord(value: unknown) {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  }

  private async ensureDefaultAdConfigs() {
    const count = await this.adConfigRepository.count();

    if (count > 0) {
      return;
    }

    await this.adConfigRepository.save(
      DEFAULT_AD_CONFIGS.map((item) =>
        this.adConfigRepository.create({
          ...item,
          configJson: { ...item.configJson },
        }),
      ),
    );
  }
}
