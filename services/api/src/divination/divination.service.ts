import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DivinationReviewEntity } from '../database/entities/divination-review.entity';
import { FortuneContentEntity } from '../database/entities/fortune-content.entity';
import { UserEntity } from '../database/entities/user.entity';
import {
  DIVINATION_CONTENT_SEEDS,
  DIVINATION_CONTENT_TYPE,
  DIVINATION_DEFAULT_CONTENT_CATALOG,
  type DivinationContentCatalog,
  type DivinationTopic,
} from './divination.constants';
import { SyncDivinationReviewDto } from './dto/sync-divination-review.dto';

@Injectable()
export class DivinationService {
  constructor(
    @InjectRepository(FortuneContentEntity)
    private readonly fortuneContentRepository: Repository<FortuneContentEntity>,
    @InjectRepository(DivinationReviewEntity)
    private readonly divinationReviewRepository: Repository<DivinationReviewEntity>,
  ) {}

  async getContentCatalog() {
    await this.ensureSeedData();
    const [
      linePositions,
      topicCopy,
      topicOptions,
      topicStrategies,
      profileMapping,
      luckyItems,
      pageTabs,
    ] = await Promise.all([
      this.findPublishedContent('line_positions'),
      this.findPublishedContent('topic_copy'),
      this.findPublishedContent('topic_options'),
      this.findPublishedContent('topic_strategies'),
      this.findPublishedContent('profile_mapping'),
      this.findPublishedContent('lucky_items'),
      this.findPublishedContent('page_tabs'),
    ]);

    return this.buildEnvelope({
      catalog: this.buildCatalog({
        linePositions,
        topicCopy,
        topicOptions,
        topicStrategies,
        profileMapping,
        luckyItems,
        pageTabs,
      }),
    });
  }

  async listReviews(user: UserEntity) {
    const items = await this.divinationReviewRepository.find({
      where: {
        userId: user.id,
      },
      order: {
        updatedAt: 'DESC',
      },
      take: 100,
    });

    return this.buildEnvelope({
      items: items.map((item) => this.serializeReview(item)),
    });
  }

  async syncReview(user: UserEntity, dto: SyncDivinationReviewDto) {
    const resultId = dto.resultId.trim();
    if (!resultId) {
      throw new BadRequestException('缺少占卜结果标识');
    }

    let review = await this.divinationReviewRepository.findOne({
      where: {
        userId: user.id,
        resultId,
      },
    });

    if (!review) {
      review = this.divinationReviewRepository.create({
        userId: user.id,
        resultId,
        favorite: false,
        outcome: 'pending',
        note: null,
        topic: null,
        title: null,
        summary: null,
        resultSnapshot: null,
        preMood: null,
        preMoodIntensity: null,
        postMood: null,
        postMoodIntensity: null,
        expectation: null,
      });
    }

    if (typeof dto.favorite === 'boolean') {
      review.favorite = dto.favorite;
    }

    if (dto.outcome) {
      review.outcome = dto.outcome;
    }

    if (typeof dto.note === 'string') {
      review.note = this.pickNullableString(dto.note, 500);
    }

    review.topic = this.pickNullableString(dto.topic, 32) ?? review.topic;
    review.title = this.pickNullableString(dto.title, 128) ?? review.title;
    review.summary = this.pickNullableString(dto.summary, 255) ?? review.summary;
    review.resultSnapshot = dto.resultSnapshot ?? review.resultSnapshot;
    review.preMood = this.pickNullableString(dto.preMood, 16) ?? review.preMood;
    review.postMood =
      this.pickNullableString(dto.postMood, 16) ?? review.postMood;
    review.expectation =
      this.pickNullableString(dto.expectation, 32) ?? review.expectation;

    if (typeof dto.preMoodIntensity === 'number') {
      review.preMoodIntensity = dto.preMoodIntensity;
    }

    if (typeof dto.postMoodIntensity === 'number') {
      review.postMoodIntensity = dto.postMoodIntensity;
    }

    const saved = await this.divinationReviewRepository.save(review);

    return this.buildEnvelope({
      item: this.serializeReview(saved),
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

  private buildCatalog(input: {
    linePositions: FortuneContentEntity | null;
    topicCopy: FortuneContentEntity | null;
    topicOptions: FortuneContentEntity | null;
    topicStrategies: FortuneContentEntity | null;
    profileMapping: FortuneContentEntity | null;
    luckyItems: FortuneContentEntity | null;
    pageTabs: FortuneContentEntity | null;
  }): DivinationContentCatalog {
    const lineSource = this.asRecord(input.linePositions?.contentJson).linePositionContent;
    const topicSource = this.asRecord(input.topicCopy?.contentJson).topicCopy;
    const topicOptionsSource = this.asRecord(input.topicOptions?.contentJson).topicOptions;
    const topicStrategiesSource = this.asRecord(input.topicStrategies?.contentJson).topicStrategies;
    const profileMappingSource = this.asRecord(input.profileMapping?.contentJson).profileMapping;
    const luckyItemsSource = this.asRecord(input.luckyItems?.contentJson).luckyItems;
    const pageTabsSource = this.asRecord(input.pageTabs?.contentJson).pageTabs;

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
      topicOptions: Array.isArray(topicOptionsSource)
        ? topicOptionsSource as DivinationContentCatalog['topicOptions']
        : DIVINATION_DEFAULT_CONTENT_CATALOG.topicOptions,
      topicStrategies: this.pickRecord(
        topicStrategiesSource,
        DIVINATION_DEFAULT_CONTENT_CATALOG.topicStrategies,
      ),
      profileMapping: this.pickRecord(
        profileMappingSource,
        DIVINATION_DEFAULT_CONTENT_CATALOG.profileMapping,
      ),
      luckyItems: this.pickRecord(
        luckyItemsSource,
        DIVINATION_DEFAULT_CONTENT_CATALOG.luckyItems,
      ),
      pageTabs: this.pickRecord(
        pageTabsSource,
        DIVINATION_DEFAULT_CONTENT_CATALOG.pageTabs,
      ),
    };
  }

  private serializeReview(item: DivinationReviewEntity) {
    return {
      id: item.id,
      resultId: item.resultId,
      favorite: item.favorite,
      outcome: item.outcome,
      note: item.note ?? '',
      topic: item.topic ?? '',
      title: item.title ?? '',
      summary: item.summary ?? '',
      resultSnapshot: item.resultSnapshot,
      preMood: item.preMood ?? '',
      preMoodIntensity: item.preMoodIntensity,
      postMood: item.postMood ?? '',
      postMoodIntensity: item.postMoodIntensity,
      expectation: item.expectation ?? '',
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
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

  private pickRecord<T extends Record<string, unknown>>(value: unknown, fallback: T) {
    return value && typeof value === 'object' ? value as T : fallback;
  }

  private pickNullableString(value: string | undefined, maxLength: number) {
    if (typeof value !== 'string') {
      return null;
    }

    const trimmed = value.trim();
    return trimmed ? trimmed.slice(0, maxLength) : null;
  }
}
