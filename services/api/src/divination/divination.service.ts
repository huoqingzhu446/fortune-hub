import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FortuneContentEntity } from '../database/entities/fortune-content.entity';
import {
  DIVINATION_CONTENT_SEEDS,
  DIVINATION_CONTENT_TYPE,
  DIVINATION_DEFAULT_CONTENT_CATALOG,
  type DivinationContentCatalog,
  type DivinationTopic,
} from './divination.constants';

@Injectable()
export class DivinationService {
  constructor(
    @InjectRepository(FortuneContentEntity)
    private readonly fortuneContentRepository: Repository<FortuneContentEntity>,
  ) {}

  async getContentCatalog() {
    await this.ensureSeedData();
    const [linePositions, topicCopy] = await Promise.all([
      this.findPublishedContent('line_positions'),
      this.findPublishedContent('topic_copy'),
    ]);

    return this.buildEnvelope({
      catalog: this.buildCatalog(linePositions, topicCopy),
    });
  }

  private async ensureSeedData() {
    for (const seed of DIVINATION_CONTENT_SEEDS) {
      const existing = await this.fortuneContentRepository.findOne({
        where: {
          contentType: seed.contentType,
          bizCode: seed.bizCode,
        },
      });

      if (existing) {
        continue;
      }

      await this.fortuneContentRepository.save(
        this.fortuneContentRepository.create({
          ...seed,
          publishDate: seed.publishDate ?? null,
          publishedAt: new Date(),
          archivedAt: null,
        }),
      );
    }
  }

  private async findPublishedContent(bizCode: string) {
    return this.fortuneContentRepository.findOne({
      where: {
        contentType: DIVINATION_CONTENT_TYPE,
        bizCode,
        status: 'published',
      },
      order: {
        publishDate: 'DESC',
        id: 'DESC',
      },
    });
  }

  private buildCatalog(
    linePositions: FortuneContentEntity | null,
    topicCopy: FortuneContentEntity | null,
  ): DivinationContentCatalog {
    const lineSource = this.asRecord(linePositions?.contentJson).linePositionContent;
    const topicSource = this.asRecord(topicCopy?.contentJson).topicCopy;

    return {
      linePositionContent: DIVINATION_DEFAULT_CONTENT_CATALOG.linePositionContent.map(
        (fallback, index) => {
          const source = Array.isArray(lineSource) ? lineSource[index] : null;
          return {
            theme: this.pickString(this.getStringField(source, 'theme'), fallback.theme),
            focus: this.pickString(this.getStringField(source, 'focus'), fallback.focus),
            action: this.pickString(this.getStringField(source, 'action'), fallback.action),
            risk: this.pickString(this.getStringField(source, 'risk'), fallback.risk),
          };
        },
      ),
      topicCopy: Object.entries(DIVINATION_DEFAULT_CONTENT_CATALOG.topicCopy).reduce<
        Record<DivinationTopic, DivinationContentCatalog['topicCopy'][DivinationTopic]>
      >((result, [topic, fallback]) => {
        const source = this.asRecord(topicSource)[topic];
        result[topic as DivinationTopic] = {
          title: this.pickString(this.getStringField(source, 'title'), fallback.title),
          lens: this.pickString(this.getStringField(source, 'lens'), fallback.lens),
          opportunity: this.pickString(
            this.getStringField(source, 'opportunity'),
            fallback.opportunity,
          ),
          risk: this.pickString(this.getStringField(source, 'risk'), fallback.risk),
          actionPrefix: this.pickString(
            this.getStringField(source, 'actionPrefix'),
            fallback.actionPrefix,
          ),
        };
        return result;
      }, {} as Record<DivinationTopic, DivinationContentCatalog['topicCopy'][DivinationTopic]>),
    };
  }

  private buildEnvelope(data: Record<string, unknown>) {
    return {
      code: 0,
      message: 'ok',
      data,
      timestamp: new Date().toISOString(),
    };
  }

  private asRecord(value: unknown) {
    return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  }

  private getStringField(source: unknown, key: string) {
    const value = this.asRecord(source)[key];
    return typeof value === 'string' ? value : '';
  }

  private pickString(value: string, fallback: string) {
    return value.trim() || fallback;
  }
}
