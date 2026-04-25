import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogEntity } from '../database/entities/audit-log.entity';
import { OrderEntity } from '../database/entities/order.entity';
import { PushDeliveryLogEntity } from '../database/entities/push-delivery-log.entity';
import { UserRecordEntity } from '../database/entities/user-record.entity';
import { UserEntity } from '../database/entities/user.entity';
import { MembershipService } from '../membership/membership.service';

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
    private readonly membershipService: MembershipService,
  ) {}

  async listUsers(query: { keyword?: string; vipStatus?: string; limit?: number }) {
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
                item.openid,
                item.nickname ?? '',
                item.zodiac ?? '',
                item.gender,
              ]
                .join(' ')
                .toLowerCase()
                .includes(keyword)
            : true,
        )
        .map((item) => this.serializeUser(item)),
    });
  }

  async listOrders(query: { status?: string; keyword?: string; limit?: number }) {
    const items = await this.orderRepository.find({
      order: { createdAt: 'DESC' },
      take: Math.min(200, Math.max(1, Number(query.limit) || 100)),
    });
    const keyword = query.keyword?.trim().toLowerCase() ?? '';

    return this.buildEnvelope({
      items: items
        .filter((item) => (!query.status || query.status === 'all' ? true : item.status === query.status))
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

  async listAdUnlocks(query: { limit?: number }) {
    const records = await this.userRecordRepository.find({
      where: {
        unlockType: 'ad_reward',
      },
      order: {
        updatedAt: 'DESC',
      },
      take: Math.min(200, Math.max(1, Number(query.limit) || 100)),
    });

    return this.buildEnvelope({
      items: records.map((record) => ({
        id: record.id,
        userId: record.userId,
        recordType: record.recordType,
        sourceCode: record.sourceCode,
        resultTitle: record.resultTitle,
        unlockType: record.unlockType,
        unlockedAt: record.updatedAt.toISOString(),
      })),
    });
  }

  async listNotificationLogs(query: { scene?: string; status?: string; limit?: number }) {
    const logs = await this.pushDeliveryLogRepository.find({
      order: {
        createdAt: 'DESC',
      },
      take: Math.min(200, Math.max(1, Number(query.limit) || 100)),
    });

    return this.buildEnvelope({
      items: logs
        .filter((item) => (!query.scene || query.scene === 'all' ? true : item.scene === query.scene))
        .filter((item) => (!query.status || query.status === 'all' ? true : item.status === query.status))
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

  async listAuditLogs(query: { action?: string; resourceType?: string; limit?: number }) {
    const logs = await this.auditLogRepository.find({
      order: {
        createdAt: 'DESC',
      },
      take: Math.min(200, Math.max(1, Number(query.limit) || 100)),
    });

    return this.buildEnvelope({
      items: logs
        .filter((item) => (!query.action ? true : item.action === query.action))
        .filter((item) => (!query.resourceType ? true : item.resourceType === query.resourceType))
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
    return this.membershipService.isVipActive(user) ? 'active' : 'inactive';
  }

  private serializeUser(user: UserEntity) {
    return {
      id: user.id,
      openid: user.openid,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      gender: user.gender,
      birthday: user.birthday,
      birthTime: user.birthTime,
      zodiac: user.zodiac,
      vipStatus: this.resolveVipStatus(user),
      vipExpiredAt: user.vipExpiredAt?.toISOString() ?? null,
      lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
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

  private buildEnvelope<TData>(data: TData) {
    return {
      code: 0,
      message: 'ok',
      data,
      timestamp: new Date().toISOString(),
    };
  }
}
