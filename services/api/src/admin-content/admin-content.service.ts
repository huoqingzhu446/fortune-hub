import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppConfigEntity } from '../database/entities/app-config.entity';
import { FortuneContentEntity } from '../database/entities/fortune-content.entity';
import { LuckyItemEntity } from '../database/entities/lucky-item.entity';
import { ReportTemplateEntity } from '../database/entities/report-template.entity';
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
    @InjectRepository(AppConfigEntity)
    private readonly appConfigRepository: Repository<AppConfigEntity>,
  ) {}

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
    return this.buildDetailEnvelope('item', this.serializeReportTemplate(saved));
  }

  async changeReportTemplateStatus(id: string, status: string) {
    const item = await this.getReportTemplateOrThrow(id);
    this.applyLifecycleStatus(item, status);
    const saved = await this.reportTemplateRepository.save(item);
    return this.buildDetailEnvelope('item', this.serializeReportTemplate(saved));
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

  private serializeConfig(item: AppConfigEntity) {
    return {
      id: item.id,
      namespace: item.namespace,
      configKey: item.configKey,
      title: item.title,
      description: item.description,
      valueType: item.valueType,
      valueJson: item.valueJson,
      status: item.status,
      publishedAt: item.publishedAt?.toISOString() ?? null,
      archivedAt: item.archivedAt?.toISOString() ?? null,
      updatedAt: item.updatedAt.toISOString(),
    };
  }
}
