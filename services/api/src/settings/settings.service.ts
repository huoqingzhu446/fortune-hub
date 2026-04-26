import { BadGatewayException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditService } from '../common/audit.service';
import {
  buildPublicApiFileContentUrl,
  extractFileIdFromFileUrl,
  normalizeFileServiceUrlToApiProxy,
} from '../common/file-url.util';
import { AppConfigEntity } from '../database/entities/app-config.entity';
import { FeedbackEntity } from '../database/entities/feedback.entity';
import { UserConsentEntity } from '../database/entities/user-consent.entity';
import { UserEntity } from '../database/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { SubmitFeedbackDto } from './dto/submit-feedback.dto';
import { UpdateConsentDto } from './dto/update-consent.dto';

const DEFAULT_SETTINGS_CONFIG = {
  privacyVersion: '2026-04-25',
  privacySummary: '用于登录、保存历史、同步偏好、发送订阅提醒与处理反馈。',
  feedbackCategories: [
    { label: '功能建议', value: 'feature' },
    { label: '问题反馈', value: 'bug' },
    { label: '内容纠错', value: 'content' },
    { label: '其他', value: 'general' },
  ],
  notificationScenes: [
    { scene: 'daily_reminder', title: '每日幸运提醒', enabled: true },
    { scene: 'lucky_push', title: '幸运物推荐提醒', enabled: true },
    { scene: 'feedback_reply', title: '反馈处理回复', enabled: true },
  ],
};

const FEEDBACK_SLA_HOURS: Record<string, number> = {
  urgent: 4,
  high: 12,
  normal: 48,
  low: 96,
};

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(AppConfigEntity)
    private readonly appConfigRepository: Repository<AppConfigEntity>,
    @InjectRepository(FeedbackEntity)
    private readonly feedbackRepository: Repository<FeedbackEntity>,
    @InjectRepository(UserConsentEntity)
    private readonly userConsentRepository: Repository<UserConsentEntity>,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getSettings(user: UserEntity | null) {
    const settingsConfig = await this.getPublishedConfig('settings', 'public');
    const complianceConfig = await this.getPublishedConfig('compliance', 'emotion_support');

    return this.buildEnvelope({
      isLoggedIn: Boolean(user),
      userPreferences: user?.preferencesJson ?? null,
      settings: {
        ...DEFAULT_SETTINGS_CONFIG,
        ...settingsConfig,
      },
      compliance: complianceConfig,
      consents: user ? await this.listLatestConsents(user) : [],
    });
  }

  async submitFeedback(user: UserEntity | null, dto: SubmitFeedbackDto) {
    const saved = await this.feedbackRepository.save(
      this.feedbackRepository.create({
        userId: user?.id ?? null,
        message: dto.message.trim(),
        contact: dto.contact?.trim() || null,
        category: dto.category?.trim() || 'general',
        source: dto.source?.trim() || 'mobile',
        clientInfoJson: dto.clientInfo ?? null,
        attachmentsJson: dto.attachments ?? null,
        status: 'open',
        priority: 'normal',
        assignee: null,
        adminNote: null,
        adminReply: null,
        repliedAt: null,
        slaDueAt: this.resolveSlaDueAt('normal'),
        resolvedAt: null,
      }),
    );

    await this.auditService.write({
      actorType: user ? 'user' : 'anonymous',
      actorId: user?.id ?? null,
      action: 'feedback.submit',
      resourceType: 'feedback',
      resourceId: saved.id,
      payload: {
        category: saved.category,
        source: saved.source,
      },
    });

    return this.buildEnvelope({
      item: this.serializeFeedback(saved),
    });
  }

  async listMyFeedback(user: UserEntity) {
    const items = await this.feedbackRepository.find({
      where: { userId: user.id },
      order: { createdAt: 'DESC' },
      take: 50,
    });

    return this.buildEnvelope({
      items: items.map((item) => this.serializeFeedback(item)),
    });
  }

  async listFeedback(query: {
    status?: string;
    keyword?: string;
    category?: string;
    priority?: string;
    slaStatus?: string;
    limit?: number;
  }) {
    const items = await this.feedbackRepository.find({
      order: { createdAt: 'DESC' },
      take: Math.min(200, Math.max(1, Number(query.limit) || 100)),
    });
    const keyword = query.keyword?.trim().toLowerCase() ?? '';

    return this.buildEnvelope({
      items: items
        .filter((item) => (!query.status || query.status === 'all' ? true : item.status === query.status))
        .filter((item) => (!query.category || query.category === 'all' ? true : item.category === query.category))
        .filter((item) => (!query.priority || query.priority === 'all' ? true : item.priority === query.priority))
        .filter((item) =>
          !query.slaStatus || query.slaStatus === 'all'
            ? true
            : this.resolveSlaStatus(item) === query.slaStatus,
        )
        .filter((item) =>
          keyword
            ? [item.message, item.contact ?? '', item.category, item.status]
                .join(' ')
                .toLowerCase()
                .includes(keyword)
            : true,
        )
        .map((item) => this.serializeFeedback(item)),
    });
  }

  async updateFeedbackStatus(
    id: string,
    input: {
      status: string;
      adminNote?: string;
      adminReply?: string;
      assignee?: string;
      priority?: string;
      actorId?: string | null;
    },
  ) {
    const item = await this.feedbackRepository.findOne({ where: { id } });

    if (!item) {
      throw new NotFoundException('反馈不存在');
    }

    const previousReply = item.adminReply;
    item.status = input.status;
    item.adminNote = input.adminNote?.trim() || item.adminNote;
    item.adminReply = input.adminReply?.trim() || item.adminReply;
    item.assignee = input.assignee?.trim() || item.assignee;
    const nextPriority = input.priority?.trim() || item.priority;
    if (nextPriority !== item.priority && !['resolved', 'closed'].includes(input.status)) {
      item.slaDueAt = this.resolveSlaDueAt(nextPriority, item.createdAt);
    }
    item.priority = nextPriority;
    item.repliedAt = input.adminReply?.trim() ? new Date() : item.repliedAt;
    item.resolvedAt = ['resolved', 'closed'].includes(input.status)
      ? item.resolvedAt ?? new Date()
      : null;

    const saved = await this.feedbackRepository.save(item);
    if (saved.userId && input.adminReply?.trim() && input.adminReply.trim() !== previousReply) {
      await this.notificationsService.queueFeedbackReplyNotification(
        saved.userId,
        saved.id,
        saved.adminReply ?? '',
      );
    }
    await this.auditService.write({
      actorType: 'admin',
      actorId: input.actorId ?? null,
      action: 'feedback.update',
      resourceType: 'feedback',
      resourceId: saved.id,
      payload: {
        status: saved.status,
        priority: saved.priority,
        assignee: saved.assignee,
        hasReply: Boolean(saved.adminReply),
      },
    });
    return this.buildEnvelope({
      item: this.serializeFeedback(saved),
    });
  }

  async uploadFeedbackAttachment(file: Express.Multer.File, user: UserEntity | null) {
    const uploadUrl = this.resolveFileServiceUploadUrl();
    const token = this.configService.get<string>('FILE_SERVICE_TOKEN');
    const formData = new FormData();
    const blob = new Blob([new Uint8Array(file.buffer)], {
      type: file.mimetype || 'application/octet-stream',
    });

    formData.append('appCode', 'fortune-hub');
    formData.append('bizType', 'feedback-attachment');
    formData.append('visibility', 'private');
    formData.append('file', blob, file.originalname || 'feedback-attachment');

    try {
      const response = await this.fetchWithTimeout(
        uploadUrl,
        {
          method: 'POST',
          headers: token ? { 'x-file-service-token': token } : undefined,
          body: formData,
        },
        30_000,
        '反馈附件上传超时，请稍后再试',
      );
      const payload = (await response.json().catch(() => null)) as
        | {
            id?: string;
            originalName?: string;
            mimeType?: string;
            size?: number;
            contentUrl?: string;
            url?: string;
            storedName?: string;
            objectKey?: string;
          }
        | null;

      if (!response.ok || (!payload?.contentUrl && !payload?.url)) {
        throw new BadGatewayException('反馈附件上传失败');
      }

      const url = this.resolveUploadedFileUrl(payload.contentUrl || payload.url || '', payload.id);
      const attachment = {
        fileId: payload.id ?? null,
        fileName: payload.storedName || file.originalname,
        originalName: payload.originalName || file.originalname,
        mimeType: payload.mimeType || file.mimetype,
        size: payload.size || file.size,
        url,
        relativePath: payload.objectKey || '',
      };

      await this.auditService.write({
        actorType: user ? 'user' : 'anonymous',
        actorId: user?.id ?? null,
        action: 'feedback.attachment.upload',
        resourceType: 'feedback_attachment',
        resourceId: attachment.fileId,
        payload: {
          fileName: attachment.fileName,
          mimeType: attachment.mimeType,
          size: attachment.size,
        },
      });

      return this.buildEnvelope({
        item: attachment,
      });
    } catch (error) {
      if (error instanceof BadGatewayException) {
        throw error;
      }

      throw new BadGatewayException('连接文件服务失败，请检查 FILE_SERVICE_BASE_URL 或服务状态');
    }
  }

  async getFeedbackDetail(id: string) {
    const item = await this.feedbackRepository.findOne({ where: { id } });

    if (!item) {
      throw new NotFoundException('反馈不存在');
    }

    return this.buildEnvelope({
      item: this.serializeFeedback(item),
    });
  }

  async listMyConsents(user: UserEntity) {
    return this.buildEnvelope({
      items: await this.listLatestConsents(user),
    });
  }

  async agreeConsent(user: UserEntity, dto: UpdateConsentDto) {
    const now = new Date();
    let item = await this.userConsentRepository.findOne({
      where: {
        userId: user.id,
        consentType: dto.consentType.trim(),
        version: dto.version.trim(),
      },
      order: {
        updatedAt: 'DESC',
      },
    });

    item =
      item ??
      this.userConsentRepository.create({
        userId: user.id,
        consentType: dto.consentType.trim(),
        version: dto.version.trim(),
      });

    item.status = 'agreed';
    item.source = dto.source?.trim() || 'mobile';
    item.clientInfoJson = dto.clientInfo ?? null;
    item.agreedAt = now;
    item.revokedAt = null;

    const saved = await this.userConsentRepository.save(item);
    await this.auditService.write({
      actorType: 'user',
      actorId: user.id,
      action: 'consent.agree',
      resourceType: 'user_consent',
      resourceId: saved.id,
      payload: {
        consentType: saved.consentType,
        version: saved.version,
      },
    });

    return this.buildEnvelope({
      item: this.serializeConsent(saved),
    });
  }

  async revokeConsent(user: UserEntity, consentType: string) {
    const item = await this.userConsentRepository.findOne({
      where: {
        userId: user.id,
        consentType,
        status: 'agreed',
      },
      order: {
        updatedAt: 'DESC',
      },
    });

    if (!item) {
      throw new NotFoundException('同意记录不存在');
    }

    item.status = 'revoked';
    item.revokedAt = new Date();

    const saved = await this.userConsentRepository.save(item);
    await this.auditService.write({
      actorType: 'user',
      actorId: user.id,
      action: 'consent.revoke',
      resourceType: 'user_consent',
      resourceId: saved.id,
      payload: {
        consentType: saved.consentType,
        version: saved.version,
      },
    });

    return this.buildEnvelope({
      item: this.serializeConsent(saved),
    });
  }

  private async getPublishedConfig(namespace: string, configKey: string) {
    const config = await this.appConfigRepository.findOne({
      where: {
        namespace,
        configKey,
        status: 'published',
      },
      order: {
        publishedAt: 'DESC',
        updatedAt: 'DESC',
      },
    });

    return this.asRecord(config?.valueJson);
  }

  private serializeFeedback(item: FeedbackEntity) {
    return {
      id: item.id,
      userId: item.userId,
      message: item.message,
      contact: item.contact,
      category: item.category,
      source: item.source,
      status: item.status,
      priority: item.priority,
      assignee: item.assignee,
      adminNote: item.adminNote,
      adminReply: item.adminReply,
      attachments: item.attachmentsJson ?? [],
      clientInfo: item.clientInfoJson ?? {},
      repliedAt: item.repliedAt?.toISOString() ?? null,
      slaDueAt: item.slaDueAt?.toISOString() ?? null,
      slaStatus: this.resolveSlaStatus(item),
      slaHoursRemaining: this.resolveSlaHoursRemaining(item),
      resolvedAt: item.resolvedAt?.toISOString() ?? null,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }

  private async listLatestConsents(user: UserEntity) {
    const items = await this.userConsentRepository.find({
      where: { userId: user.id },
      order: { updatedAt: 'DESC' },
      take: 50,
    });
    const seenTypes = new Set<string>();
    const latest = [];

    for (const item of items) {
      if (seenTypes.has(item.consentType)) {
        continue;
      }

      seenTypes.add(item.consentType);
      latest.push(this.serializeConsent(item));
    }

    return latest;
  }

  private serializeConsent(item: UserConsentEntity) {
    return {
      id: item.id,
      userId: item.userId,
      consentType: item.consentType,
      version: item.version,
      status: item.status,
      source: item.source,
      clientInfo: item.clientInfoJson ?? {},
      agreedAt: item.agreedAt.toISOString(),
      revokedAt: item.revokedAt?.toISOString() ?? null,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }

  private asRecord(value: unknown) {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  }

  private resolveSlaDueAt(priority: string, from = new Date()) {
    const hours = FEEDBACK_SLA_HOURS[priority] ?? FEEDBACK_SLA_HOURS.normal;
    return new Date(from.getTime() + hours * 60 * 60 * 1000);
  }

  private resolveSlaStatus(item: FeedbackEntity) {
    if (['resolved', 'closed'].includes(item.status)) {
      return 'done';
    }

    if (!item.slaDueAt) {
      return 'unset';
    }

    const diffMs = item.slaDueAt.getTime() - Date.now();

    if (diffMs < 0) {
      return 'overdue';
    }

    if (diffMs <= 6 * 60 * 60 * 1000) {
      return 'risk';
    }

    return 'ok';
  }

  private resolveSlaHoursRemaining(item: FeedbackEntity) {
    if (!item.slaDueAt || ['resolved', 'closed'].includes(item.status)) {
      return null;
    }

    return Math.ceil((item.slaDueAt.getTime() - Date.now()) / (60 * 60 * 1000));
  }

  private resolveFileServiceUploadUrl() {
    const baseUrl = this.configService.get<string>('FILE_SERVICE_BASE_URL');

    if (!baseUrl) {
      throw new BadGatewayException('未配置 FILE_SERVICE_BASE_URL，无法上传反馈附件');
    }

    const normalized = baseUrl.replace(/\/$/, '');
    return normalized.endsWith('/api')
      ? `${normalized}/files/upload`
      : `${normalized}/api/files/upload`;
  }

  private resolveFileServiceBaseUrl() {
    return this.configService
      .get<string>('FILE_SERVICE_BASE_URL', 'http://8.152.214.57:3000/api')
      .replace(/\/$/, '');
  }

  private resolveUploadedFileUrl(contentUrl: string, fileId?: string) {
    const publicApiBaseUrl = this.configService.get<string>('PUBLIC_API_BASE_URL');
    const resolvedFileId = fileId || extractFileIdFromFileUrl(contentUrl);

    if (resolvedFileId) {
      return buildPublicApiFileContentUrl(resolvedFileId, publicApiBaseUrl);
    }

    return normalizeFileServiceUrlToApiProxy(contentUrl, {
      forceProxy: true,
      internalBaseUrl: this.resolveFileServiceBaseUrl(),
      publicApiBaseUrl,
    });
  }

  private async fetchWithTimeout(
    input: string,
    init: RequestInit | undefined,
    timeoutMs: number,
    timeoutMessage: string,
  ) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      return await fetch(input, {
        ...(init ?? {}),
        signal: controller.signal,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new BadGatewayException(timeoutMessage);
      }

      throw error;
    } finally {
      clearTimeout(timer);
    }
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
