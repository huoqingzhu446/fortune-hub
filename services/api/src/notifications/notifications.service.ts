import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, LessThanOrEqual, Repository } from 'typeorm';
import { AuditService } from '../common/audit.service';
import { PushDeliveryLogEntity } from '../database/entities/push-delivery-log.entity';
import { PushSubscriptionEntity } from '../database/entities/push-subscription.entity';
import { UserEntity } from '../database/entities/user.entity';
import { SubscribeNotificationDto } from './dto/subscribe-notification.dto';
import { UnsubscribeNotificationDto } from './dto/unsubscribe-notification.dto';

type UserPreferences = {
  dailyReminderEnabled?: boolean;
  luckyPushEnabled?: boolean;
  quietModeEnabled?: boolean;
};

@Injectable()
export class NotificationsService implements OnModuleInit, OnModuleDestroy {
  private retryWorkerTimer: NodeJS.Timeout | null = null;
  private dailyWorkerTimer: NodeJS.Timeout | null = null;
  private cachedWechatAccessToken: {
    token: string;
    expireAt: number;
  } | null = null;

  constructor(
    @InjectRepository(PushSubscriptionEntity)
    private readonly pushSubscriptionRepository: Repository<PushSubscriptionEntity>,
    @InjectRepository(PushDeliveryLogEntity)
    private readonly pushDeliveryLogRepository: Repository<PushDeliveryLogEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
  ) {}

  onModuleInit() {
    if (this.configService.get<string>('NOTIFICATION_WORKER_ENABLED', 'false') !== 'true') {
      return;
    }

    const intervalMs = Math.max(
      60_000,
      Number(this.configService.get<string>('NOTIFICATION_WORKER_INTERVAL_MS', '300000')),
    );
    this.retryWorkerTimer = setInterval(() => {
      void this.processDueRetries().catch((error) => {
        console.warn('notification retry worker failed', error);
      });
    }, intervalMs);

    if (this.configService.get<string>('NOTIFICATION_DAILY_WORKER_ENABLED', 'false') === 'true') {
      const dailyIntervalMs = Math.max(
        60_000,
        Number(this.configService.get<string>('NOTIFICATION_DAILY_INTERVAL_MS', '86400000')),
      );
      this.dailyWorkerTimer = setInterval(() => {
        void this.runScheduledDaily().catch((error) => {
          console.warn('notification daily worker failed', error);
        });
      }, dailyIntervalMs);
    }
  }

  onModuleDestroy() {
    if (this.retryWorkerTimer) {
      clearInterval(this.retryWorkerTimer);
    }

    if (this.dailyWorkerTimer) {
      clearInterval(this.dailyWorkerTimer);
    }
  }

  async subscribe(user: UserEntity, dto: SubscribeNotificationDto) {
    const now = new Date();
    const expireAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const templateIds = [...new Set(dto.templateIds.map((item) => item.trim()).filter(Boolean))];

    const items = [];
    for (const templateId of templateIds) {
      let item = await this.pushSubscriptionRepository.findOne({
        where: {
          userId: user.id,
          scene: dto.scene,
          templateId,
        },
      });

      item =
        item ??
        this.pushSubscriptionRepository.create({
          userId: user.id,
          scene: dto.scene,
          templateId,
        });

      item.status = 'active';
      item.lastSubscribedAt = now;
      item.expireAt = expireAt;
      item.cancelledAt = null;
      item.extraJson = dto.extra ?? null;

      items.push(await this.pushSubscriptionRepository.save(item));
    }

    return this.buildEnvelope({
      items: items.map((item) => this.serializeSubscription(item)),
    });
  }

  async unsubscribe(user: UserEntity, dto: UnsubscribeNotificationDto) {
    const subscriptions = await this.pushSubscriptionRepository.find({
      where: {
        userId: user.id,
      },
      take: 100,
    });
    const templateIds = new Set((dto.templateIds ?? []).map((item) => item.trim()).filter(Boolean));
    const now = new Date();
    const items = [];

    for (const item of subscriptions) {
      if (dto.scene && item.scene !== dto.scene) {
        continue;
      }

      if (templateIds.size && !templateIds.has(item.templateId)) {
        continue;
      }

      item.status = 'cancelled';
      item.cancelledAt = now;
      items.push(await this.pushSubscriptionRepository.save(item));
    }

    return this.buildEnvelope({
      cancelled: items.length,
      items: items.map((item) => this.serializeSubscription(item)),
    });
  }

  async getMySubscriptions(user: UserEntity) {
    const items = await this.pushSubscriptionRepository.find({
      where: {
        userId: user.id,
      },
      order: {
        lastSubscribedAt: 'DESC',
      },
      take: 50,
    });

    return this.buildEnvelope({
      items: items.map((item) => this.serializeSubscription(item)),
    });
  }

  async queueDailyNotifications(scene = 'daily_reminder') {
    await this.cleanupExpiredSubscriptions();
    const subscriptions = await this.pushSubscriptionRepository.find({
      where: {
        scene,
        status: 'active',
      },
      order: {
        lastSubscribedAt: 'DESC',
      },
      take: 500,
    });
    const userIds = [...new Set(subscriptions.map((item) => item.userId))];
    const users = userIds.length
      ? await this.userRepository.find({ where: userIds.map((id) => ({ id })) })
      : [];
    const usersById = new Map(users.map((user) => [user.id, user]));
    const queued: PushDeliveryLogEntity[] = [];
    const now = new Date();

    for (const subscription of subscriptions) {
      if (subscription.expireAt && subscription.expireAt <= now) {
        continue;
      }

      const user = usersById.get(subscription.userId);

      if (!user || !this.shouldSendToUser(user, scene)) {
        continue;
      }

      const log = await this.pushDeliveryLogRepository.save(
        this.pushDeliveryLogRepository.create({
          userId: subscription.userId,
          scene,
          templateId: subscription.templateId,
          status: 'queued',
          payloadJson: this.buildTemplatePayload(user, scene),
          retryCount: 0,
          nextRetryAt: new Date(),
        }),
      );
      queued.push(log);
    }

    return this.buildEnvelope({
      queued: queued.length,
      items: queued.map((item) => this.serializeDeliveryLog(item)),
    });
  }

  async runNow(scene = 'daily_reminder') {
    await this.queueDailyNotifications(scene);
    return this.processDueRetries();
  }

  async runScheduledDaily() {
    const scenes = this.configService
      .get<string>('NOTIFICATION_DAILY_SCENES', 'daily_reminder,lucky_push')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    for (const scene of scenes) {
      await this.queueDailyNotifications(scene);
    }

    return this.processDueRetries();
  }

  async cleanupExpiredSubscriptions() {
    const now = new Date();
    const items = await this.pushSubscriptionRepository.find({
      where: {
        status: 'active',
        expireAt: LessThanOrEqual(now),
      },
      take: 500,
    });

    for (const item of items) {
      item.status = 'expired';
      await this.pushSubscriptionRepository.save(item);
    }

    return this.buildEnvelope({
      expired: items.length,
    });
  }

  async processDueRetries(limit = 100) {
    const now = new Date();
    const logs = await this.pushDeliveryLogRepository.find({
      where: [
        {
          status: 'queued',
          nextRetryAt: LessThanOrEqual(now),
        },
        {
          status: 'retry',
          nextRetryAt: LessThanOrEqual(now),
        },
        {
          status: 'queued',
          nextRetryAt: IsNull(),
        },
      ],
      order: {
        createdAt: 'ASC',
      },
      take: limit,
    });
    const sent: PushDeliveryLogEntity[] = [];
    const failed: PushDeliveryLogEntity[] = [];

    for (const log of logs) {
      try {
        log.lastAttemptAt = new Date();
        await this.sendWechatSubscribeMessage(log);
        log.status = 'sent';
        log.errorMessage = null;
        log.sentAt = new Date();
        log.nextRetryAt = null;
        sent.push(await this.pushDeliveryLogRepository.save(log));
      } catch (error) {
        log.lastAttemptAt = new Date();
        log.retryCount += 1;
        log.status = log.retryCount >= 3 ? 'failed' : 'retry';
        log.errorMessage = error instanceof Error ? error.message : '订阅消息发送失败';
        log.nextRetryAt =
          log.status === 'retry'
            ? new Date(Date.now() + Math.min(60, log.retryCount * 10) * 60 * 1000)
            : null;
        failed.push(await this.pushDeliveryLogRepository.save(log));
      }
    }

    return this.buildEnvelope({
      sent: sent.length,
      failed: failed.length,
      items: [...sent, ...failed].map((item) => this.serializeDeliveryLog(item)),
    });
  }

  async listDeliveryLogs(query: { scene?: string; status?: string; limit?: number }) {
    const logs = await this.pushDeliveryLogRepository.find({
      order: { createdAt: 'DESC' },
      take: Math.min(200, Math.max(1, Number(query.limit) || 100)),
    });

    return this.buildEnvelope({
      items: logs
        .filter((item) => (!query.scene || query.scene === 'all' ? true : item.scene === query.scene))
        .filter((item) => (!query.status || query.status === 'all' ? true : item.status === query.status))
        .map((item) => this.serializeDeliveryLog(item)),
    });
  }

  async auditAdminRun(input: { actorId?: string | null; action: string; scene?: string }) {
    await this.auditService.write({
      actorType: 'admin',
      actorId: input.actorId ?? null,
      action: input.action,
      resourceType: 'notification',
      resourceId: input.scene ?? null,
      payload: {
        scene: input.scene ?? null,
      },
    });
  }

  private shouldSendToUser(user: UserEntity, scene: string) {
    const preferences = (user.preferencesJson ?? {}) as UserPreferences;

    if (!user.openid) {
      return false;
    }

    if (scene === 'daily_reminder' && preferences.dailyReminderEnabled === false) {
      return false;
    }

    if (scene === 'lucky_push' && preferences.luckyPushEnabled === false) {
      return false;
    }

    if (preferences.quietModeEnabled && this.isQuietHour()) {
      return false;
    }

    return true;
  }

  private isQuietHour() {
    const hour = new Date().getHours();
    return hour >= 22 || hour < 8;
  }

  private buildTemplatePayload(user: UserEntity, scene: string) {
    const title = scene === 'lucky_push' ? '今日幸运物已更新' : '今日状态提醒已更新';
    const guidance = user.nickname
      ? `${user.nickname}，今天也给自己留一点稳定节奏。`
      : '今天也给自己留一点稳定节奏。';

    return {
      touser: user.openid,
      page: '/pages/index/index',
      miniprogram_state: this.configService.get<string>('WECHAT_SUBSCRIBE_STATE', 'formal'),
      data: {
        thing1: { value: title.slice(0, 20) },
        thing2: { value: guidance.slice(0, 20) },
        time3: { value: this.formatTemplateTime(new Date()) },
      },
    };
  }

  private async sendWechatSubscribeMessage(log: PushDeliveryLogEntity) {
    const appId = this.configService.get<string>('WECHAT_APP_ID');
    const appSecret = this.configService.get<string>('WECHAT_APP_SECRET');
    const payload = {
      ...(log.payloadJson ?? {}),
      template_id: log.templateId,
    };

    if (!appId || !appSecret) {
      if (this.configService.get<string>('NOTIFICATION_ALLOW_MOCK', 'true') === 'true') {
        return;
      }

      throw new Error('未配置微信订阅消息密钥');
    }

    const accessToken = await this.getWechatAccessToken(appId, appSecret);
    const response = await fetch(
      `https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${encodeURIComponent(
        accessToken,
      )}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      },
    );
    const result = (await response.json()) as { errcode?: number; errmsg?: string };

    if (!response.ok || result.errcode) {
      throw new Error(result.errmsg || '微信订阅消息发送失败');
    }
  }

  private async getWechatAccessToken(appId: string, appSecret: string) {
    if (this.cachedWechatAccessToken && this.cachedWechatAccessToken.expireAt > Date.now()) {
      return this.cachedWechatAccessToken.token;
    }

    const url = new URL('https://api.weixin.qq.com/cgi-bin/token');
    url.searchParams.set('grant_type', 'client_credential');
    url.searchParams.set('appid', appId);
    url.searchParams.set('secret', appSecret);

    const response = await fetch(url);
    const result = (await response.json()) as {
      access_token?: string;
      expires_in?: number;
      errmsg?: string;
    };

    if (!response.ok || !result.access_token) {
      throw new Error(result.errmsg || '微信 access_token 获取失败');
    }

    this.cachedWechatAccessToken = {
      token: result.access_token,
      expireAt: Date.now() + Math.max(300, Number(result.expires_in ?? 7200) - 300) * 1000,
    };
    return result.access_token;
  }

  private formatTemplateTime(date: Date) {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    const hour = `${date.getHours()}`.padStart(2, '0');
    const minute = `${date.getMinutes()}`.padStart(2, '0');
    return `${year}-${month}-${day} ${hour}:${minute}`;
  }

  private serializeSubscription(item: PushSubscriptionEntity) {
    return {
      id: item.id,
      scene: item.scene,
      templateId: item.templateId,
      status: item.status,
      extra: item.extraJson ?? {},
      lastSubscribedAt: item.lastSubscribedAt.toISOString(),
      expireAt: item.expireAt?.toISOString() ?? null,
      cancelledAt: item.cancelledAt?.toISOString() ?? null,
    };
  }

  private serializeDeliveryLog(item: PushDeliveryLogEntity) {
    return {
      id: item.id,
      userId: item.userId,
      scene: item.scene,
      templateId: item.templateId,
      status: item.status,
      errorMessage: item.errorMessage,
      payload: item.payloadJson ?? {},
      retryCount: item.retryCount,
      nextRetryAt: item.nextRetryAt?.toISOString() ?? null,
      lastAttemptAt: item.lastAttemptAt?.toISOString() ?? null,
      sentAt: item.sentAt?.toISOString() ?? null,
      createdAt: item.createdAt.toISOString(),
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
