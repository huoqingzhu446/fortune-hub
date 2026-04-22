import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { FortuneContentEntity } from '../database/entities/fortune-content.entity';
import { SaveFortuneContentDto } from './dto/save-fortune-content.dto';

@Injectable()
export class AdminContentService {
  constructor(
    @InjectRepository(FortuneContentEntity)
    private readonly fortuneContentRepository: Repository<FortuneContentEntity>,
  ) {}

  async listContents(contentType?: string, keyword?: string) {
    const items = await this.fortuneContentRepository.find({
      order: {
        updatedAt: 'DESC',
        id: 'DESC',
      },
      take: 200,
    });

    const normalizedKeyword = keyword?.trim().toLowerCase() ?? '';
    const filtered = items.filter((item) => {
      const typeMatched = contentType ? item.contentType === contentType : true;
      const keywordMatched = normalizedKeyword
        ? [item.title, item.summary ?? '', item.bizCode, item.contentType]
            .join(' ')
            .toLowerCase()
            .includes(normalizedKeyword)
        : true;
      return typeMatched && keywordMatched;
    });

    return {
      code: 0,
      message: 'ok',
      data: {
        items: filtered.map((item) => this.serializeContent(item)),
      },
      timestamp: new Date().toISOString(),
    };
  }

  async createContent(dto: SaveFortuneContentDto) {
    const existing = await this.fortuneContentRepository.findOne({
      where: {
        contentType: dto.contentType,
        bizCode: dto.bizCode,
        publishDate: dto.publishDate ?? IsNull(),
      },
    });

    if (existing) {
      throw new BadRequestException('同类型下已存在相同 bizCode 的内容，请改为编辑');
    }

    const content = await this.fortuneContentRepository.save(
      this.fortuneContentRepository.create({
        contentType: dto.contentType.trim(),
        bizCode: dto.bizCode.trim(),
        publishDate: dto.publishDate ?? null,
        title: dto.title.trim(),
        summary: dto.summary?.trim() || null,
        status: dto.status,
        contentJson: dto.contentJson,
      }),
    );

    return {
      code: 0,
      message: 'ok',
      data: {
        item: this.serializeContent(content),
      },
      timestamp: new Date().toISOString(),
    };
  }

  async updateContent(id: string, dto: SaveFortuneContentDto) {
    const content = await this.fortuneContentRepository.findOne({
      where: { id },
    });

    if (!content) {
      throw new NotFoundException('内容不存在');
    }

    content.contentType = dto.contentType.trim();
    content.bizCode = dto.bizCode.trim();
    content.publishDate = dto.publishDate ?? null;
    content.title = dto.title.trim();
    content.summary = dto.summary?.trim() || null;
    content.status = dto.status;
    content.contentJson = dto.contentJson;

    const saved = await this.fortuneContentRepository.save(content);

    return {
      code: 0,
      message: 'ok',
      data: {
        item: this.serializeContent(saved),
      },
      timestamp: new Date().toISOString(),
    };
  }

  async deleteContent(id: string) {
    const content = await this.fortuneContentRepository.findOne({
      where: { id },
    });

    if (!content) {
      throw new NotFoundException('内容不存在');
    }

    await this.fortuneContentRepository.delete({ id });

    return {
      code: 0,
      message: 'ok',
      data: {
        deletedId: id,
      },
      timestamp: new Date().toISOString(),
    };
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
      updatedAt: item.updatedAt.toISOString(),
    };
  }
}
