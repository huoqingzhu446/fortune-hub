import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ImageGenerationService } from '../common/image-generation.service';
import { AppConfigEntity } from '../database/entities/app-config.entity';
import { AssessmentQuestionEntity } from '../database/entities/assessment-question.entity';
import { AssessmentTestConfigEntity } from '../database/entities/assessment-test-config.entity';
import { AuditLogEntity } from '../database/entities/audit-log.entity';
import { FortuneContentEntity } from '../database/entities/fortune-content.entity';
import { LuckyItemEntity } from '../database/entities/lucky-item.entity';
import { MembershipProductEntity } from '../database/entities/membership-product.entity';
import { OrderEntity } from '../database/entities/order.entity';
import { PushDeliveryLogEntity } from '../database/entities/push-delivery-log.entity';
import { ReportTemplateEntity } from '../database/entities/report-template.entity';
import { UserRecordEntity } from '../database/entities/user-record.entity';
import { UserEntity } from '../database/entities/user.entity';
import { EntitlementsService } from '../entitlements/entitlements.service';

export type ReleaseReadinessStatus = 'pass' | 'warn' | 'fail';

export interface ReleaseReadinessItem {
  key: string;
  title: string;
  status: ReleaseReadinessStatus;
  actual: number;
  expected: string;
  owner: string;
  action: string;
}

@Injectable()
export class AdminOpsService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
    @InjectRepository(UserRecordEntity)
    private readonly userRecordRepository: Repository<UserRecordEntity>,
    @InjectRepository(PushDeliveryLogEntity)
    private readonly pushDeliveryLogRepository: Repository<PushDeliveryLogEntity>,
    @InjectRepository(AuditLogEntity)
    private readonly auditLogRepository: Repository<AuditLogEntity>,
    @InjectRepository(AppConfigEntity)
    private readonly appConfigRepository: Repository<AppConfigEntity>,
    @InjectRepository(AssessmentTestConfigEntity)
    private readonly assessmentTestConfigRepository: Repository<AssessmentTestConfigEntity>,
    @InjectRepository(AssessmentQuestionEntity)
    private readonly assessmentQuestionRepository: Repository<AssessmentQuestionEntity>,
    @InjectRepository(FortuneContentEntity)
    private readonly fortuneContentRepository: Repository<FortuneContentEntity>,
    @InjectRepository(LuckyItemEntity)
    private readonly luckyItemRepository: Repository<LuckyItemEntity>,
    @InjectRepository(ReportTemplateEntity)
    private readonly reportTemplateRepository: Repository<ReportTemplateEntity>,
    @InjectRepository(MembershipProductEntity)
    private readonly membershipProductRepository: Repository<MembershipProductEntity>,
    private readonly entitlementsService: EntitlementsService,
    private readonly imageGenerationService: ImageGenerationService,
  ) {}

  async getReleaseReadiness() {
    const [
      personalityTests,
      personalityQuestions,
      emotionTests,
      emotionQuestions,
      fortuneContents,
      luckySignContents,
      luckyItems,
      reportTemplates,
      membershipProducts,
      settingsConfig,
      emotionComplianceConfig,
    ] = await Promise.all([
      this.assessmentTestConfigRepository.count({
        where: { category: 'personality', status: 'published' },
      }),
      this.assessmentQuestionRepository.count({
        where: { category: 'personality', status: 'published' },
      }),
      this.assessmentTestConfigRepository.count({
        where: { category: 'emotion', status: 'published' },
      }),
      this.assessmentQuestionRepository.count({
        where: { category: 'emotion', status: 'published' },
      }),
      this.fortuneContentRepository.count({
        where: { status: 'published' },
      }),
      this.fortuneContentRepository.count({
        where: { contentType: 'lucky_sign', status: 'published' },
      }),
      this.luckyItemRepository.count({
        where: { status: 'published' },
      }),
      this.reportTemplateRepository.count({
        where: { status: 'published' },
      }),
      this.membershipProductRepository.count({
        where: { status: 'published' },
      }),
      this.appConfigRepository.count({
        where: { namespace: 'settings', configKey: 'public', status: 'published' },
      }),
      this.appConfigRepository.count({
        where: { namespace: 'compliance', configKey: 'emotion_support', status: 'published' },
      }),
    ]);

    const items: ReleaseReadinessItem[] = [
      this.buildReadinessItem({
        key: 'assessment.personality.tests',
        title: '性格测评已发布量表',
        actual: personalityTests,
        minimum: 1,
        owner: '内容运营',
        action: '在题库后台发布至少 1 套性格测评量表',
      }),
      this.buildReadinessItem({
        key: 'assessment.personality.questions',
        title: '性格测评已发布题目',
        actual: personalityQuestions,
        minimum: 3,
        owner: '内容运营',
        action: '补齐并发布性格测评题目',
      }),
      this.buildReadinessItem({
        key: 'assessment.emotion.tests',
        title: '情绪自检已发布量表',
        actual: emotionTests,
        minimum: 1,
        owner: '内容运营',
        action: '在题库后台发布至少 1 套情绪自检量表',
      }),
      this.buildReadinessItem({
        key: 'assessment.emotion.questions',
        title: '情绪自检已发布题目',
        actual: emotionQuestions,
        minimum: 3,
        owner: '内容运营',
        action: '补齐并发布情绪自检题目',
      }),
      this.buildReadinessItem({
        key: 'content.fortune',
        title: '运势内容已发布',
        actual: fortuneContents,
        minimum: 1,
        owner: '内容运营',
        action: '发布生肖、星座、塔罗或首页探索内容',
      }),
      this.buildReadinessItem({
        key: 'content.lucky_sign',
        title: '每日幸运签内容已发布',
        actual: luckySignContents,
        minimum: 1,
        owner: '内容运营',
        action: '发布 lucky_sign 类型内容',
      }),
      this.buildReadinessItem({
        key: 'content.lucky_items',
        title: '幸运物料已发布',
        actual: luckyItems,
        minimum: 1,
        owner: '内容运营',
        action: '发布至少 1 条幸运物料',
      }),
      this.buildReadinessItem({
        key: 'report.templates',
        title: '报告模板已发布',
        actual: reportTemplates,
        minimum: 1,
        owner: '内容运营',
        action: '发布正式报告模板',
      }),
      this.buildReadinessItem({
        key: 'membership.products',
        title: '会员商品已发布',
        actual: membershipProducts,
        minimum: 1,
        owner: '运营/财务',
        action: '发布至少 1 个会员商品并确认支付价格',
      }),
      this.buildReadinessItem({
        key: 'config.settings_public',
        title: '公开设置配置已发布',
        actual: settingsConfig,
        minimum: 1,
        owner: '产品/法务',
        action: '发布 settings/public 配置，确认隐私版本与反馈分类',
        warnOnly: true,
      }),
      this.buildReadinessItem({
        key: 'config.emotion_support',
        title: '情绪自检合规配置已发布',
        actual: emotionComplianceConfig,
        minimum: 1,
        owner: '产品/法务',
        action: '发布 compliance/emotion_support 配置，确认热线与免责声明',
        warnOnly: true,
      }),
    ];
    const failCount = items.filter((item) => item.status === 'fail').length;
    const warnCount = items.filter((item) => item.status === 'warn').length;

    return this.buildEnvelope({
      status: failCount ? 'fail' : warnCount ? 'warn' : 'pass',
      summary: {
        total: items.length,
        pass: items.filter((item) => item.status === 'pass').length,
        warn: warnCount,
        fail: failCount,
      },
      items,
      checkedAt: new Date().toISOString(),
    });
  }

  async listUsers(query: {
    keyword?: string;
    vipStatus?: string;
    limit?: number;
  }) {
    const items = await this.userRepository.find({
      order: { updatedAt: 'DESC' },
      take: Math.min(200, Math.max(1, Number(query.limit) || 100)),
    });
    const keyword = query.keyword?.trim().toLowerCase() ?? '';

    return this.buildEnvelope({
      items: items
        .filter((item) =>
          query.vipStatus && query.vipStatus !== 'all'
            ? this.resolveVipStatus(item) === query.vipStatus
            : true,
        )
        .filter((item) =>
          keyword
            ? [
                item.id,
                item.openid ?? '',
                item.phone ?? '',
                item.nickname ?? '',
                item.zodiac ?? '',
                item.gender,
                item.lastLoginProvider ?? '',
              ]
                .join(' ')
                .toLowerCase()
                .includes(keyword)
            : true,
        )
        .map((item) => this.serializeUser(item)),
    });
  }

  async exportUsersCsv(query: {
    keyword?: string;
    vipStatus?: string;
  }) {
    const items = await this.userRepository.find({
      order: { updatedAt: 'DESC' },
      take: 1000,
    });
    const keyword = query.keyword?.trim().toLowerCase() ?? '';
    const filtered = items
      .filter((item) =>
        query.vipStatus && query.vipStatus !== 'all'
          ? this.resolveVipStatus(item) === query.vipStatus
          : true,
      )
      .filter((item) =>
        keyword
          ? [
              item.id,
              item.openid ?? '',
              item.phone ?? '',
              item.nickname ?? '',
              item.zodiac ?? '',
              item.gender,
              item.lastLoginProvider ?? '',
            ]
              .join(' ')
              .toLowerCase()
              .includes(keyword)
          : true,
      );

    const header = 'ID,昵称,手机号,星座,性别,会员状态,登录方式,最近登录,注册时间';
    const rows = filtered.map((user) =>
      [
        user.id,
        this.escapeCsv(user.nickname ?? ''),
        user.phone ?? '',
        user.zodiac ?? '',
        user.gender,
        user.vipStatus,
        user.lastLoginProvider ?? '',
        user.lastLoginAt?.toISOString() ?? '',
        user.createdAt.toISOString(),
      ].join(','),
    );

    return [header, ...rows].join('\n');
  }

  private escapeCsv(value: string) {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  async getUserDetail(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const [orders, records] = await Promise.all([
      this.orderRepository.find({
        where: { userId: user.id },
        order: { createdAt: 'DESC' },
        take: 20,
      }),
      this.userRecordRepository.find({
        where: { userId: user.id },
        order: { createdAt: 'DESC' },
        take: 20,
      }),
    ]);

    return this.buildEnvelope({
      user: this.serializeUser(user),
      orders: orders.map((item) => this.serializeOrder(item)),
      records: records.map((item) => ({
        id: item.id,
        recordType: item.recordType,
        sourceCode: item.sourceCode,
        resultTitle: item.resultTitle,
        resultLevel: item.resultLevel,
        score: item.score,
        isFullReportUnlocked: item.isFullReportUnlocked,
        unlockType: item.unlockType,
        createdAt: item.createdAt.toISOString(),
      })),
    });
  }

  async updateUserMembership(
    id: string,
    dto: { vipStatus: string; vipExpiredAt?: string | null },
    actorId: string | null,
  ) {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    user.vipStatus = dto.vipStatus === 'active' ? 'active' : 'inactive';
    user.vipExpiredAt =
      user.vipStatus === 'active' && dto.vipExpiredAt
        ? new Date(dto.vipExpiredAt)
        : null;
    const saved = await this.userRepository.save(user);

    await this.writeAudit({
      actorType: 'admin',
      actorId,
      action: 'user.membership.update',
      resourceType: 'user',
      resourceId: saved.id,
      payload: {
        vipStatus: saved.vipStatus,
        vipExpiredAt: saved.vipExpiredAt?.toISOString() ?? null,
      },
    });

    return this.buildEnvelope({
      item: this.serializeUser(saved),
    });
  }

  async listOrders(query: {
    status?: string;
    keyword?: string;
    limit?: number;
  }) {
    const items = await this.orderRepository.find({
      order: { createdAt: 'DESC' },
      take: Math.min(200, Math.max(1, Number(query.limit) || 100)),
    });
    const keyword = query.keyword?.trim().toLowerCase() ?? '';

    return this.buildEnvelope({
      items: items
        .filter((item) =>
          !query.status || query.status === 'all'
            ? true
            : item.status === query.status,
        )
        .filter((item) =>
          keyword
            ? [
                item.orderNo,
                item.productCode,
                item.productTitle,
                item.transactionNo ?? '',
              ]
                .join(' ')
                .toLowerCase()
                .includes(keyword)
            : true,
        )
        .map((item) => this.serializeOrder(item)),
    });
  }

  async listNotificationLogs(query: {
    scene?: string;
    status?: string;
    limit?: number;
  }) {
    const logs = await this.pushDeliveryLogRepository.find({
      order: {
        createdAt: 'DESC',
      },
      take: Math.min(200, Math.max(1, Number(query.limit) || 100)),
    });

    return this.buildEnvelope({
      items: logs
        .filter((item) =>
          !query.scene || query.scene === 'all'
            ? true
            : item.scene === query.scene,
        )
        .filter((item) =>
          !query.status || query.status === 'all'
            ? true
            : item.status === query.status,
        )
        .map((item) => ({
          id: item.id,
          userId: item.userId,
          scene: item.scene,
          templateId: item.templateId,
          status: item.status,
          retryCount: item.retryCount,
          errorMessage: item.errorMessage,
          sentAt: item.sentAt?.toISOString() ?? null,
          createdAt: item.createdAt.toISOString(),
        })),
    });
  }

  async listAuditLogs(query: {
    action?: string;
    resourceType?: string;
    limit?: number;
  }) {
    const logs = await this.auditLogRepository.find({
      order: {
        createdAt: 'DESC',
      },
      take: Math.min(200, Math.max(1, Number(query.limit) || 100)),
    });

    return this.buildEnvelope({
      items: logs
        .filter((item) => (!query.action ? true : item.action === query.action))
        .filter((item) =>
          !query.resourceType ? true : item.resourceType === query.resourceType,
        )
        .map((item) => ({
          id: item.id,
          actorType: item.actorType,
          actorId: item.actorId,
          action: item.action,
          resourceType: item.resourceType,
          resourceId: item.resourceId,
          payload: item.payloadJson ?? {},
          createdAt: item.createdAt.toISOString(),
        })),
    });
  }

  getZhipuImageStatus() {
    return this.buildEnvelope(
      this.imageGenerationService.getDiagnosticStatus(),
    );
  }

  async testZhipuImage(actorId: string | null, prompt?: string) {
    const asset = await this.imageGenerationService.generate({
      prompt:
        prompt?.trim() ||
        'fortune hub diagnostic image, soft gradient background, no text, no logo',
      size: this.imageGenerationService.getDiagnosticStatus().defaultSizes
        .diagnostic,
      purpose: '诊断',
    });

    await this.writeAudit({
      actorType: 'admin',
      actorId,
      action: 'zhipu_image.test',
      resourceType: 'integration',
      resourceId: 'zhipu-image',
      payload: {
        requestId: asset.requestId,
        providerImageUrl: asset.providerImageUrl,
      },
    });

    return this.buildEnvelope({
      item: {
        provider: asset.provider,
        model: asset.model,
        status: asset.status,
        requestId: asset.requestId,
        providerImageUrl: asset.providerImageUrl,
        imageDataUrl: asset.imageDataUrl,
      },
    });
  }

  async writeAudit(input: {
    actorType?: string;
    actorId?: string | null;
    action: string;
    resourceType: string;
    resourceId?: string | null;
    payload?: Record<string, unknown> | null;
  }) {
    await this.auditLogRepository.save(
      this.auditLogRepository.create({
        actorType: input.actorType ?? 'admin',
        actorId: input.actorId ?? null,
        action: input.action,
        resourceType: input.resourceType,
        resourceId: input.resourceId ?? null,
        payloadJson: input.payload ?? null,
      }),
    );
  }

  private resolveVipStatus(user: UserEntity) {
    return this.entitlementsService.isMembershipActive(user) ? 'active' : 'inactive';
  }

  private serializeUser(user: UserEntity) {
    return {
      id: user.id,
      openid: user.openid,
      phoneMasked: this.maskPhone(user.phone),
      phoneVerifiedAt: user.phoneVerifiedAt?.toISOString() ?? null,
      lastLoginProvider: user.lastLoginProvider,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      gender: user.gender,
      birthday: user.birthday,
      birthTime: user.birthTime,
      birthPlace: this.resolveUserBirthPlace(user),
      zodiac: user.zodiac,
      vipStatus: this.resolveVipStatus(user),
      vipExpiredAt: user.vipExpiredAt?.toISOString() ?? null,
      lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  private resolveUserBirthPlace(user: UserEntity) {
    const preferences = user.preferencesJson ?? {};
    const candidates = [
      preferences.birthPlace,
      preferences.birthCity,
      preferences.city,
    ];

    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.trim()) {
        return candidate.trim();
      }
    }

    return null;
  }

  private maskPhone(phone?: string | null) {
    if (!phone) {
      return null;
    }

    return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
  }

  private serializeOrder(order: OrderEntity) {
    return {
      id: order.id,
      userId: order.userId,
      orderNo: order.orderNo,
      productCode: order.productCode,
      productTitle: order.productTitle,
      amountFen: order.amountFen,
      amountLabel: `¥${(order.amountFen / 100).toFixed(2)}`,
      orderType: order.orderType,
      status: order.status,
      transactionNo: order.transactionNo,
      paidAt: order.paidAt?.toISOString() ?? null,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    };
  }

  private buildReadinessItem(input: {
    key: string;
    title: string;
    actual: number;
    minimum: number;
    owner: string;
    action: string;
    warnOnly?: boolean;
  }): ReleaseReadinessItem {
    const passed = input.actual >= input.minimum;

    return {
      key: input.key,
      title: input.title,
      status: passed ? 'pass' : input.warnOnly ? 'warn' : 'fail',
      actual: input.actual,
      expected: `>= ${input.minimum}`,
      owner: input.owner,
      action: passed ? '无需处理' : input.action,
    };
  }

  private buildEnvelope<TData>(data: TData) {
    return {
      code: 0,
      message: 'ok',
      data,
      timestamp: new Date().toISOString(),
    };
  }
}
