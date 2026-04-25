import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppConfigEntity } from '../database/entities/app-config.entity';
import { FortuneContentEntity } from '../database/entities/fortune-content.entity';
import { LuckyItemEntity } from '../database/entities/lucky-item.entity';
import { ReportTemplateEntity } from '../database/entities/report-template.entity';
import { ReportTemplateVersionEntity } from '../database/entities/report-template-version.entity';
import {
  buildPublicApiFileContentUrl,
  extractFileIdFromFileUrl,
  normalizeFileServiceUrlToApiProxy,
} from '../common/file-url.util';
import { SaveFortuneContentDto } from './dto/save-fortune-content.dto';
import { SaveLuckyItemDto } from './dto/save-lucky-item.dto';
import { SaveReportTemplateDto } from './dto/save-report-template.dto';
import { SaveConfigEntryDto } from './dto/save-config-entry.dto';

type LifecycleEntity = {
  status: string;
  publishedAt: Date | null;
  archivedAt: Date | null;
};

@Injectable()
export class AdminContentService {
  constructor(
    @InjectRepository(FortuneContentEntity)
    private readonly fortuneContentRepository: Repository<FortuneContentEntity>,
    @InjectRepository(LuckyItemEntity)
    private readonly luckyItemRepository: Repository<LuckyItemEntity>,
    @InjectRepository(ReportTemplateEntity)
    private readonly reportTemplateRepository: Repository<ReportTemplateEntity>,
    @InjectRepository(ReportTemplateVersionEntity)
    private readonly reportTemplateVersionRepository: Repository<ReportTemplateVersionEntity>,
    @InjectRepository(AppConfigEntity)
    private readonly appConfigRepository: Repository<AppConfigEntity>,
    private readonly configService: ConfigService,
  ) {}

  uploadAudio(
    file: Express.Multer.File,
  ) {
    return this.forwardAudioToFileService(file);
  }

  async getFileContent(fileId: string) {
    try {
      const token = this.configService.get<string>('FILE_SERVICE_TOKEN');
      const response = await fetch(this.resolveFileServiceContentUrl(fileId), {
        headers: token
          ? {
              'x-file-service-token': token,
            }
          : undefined,
      });

      if (response.status === 404) {
        throw new NotFoundException('文件不存在');
      }

      if (!response.ok) {
        throw new BadGatewayException('文件服务内容读取失败');
      }

      return {
        body: Buffer.from(await response.arrayBuffer()),
        contentType:
          response.headers.get('content-type') || 'application/octet-stream',
        contentLength: response.headers.get('content-length'),
        cacheControl:
          response.headers.get('cache-control') || 'public, max-age=3600',
        contentDisposition: response.headers.get('content-disposition'),
        etag: response.headers.get('etag'),
        lastModified: response.headers.get('last-modified'),
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadGatewayException
      ) {
        throw error;
      }

      throw new BadGatewayException('连接 luckLink 文件服务失败，请检查 FILE_SERVICE_BASE_URL 或服务状态');
    }
  }

  async listContents(contentType?: string, keyword?: string, status?: string) {
    const items = await this.fortuneContentRepository.find({
      order: {
        updatedAt: 'DESC',
        id: 'DESC',
      },
      take: 200,
    });

    return this.buildListEnvelope(
      items
        .filter((item) => this.matchTextFilters(item, keyword, [item.title, item.summary ?? '', item.bizCode, item.contentType]))
        .filter((item) => (!contentType ? true : item.contentType === contentType))
        .filter((item) => this.matchStatusFilter(item.status, status))
        .map((item) => this.serializeContent(item)),
    );
  }

  async createContent(dto: SaveFortuneContentDto) {
    await this.ensureUniqueFortuneContent(dto.contentType, dto.bizCode, undefined);

    const content = this.fortuneContentRepository.create({
      contentType: dto.contentType.trim(),
      bizCode: dto.bizCode.trim(),
      publishDate: dto.publishDate ?? null,
      title: dto.title.trim(),
      summary: dto.summary?.trim() || null,
      contentJson: dto.contentJson,
    });

    this.applyLifecycleStatus(content, dto.status);
    const saved = await this.fortuneContentRepository.save(content);

    return this.buildDetailEnvelope('item', this.serializeContent(saved));
  }

  async updateContent(id: string, dto: SaveFortuneContentDto) {
    const content = await this.getContentOrThrow(id);
    await this.ensureUniqueFortuneContent(dto.contentType, dto.bizCode, id);

    content.contentType = dto.contentType.trim();
    content.bizCode = dto.bizCode.trim();
    content.publishDate = dto.publishDate ?? null;
    content.title = dto.title.trim();
    content.summary = dto.summary?.trim() || null;
    content.contentJson = dto.contentJson;
    this.applyLifecycleStatus(content, dto.status);

    const saved = await this.fortuneContentRepository.save(content);
    return this.buildDetailEnvelope('item', this.serializeContent(saved));
  }

  async changeContentStatus(id: string, status: string) {
    const content = await this.getContentOrThrow(id);
    this.applyLifecycleStatus(content, status);
    const saved = await this.fortuneContentRepository.save(content);
    return this.buildDetailEnvelope('item', this.serializeContent(saved));
  }

  async deleteContent(id: string) {
    const content = await this.getContentOrThrow(id);
    await this.fortuneContentRepository.delete({ id: content.id });
    return this.buildDeletedEnvelope(id);
  }

  async listLuckyItems(keyword?: string, status?: string) {
    const items = await this.luckyItemRepository.find({
      order: {
        sortOrder: 'ASC',
        updatedAt: 'DESC',
        id: 'DESC',
      },
      take: 200,
    });

    return this.buildListEnvelope(
      items
        .filter((item) => this.matchTextFilters(item, keyword, [item.title, item.summary ?? '', item.bizCode, item.category]))
        .filter((item) => this.matchStatusFilter(item.status, status))
        .map((item) => this.serializeLuckyItem(item)),
    );
  }

  async createLuckyItem(dto: SaveLuckyItemDto) {
    await this.ensureUniqueLuckyItem(dto.bizCode, undefined);

    const item = this.luckyItemRepository.create({
      bizCode: dto.bizCode.trim(),
      title: dto.title.trim(),
      summary: dto.summary?.trim() || null,
      category: dto.category.trim(),
      publishDate: dto.publishDate ?? null,
      sortOrder: dto.sortOrder,
      contentJson: dto.contentJson,
    });

    this.applyLifecycleStatus(item, dto.status);
    const saved = await this.luckyItemRepository.save(item);
    return this.buildDetailEnvelope('item', this.serializeLuckyItem(saved));
  }

  async updateLuckyItem(id: string, dto: SaveLuckyItemDto) {
    const item = await this.getLuckyItemOrThrow(id);
    await this.ensureUniqueLuckyItem(dto.bizCode, id);

    item.bizCode = dto.bizCode.trim();
    item.title = dto.title.trim();
    item.summary = dto.summary?.trim() || null;
    item.category = dto.category.trim();
    item.publishDate = dto.publishDate ?? null;
    item.sortOrder = dto.sortOrder;
    item.contentJson = dto.contentJson;
    this.applyLifecycleStatus(item, dto.status);

    const saved = await this.luckyItemRepository.save(item);
    return this.buildDetailEnvelope('item', this.serializeLuckyItem(saved));
  }

  async changeLuckyItemStatus(id: string, status: string) {
    const item = await this.getLuckyItemOrThrow(id);
    this.applyLifecycleStatus(item, status);
    const saved = await this.luckyItemRepository.save(item);
    return this.buildDetailEnvelope('item', this.serializeLuckyItem(saved));
  }

  async deleteLuckyItem(id: string) {
    const item = await this.getLuckyItemOrThrow(id);
    await this.luckyItemRepository.delete({ id: item.id });
    return this.buildDeletedEnvelope(id);
  }

  async listReportTemplates(templateType?: string, keyword?: string, status?: string) {
    const items = await this.reportTemplateRepository.find({
      order: {
        sortOrder: 'ASC',
        updatedAt: 'DESC',
        id: 'DESC',
      },
      take: 200,
    });

    return this.buildListEnvelope(
      items
        .filter((item) => (!templateType ? true : item.templateType === templateType))
        .filter((item) => this.matchTextFilters(item, keyword, [item.title, item.description ?? '', item.bizCode, item.templateType]))
        .filter((item) => this.matchStatusFilter(item.status, status))
        .map((item) => this.serializeReportTemplate(item)),
    );
  }

  async createReportTemplate(dto: SaveReportTemplateDto) {
    await this.ensureUniqueReportTemplate(dto.templateType, dto.bizCode, undefined);

    const item = this.reportTemplateRepository.create({
      templateType: dto.templateType.trim(),
      bizCode: dto.bizCode.trim(),
      title: dto.title.trim(),
      description: dto.description?.trim() || null,
      engine: dto.engine?.trim() || 'json',
      sortOrder: dto.sortOrder,
      payloadJson: dto.payloadJson,
    });

    this.applyLifecycleStatus(item, dto.status);
    const saved = await this.reportTemplateRepository.save(item);
    await this.snapshotReportTemplate(saved, 'created');
    return this.buildDetailEnvelope('item', this.serializeReportTemplate(saved));
  }

  async updateReportTemplate(id: string, dto: SaveReportTemplateDto) {
    const item = await this.getReportTemplateOrThrow(id);
    await this.ensureUniqueReportTemplate(dto.templateType, dto.bizCode, id);

    item.templateType = dto.templateType.trim();
    item.bizCode = dto.bizCode.trim();
    item.title = dto.title.trim();
    item.description = dto.description?.trim() || null;
    item.engine = dto.engine?.trim() || 'json';
    item.sortOrder = dto.sortOrder;
    item.payloadJson = dto.payloadJson;
    this.applyLifecycleStatus(item, dto.status);

    const saved = await this.reportTemplateRepository.save(item);
    await this.snapshotReportTemplate(saved, 'updated');
    return this.buildDetailEnvelope('item', this.serializeReportTemplate(saved));
  }

  async changeReportTemplateStatus(id: string, status: string) {
    const item = await this.getReportTemplateOrThrow(id);
    this.applyLifecycleStatus(item, status);
    const saved = await this.reportTemplateRepository.save(item);
    await this.snapshotReportTemplate(saved, `status:${status}`);
    return this.buildDetailEnvelope('item', this.serializeReportTemplate(saved));
  }

  async listReportTemplateVersions(templateId: string) {
    const versions = await this.reportTemplateVersionRepository.find({
      where: { templateId },
      order: { versionNo: 'DESC' },
      take: 50,
    });

    return this.buildListEnvelope(versions.map((item) => this.serializeTemplateVersion(item)));
  }

  async previewReportTemplate(id: string, sample?: Record<string, unknown>) {
    const item = await this.getReportTemplateOrThrow(id);

    return this.buildDetailEnvelope('preview', {
      template: this.serializeReportTemplate(item),
      sample: sample ?? {},
      rendered: this.renderTemplatePreview(item.payloadJson, sample ?? {}),
    });
  }

  async rollbackReportTemplate(id: string, versionId: string) {
    const item = await this.getReportTemplateOrThrow(id);
    const version = await this.reportTemplateVersionRepository.findOne({
      where: {
        id: versionId,
        templateId: item.id,
      },
    });

    if (!version) {
      throw new NotFoundException('模板版本不存在');
    }

    item.title = version.title;
    item.engine = version.engine;
    item.payloadJson = version.payloadJson;
    const saved = await this.reportTemplateRepository.save(item);
    await this.snapshotReportTemplate(saved, `rollback:${version.versionNo}`);

    return this.buildDetailEnvelope('item', this.serializeReportTemplate(saved));
  }

  async previewContent(
    kind: 'fortune_content' | 'lucky_item' | 'config',
    id: string,
  ) {
    if (kind === 'lucky_item') {
      const item = await this.getLuckyItemOrThrow(id);
      return this.buildDetailEnvelope('preview', this.serializeLuckyItem(item));
    }

    if (kind === 'config') {
      const item = await this.getConfigOrThrow(id);
      return this.buildDetailEnvelope('preview', this.serializeConfig(item));
    }

    const item = await this.getContentOrThrow(id);
    return this.buildDetailEnvelope('preview', this.serializeContent(item));
  }

  async batchUpdateContentStatus(
    kind: 'fortune_content' | 'lucky_item' | 'report_template' | 'config',
    ids: string[],
    status: string,
  ) {
    const uniqueIds = [...new Set(ids.map((item) => String(item).trim()).filter(Boolean))];
    const items = [];

    for (const id of uniqueIds) {
      if (kind === 'fortune_content') {
        items.push((await this.changeContentStatus(id, status)).data.item);
      } else if (kind === 'lucky_item') {
        items.push((await this.changeLuckyItemStatus(id, status)).data.item);
      } else if (kind === 'report_template') {
        items.push((await this.changeReportTemplateStatus(id, status)).data.item);
      } else {
        items.push((await this.changeConfigStatus(id, status)).data.item);
      }
    }

    return this.buildListEnvelope(items);
  }

  async deleteReportTemplate(id: string) {
    const item = await this.getReportTemplateOrThrow(id);
    await this.reportTemplateRepository.delete({ id: item.id });
    return this.buildDeletedEnvelope(id);
  }

  async listConfigs(namespace?: string, keyword?: string, status?: string) {
    const items = await this.appConfigRepository.find({
      order: {
        namespace: 'ASC',
        configKey: 'ASC',
        updatedAt: 'DESC',
      },
      take: 200,
    });

    return this.buildListEnvelope(
      items
        .filter((item) => (!namespace ? true : item.namespace === namespace))
        .filter((item) => this.matchTextFilters(item, keyword, [item.title, item.description ?? '', item.namespace, item.configKey]))
        .filter((item) => this.matchStatusFilter(item.status, status))
        .map((item) => this.serializeConfig(item)),
    );
  }

  async createConfig(dto: SaveConfigEntryDto) {
    await this.ensureUniqueConfig(dto.namespace, dto.configKey, undefined);

    const item = this.appConfigRepository.create({
      namespace: dto.namespace.trim(),
      configKey: dto.configKey.trim(),
      title: dto.title.trim(),
      description: dto.description?.trim() || null,
      valueType: dto.valueType?.trim() || 'json',
      valueJson: dto.valueJson,
    });

    this.applyLifecycleStatus(item, dto.status);
    const saved = await this.appConfigRepository.save(item);
    return this.buildDetailEnvelope('item', this.serializeConfig(saved));
  }

  async updateConfig(id: string, dto: SaveConfigEntryDto) {
    const item = await this.getConfigOrThrow(id);
    await this.ensureUniqueConfig(dto.namespace, dto.configKey, id);

    item.namespace = dto.namespace.trim();
    item.configKey = dto.configKey.trim();
    item.title = dto.title.trim();
    item.description = dto.description?.trim() || null;
    item.valueType = dto.valueType?.trim() || 'json';
    item.valueJson = dto.valueJson;
    this.applyLifecycleStatus(item, dto.status);

    const saved = await this.appConfigRepository.save(item);
    return this.buildDetailEnvelope('item', this.serializeConfig(saved));
  }

  async changeConfigStatus(id: string, status: string) {
    const item = await this.getConfigOrThrow(id);
    this.applyLifecycleStatus(item, status);
    const saved = await this.appConfigRepository.save(item);
    return this.buildDetailEnvelope('item', this.serializeConfig(saved));
  }

  async deleteConfig(id: string) {
    const item = await this.getConfigOrThrow(id);
    await this.appConfigRepository.delete({ id: item.id });
    return this.buildDeletedEnvelope(id);
  }

  private buildListEnvelope(items: unknown[]) {
    return {
      code: 0,
      message: 'ok',
      data: {
        items,
      },
      timestamp: new Date().toISOString(),
    };
  }

  private buildDetailEnvelope(key: string, value: unknown) {
    return {
      code: 0,
      message: 'ok',
      data: {
        [key]: value,
      },
      timestamp: new Date().toISOString(),
    };
  }

  private buildDeletedEnvelope(deletedId: string) {
    return {
      code: 0,
      message: 'ok',
      data: {
        deletedId,
      },
      timestamp: new Date().toISOString(),
    };
  }

  private matchTextFilters(
    _item: unknown,
    keyword: string | undefined,
    haystacks: string[],
  ) {
    const normalizedKeyword = keyword?.trim().toLowerCase() ?? '';
    if (!normalizedKeyword) {
      return true;
    }

    return haystacks.join(' ').toLowerCase().includes(normalizedKeyword);
  }

  private matchStatusFilter(itemStatus: string, status?: string) {
    return !status || status === 'all' ? true : itemStatus === status;
  }

  private applyLifecycleStatus<T extends LifecycleEntity>(entity: T, status: string) {
    if (!['draft', 'published', 'archived'].includes(status)) {
      throw new BadRequestException('暂不支持该状态');
    }

    entity.status = status;

    if (status === 'published') {
      entity.publishedAt = entity.publishedAt ?? new Date();
      entity.archivedAt = null;
      return entity;
    }

    if (status === 'archived') {
      entity.archivedAt = new Date();
      return entity;
    }

    entity.archivedAt = null;
    return entity;
  }

  private async ensureUniqueFortuneContent(
    contentType: string,
    bizCode: string,
    currentId?: string,
  ) {
    const existing = await this.fortuneContentRepository.findOne({
      where: {
        contentType: contentType.trim(),
        bizCode: bizCode.trim(),
      },
    });

    if (existing && existing.id !== currentId) {
      throw new BadRequestException('同类型下已存在相同 bizCode 的内容，请改为编辑');
    }
  }

  private async ensureUniqueLuckyItem(bizCode: string, currentId?: string) {
    const existing = await this.luckyItemRepository.findOne({
      where: {
        bizCode: bizCode.trim(),
      },
    });

    if (existing && existing.id !== currentId) {
      throw new BadRequestException('已存在相同 bizCode 的幸运物，请改为编辑');
    }
  }

  private async ensureUniqueReportTemplate(
    templateType: string,
    bizCode: string,
    currentId?: string,
  ) {
    const existing = await this.reportTemplateRepository.findOne({
      where: {
        templateType: templateType.trim(),
        bizCode: bizCode.trim(),
      },
    });

    if (existing && existing.id !== currentId) {
      throw new BadRequestException('同类型下已存在相同 bizCode 的模板，请改为编辑');
    }
  }

  private async ensureUniqueConfig(
    namespace: string,
    configKey: string,
    currentId?: string,
  ) {
    const existing = await this.appConfigRepository.findOne({
      where: {
        namespace: namespace.trim(),
        configKey: configKey.trim(),
      },
    });

    if (existing && existing.id !== currentId) {
      throw new BadRequestException('同命名空间下已存在相同配置 key，请改为编辑');
    }
  }

  private async getContentOrThrow(id: string) {
    const item = await this.fortuneContentRepository.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException('内容不存在');
    }
    return item;
  }

  private async getLuckyItemOrThrow(id: string) {
    const item = await this.luckyItemRepository.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException('幸运物不存在');
    }
    return item;
  }

  private async getReportTemplateOrThrow(id: string) {
    const item = await this.reportTemplateRepository.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException('模板不存在');
    }
    return item;
  }

  private async getConfigOrThrow(id: string) {
    const item = await this.appConfigRepository.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException('配置不存在');
    }
    return item;
  }

  private serializeContent(item: FortuneContentEntity) {
    return {
      id: item.id,
      contentType: item.contentType,
      bizCode: item.bizCode,
      publishDate: item.publishDate,
      title: item.title,
      summary: item.summary,
      status: item.status,
      contentJson: item.contentJson,
      publishedAt: item.publishedAt?.toISOString() ?? null,
      archivedAt: item.archivedAt?.toISOString() ?? null,
      updatedAt: item.updatedAt.toISOString(),
    };
  }

  private serializeLuckyItem(item: LuckyItemEntity) {
    return {
      id: item.id,
      bizCode: item.bizCode,
      title: item.title,
      summary: item.summary,
      category: item.category,
      publishDate: item.publishDate,
      sortOrder: item.sortOrder,
      status: item.status,
      contentJson: item.contentJson,
      publishedAt: item.publishedAt?.toISOString() ?? null,
      archivedAt: item.archivedAt?.toISOString() ?? null,
      updatedAt: item.updatedAt.toISOString(),
    };
  }

  private serializeReportTemplate(item: ReportTemplateEntity) {
    return {
      id: item.id,
      templateType: item.templateType,
      bizCode: item.bizCode,
      title: item.title,
      description: item.description,
      engine: item.engine,
      sortOrder: item.sortOrder,
      status: item.status,
      payloadJson: item.payloadJson,
      publishedAt: item.publishedAt?.toISOString() ?? null,
      archivedAt: item.archivedAt?.toISOString() ?? null,
      updatedAt: item.updatedAt.toISOString(),
    };
  }

  private serializeTemplateVersion(item: ReportTemplateVersionEntity) {
    return {
      id: item.id,
      templateId: item.templateId,
      templateType: item.templateType,
      bizCode: item.bizCode,
      versionNo: item.versionNo,
      title: item.title,
      engine: item.engine,
      payloadJson: item.payloadJson,
      status: item.status,
      createdBy: item.createdBy,
      createdAt: item.createdAt.toISOString(),
    };
  }

  private async snapshotReportTemplate(item: ReportTemplateEntity, reason: string) {
    const latest = await this.reportTemplateVersionRepository.findOne({
      where: { templateId: item.id },
      order: { versionNo: 'DESC' },
    });

    await this.reportTemplateVersionRepository.save(
      this.reportTemplateVersionRepository.create({
        templateId: item.id,
        templateType: item.templateType,
        bizCode: item.bizCode,
        versionNo: (latest?.versionNo ?? 0) + 1,
        title: item.title,
        engine: item.engine,
        payloadJson: item.payloadJson,
        status: reason,
        createdBy: null,
      }),
    );
  }

  private renderTemplatePreview(
    payload: Record<string, unknown>,
    sample: Record<string, unknown>,
  ) {
    const renderValue = (value: unknown): unknown => {
      if (typeof value === 'string') {
        return value.replace(/\{([a-zA-Z0-9_.-]+)\}/g, (_match, key: string) =>
          String(sample[key] ?? `{${key}}`),
        );
      }

      if (Array.isArray(value)) {
        return value.map((item) => renderValue(item));
      }

      if (value && typeof value === 'object') {
        return Object.fromEntries(
          Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
            key,
            renderValue(entry),
          ]),
        );
      }

      return value;
    };

    return renderValue(payload);
  }

  private serializeConfig(item: AppConfigEntity) {
    return {
      id: item.id,
      namespace: item.namespace,
      configKey: item.configKey,
      title: item.title,
      description: item.description,
      valueType: item.valueType,
      valueJson: this.normalizeConfigValue(item),
      status: item.status,
      publishedAt: item.publishedAt?.toISOString() ?? null,
      archivedAt: item.archivedAt?.toISOString() ?? null,
      updatedAt: item.updatedAt.toISOString(),
    };
  }

  private async forwardAudioToFileService(file: Express.Multer.File) {
    const uploadUrl = this.resolveFileServiceUploadUrl();
    const token = this.configService.get<string>('FILE_SERVICE_TOKEN');
    const formData = new FormData();
    const blob = new Blob([new Uint8Array(file.buffer)], {
      type: file.mimetype || 'application/octet-stream',
    });

    formData.append('appCode', 'fortune-hub');
    formData.append('bizType', 'meditation-audio');
    formData.append('visibility', 'public');
    formData.append('file', blob, file.originalname || 'audio.mp3');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: token
          ? {
              'x-file-service-token': token,
            }
          : undefined,
        body: formData,
        signal: controller.signal,
      });

      const payload = (await response.json().catch(() => null)) as
        | {
            id?: string;
            originalName?: string;
            mimeType?: string;
            size?: number;
            contentUrl?: string;
            storedName?: string;
            objectKey?: string;
          }
        | null;

      if (!response.ok || !payload?.contentUrl) {
        throw new BadGatewayException(
          typeof payload === 'object' && payload
            ? JSON.stringify(payload)
            : '文件服务上传失败',
        );
      }

      return this.buildDetailEnvelope('item', {
        fileId: payload.id,
        fileName: payload.storedName || file.originalname,
        originalName: payload.originalName || file.originalname,
        mimeType: payload.mimeType || file.mimetype,
        size: payload.size || file.size,
        url: this.resolveUploadedFileUrl(payload.contentUrl, payload.id),
        relativePath: payload.objectKey || '',
      });
    } catch (error) {
      if (error instanceof BadGatewayException) {
        throw error;
      }

      throw new BadGatewayException('连接 luckLink 文件服务失败，请检查 FILE_SERVICE_BASE_URL 或服务状态');
    } finally {
      clearTimeout(timeout);
    }
  }

  private resolveFileServiceUploadUrl() {
    const normalized = this.resolveFileServiceBaseUrl();

    if (normalized.endsWith('/api')) {
      return `${normalized}/files/upload`;
    }

    return `${normalized}/api/files/upload`;
  }

  private resolveFileServiceContentUrl(fileId: string) {
    const normalized = this.resolveFileServiceBaseUrl();
    const encodedId = encodeURIComponent(fileId);

    if (normalized.endsWith('/api')) {
      return `${normalized}/files/${encodedId}/content`;
    }

    return `${normalized}/api/files/${encodedId}/content`;
  }

  private resolveFileServiceBaseUrl() {
    return this.configService
      .get<string>('FILE_SERVICE_BASE_URL', 'http://8.152.214.57:3000/api')
      .replace(/\/$/, '');
  }

  private resolveUploadedFileUrl(contentUrl?: string, fileId?: string) {
    const publicApiBaseUrl = this.configService.get<string>('PUBLIC_API_BASE_URL');
    const resolvedFileId =
      fileId || (contentUrl ? extractFileIdFromFileUrl(contentUrl) : null);

    if (resolvedFileId) {
      return buildPublicApiFileContentUrl(resolvedFileId, publicApiBaseUrl);
    }

    if (!contentUrl) {
      return '';
    }

    return normalizeFileServiceUrlToApiProxy(contentUrl, {
      forceProxy: true,
      internalBaseUrl: this.resolveFileServiceBaseUrl(),
      publicApiBaseUrl,
    });
  }

  private normalizeConfigValue(item: AppConfigEntity) {
    if (item.namespace !== 'meditation' || item.configKey !== 'music_library') {
      return item.valueJson;
    }

    const valueJson = item.valueJson;

    if (!valueJson || typeof valueJson !== 'object' || Array.isArray(valueJson)) {
      return valueJson;
    }

    const rawItems = Array.isArray((valueJson as { items?: unknown[] }).items)
      ? ((valueJson as { items?: unknown[] }).items ?? [])
      : [];

    return {
      ...valueJson,
      items: rawItems.map((entry) => {
        if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
          return entry;
        }

        const record = entry as Record<string, unknown>;

        return {
          ...record,
          previewUrl:
            typeof record.previewUrl === 'string'
              ? normalizeFileServiceUrlToApiProxy(record.previewUrl, {
                  internalBaseUrl: this.resolveFileServiceBaseUrl(),
                  publicApiBaseUrl: this.configService.get<string>('PUBLIC_API_BASE_URL'),
                })
              : record.previewUrl,
        };
      }),
    };
  }
}
