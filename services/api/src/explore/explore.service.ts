import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssessmentTestConfigEntity } from '../database/entities/assessment-test-config.entity';
import { FortuneContentEntity } from '../database/entities/fortune-content.entity';
import { LuckyItemEntity } from '../database/entities/lucky-item.entity';
import { ReportTemplateEntity } from '../database/entities/report-template.entity';
import { UserEntity } from '../database/entities/user.entity';

type ExploreSortType = 'recommended' | 'related' | 'latest';

type ExploreFeatureItem = {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: string;
  goals: string[];
  route: string;
};

type ExploreTopicItem = {
  id: string;
  title: string;
  summary: string;
  tag: string;
  route: string;
  publishedAt: string | null;
};

type ExploreContentItem = {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: string;
  filterType: string;
  goals: string[];
  duration: string;
  stat: string;
  buttonText: string;
  route: string;
  sourceType:
    | 'lucky_item'
    | 'fortune_content'
    | 'report_template'
    | 'assessment_test'
    | 'fallback';
  sourceLabel: string;
  publishedAt: string | null;
};

const FALLBACK_FEATURES: ExploreFeatureItem[] = [
  {
    id: 'emotion',
    title: '心理测试',
    description: '心情评分 / 抑郁倾向 / 焦虑状态',
    icon: '心',
    type: 'test',
    goals: ['stress', 'self'],
    route: '/pages/emotion/index',
  },
  {
    id: 'zodiac',
    title: '星座运势',
    description: '今日运势 / 星座解析',
    icon: '月',
    type: 'zodiac',
    goals: ['self'],
    route: '/pages/zodiac/index',
  },
  {
    id: 'bazi',
    title: '八字命理',
    description: '五行 / 流日气运',
    icon: '卦',
    type: 'bazi',
    goals: ['self'],
    route: '/pages/bazi/index',
  },
  {
    id: 'meditation',
    title: '冥想放松',
    description: '呼吸 / 睡眠 / 减压',
    icon: '静',
    type: 'meditation',
    goals: ['relax', 'sleep', 'stress'],
    route: '/pages/meditation/index',
  },
  {
    id: 'journal',
    title: '情绪日记',
    description: '记录心情 / 情绪追踪',
    icon: '记',
    type: 'journal',
    goals: ['self', 'stress'],
    route: '/pages/journal/index',
  },
  {
    id: 'compatibility',
    title: '合盘合性',
    description: '关系分析 / 默契度',
    icon: '合',
    type: 'content',
    goals: ['relationship'],
    route: '/pages/zodiac/index',
  },
  {
    id: 'healing',
    title: '疗愈内容',
    description: '文章 / 音频 / 卡片',
    icon: '泉',
    type: 'content',
    goals: ['relax', 'stress'],
    route: '/pages/lucky/index',
  },
  {
    id: 'more',
    title: '更多工具',
    description: '塔罗灵感 / 自我觉察',
    icon: '罗',
    type: 'content',
    goals: ['self'],
    route: '/pages/lucky/index',
  },
];

const FALLBACK_TOPICS: ExploreTopicItem[] = [
  {
    id: 'stress',
    title: '焦虑缓解',
    summary: '舒缓压力，找回平静',
    tag: '热门',
    route: '/pages/emotion/index',
    publishedAt: null,
  },
  {
    id: 'sleep',
    title: '睡前疗愈',
    summary: '放松身心，安稳入眠',
    tag: '睡眠',
    route: '/pages/emotion/index',
    publishedAt: null,
  },
  {
    id: 'week',
    title: '本周星缘',
    summary: '把握星象能量',
    tag: '星座',
    route: '/pages/zodiac/index',
    publishedAt: null,
  },
];

const FALLBACK_CONTENTS: ExploreContentItem[] = [
  {
    id: 'reset',
    title: '3 分钟情绪复位练习',
    description: '快速平复情绪，回到内心的稳定中心。',
    icon: '水',
    type: '冥想',
    filterType: 'meditation',
    goals: ['relax', 'stress'],
    duration: '8 分钟',
    stat: '1.2 万人练习',
    buttonText: '进入',
    route: '/pages/emotion/index',
    sourceType: 'fallback',
    sourceLabel: '精选推荐',
    publishedAt: null,
  },
  {
    id: 'zodiac-week',
    title: '本周星座能量提醒',
    description: '本周星象影响解析，提前掌握重要转折。',
    icon: '星',
    type: '星座',
    filterType: 'zodiac',
    goals: ['self'],
    duration: '5 分钟阅读',
    stat: '2.3 万人关注',
    buttonText: '查看',
    route: '/pages/zodiac/index',
    sourceType: 'fallback',
    sourceLabel: '精选推荐',
    publishedAt: null,
  },
  {
    id: 'element',
    title: '今日五行平衡建议',
    description: '结合八字五行，看今日能量如何调和。',
    icon: '衡',
    type: '八字',
    filterType: 'bazi',
    goals: ['self'],
    duration: '6 分钟阅读',
    stat: '9861 人查看',
    buttonText: '查看',
    route: '/pages/bazi/index',
    sourceType: 'fallback',
    sourceLabel: '精选推荐',
    publishedAt: null,
  },
];

@Injectable()
export class ExploreService {
  constructor(
    @InjectRepository(AssessmentTestConfigEntity)
    private readonly assessmentTestRepository: Repository<AssessmentTestConfigEntity>,
    @InjectRepository(FortuneContentEntity)
    private readonly fortuneContentRepository: Repository<FortuneContentEntity>,
    @InjectRepository(LuckyItemEntity)
    private readonly luckyItemRepository: Repository<LuckyItemEntity>,
    @InjectRepository(ReportTemplateEntity)
    private readonly reportTemplateRepository: Repository<ReportTemplateEntity>,
  ) {}

  async getExploreIndex(user: UserEntity | null) {
    return this.buildEnvelope(await this.buildExploreData(user));
  }

  async searchExplore(
    user: UserEntity | null,
    query: {
      keyword?: string;
      type?: string;
      goal?: string;
      sort?: string;
    },
  ) {
    const data = await this.buildExploreData(user);
    const keyword = this.normalizeKeyword(query.keyword);
    const requestedGoals = this.normalizeGoalQuery(query.goal);
    const requestedType = this.normalizeType(query.type);
    const requestedSort = this.normalizeSort(query.sort, Boolean(keyword));

    const featureMatches = this.sortExploreFeatures(
      data.features.filter((item) =>
        this.matchExploreItem(item.title, item.description, keyword) &&
        this.matchExploreFilters(item.type, item.goals, requestedType, requestedGoals),
      ),
      keyword,
      requestedSort,
    );
    const topicMatches = this.sortExploreTopics(
      data.topics.filter((item) =>
        this.matchExploreItem(item.title, item.summary, keyword),
      ),
      keyword,
      requestedSort,
    );
    const contentMatches = this.sortExploreContents(
      data.contents.filter((item) =>
        this.matchExploreItem(item.title, item.description, keyword) &&
        this.matchExploreFilters(item.filterType, item.goals, requestedType, requestedGoals),
      ),
      keyword,
      requestedSort,
    );

    return this.buildEnvelope({
      keyword: keyword ?? '',
      sort: requestedSort,
      features: featureMatches,
      topics: topicMatches,
      contents: contentMatches,
    });
  }

  private async buildExploreData(user: UserEntity | null) {
    const isProfileCompleted = Boolean(user?.birthday && user?.zodiac);
    const [liveTopics, liveContents] = await Promise.all([
      this.buildLiveTopics(),
      this.buildLiveContents(),
    ]);

    return {
      isLoggedIn: Boolean(user),
      searchPlaceholder: '搜索测试 / 冥想 / 星座 / 八字',
      todayFit: {
        icon: '莲',
        text: isProfileCompleted ? '今日适合：情绪疗愈' : '今日适合：完善资料后再深入探索',
        route: isProfileCompleted ? '/pages/emotion/index' : '/pages/profile/index',
      },
      filters: {
        types: [
          { label: '全部', value: 'all' },
          { label: '心理测试', value: 'test' },
          { label: '冥想', value: 'meditation' },
          { label: '星座', value: 'zodiac' },
          { label: '八字', value: 'bazi' },
          { label: '日记', value: 'journal' },
          { label: '内容', value: 'content' },
        ],
        goals: [
          { label: '放松', value: 'relax' },
          { label: '睡眠', value: 'sleep' },
          { label: '减压', value: 'stress' },
          { label: '自我探索', value: 'self' },
          { label: '关系分析', value: 'relationship' },
        ],
        sorts: [
          { label: '推荐优先', value: 'recommended' },
          { label: '搜索相关', value: 'related' },
          { label: '最新上架', value: 'latest' },
        ],
      },
      defaultSort: 'recommended',
      banner: {
        eyebrow: '为你推荐',
        title: '情绪自测与疗愈地图',
        summary: '识别情绪状态，找到专属疗愈方案。',
        ctaText: '立即探索',
        icon: '莲',
        route: '/pages/emotion/index',
      },
      features: FALLBACK_FEATURES,
      topics: this.sortExploreTopics(
        liveTopics.length ? liveTopics : FALLBACK_TOPICS,
        null,
        'recommended',
      ),
      contents: this.sortExploreContents(
        liveContents.length ? liveContents : FALLBACK_CONTENTS,
        null,
        'recommended',
      ),
    };
  }

  private async buildLiveTopics() {
    const items = await this.luckyItemRepository.find({
      where: {
        status: 'published',
      },
      order: {
        sortOrder: 'ASC',
        publishedAt: 'DESC',
        id: 'DESC',
      },
      take: 3,
    });

    return items.map((item) => ({
      id: `topic-${item.bizCode}`,
      title: item.title,
      summary: item.summary ?? `${item.category}相关内容已更新`,
      tag: item.category || '专题',
      route: '/pages/lucky/index',
      publishedAt: this.resolvePublishedAt(item.publishedAt, item.publishDate),
    }));
  }

  private async buildLiveContents() {
    const [luckyItems, contents, templates, assessments] = await Promise.all([
      this.luckyItemRepository.find({
        where: {
          status: 'published',
        },
        order: {
          sortOrder: 'ASC',
          publishedAt: 'DESC',
          id: 'DESC',
        },
        take: 6,
      }),
      this.fortuneContentRepository.find({
        where: {
          status: 'published',
        },
        order: {
          publishedAt: 'DESC',
          id: 'DESC',
        },
        take: 6,
      }),
      this.reportTemplateRepository.find({
        where: {
          status: 'published',
        },
        order: {
          sortOrder: 'ASC',
          publishedAt: 'DESC',
          id: 'DESC',
        },
        take: 6,
      }),
      this.assessmentTestRepository.find({
        where: {
          status: 'published',
        },
        order: {
          publishedAt: 'DESC',
          id: 'DESC',
        },
        take: 6,
      }),
    ]);

    const liveLuckyItems: ExploreContentItem[] = luckyItems.map((item) => ({
      id: `lucky-${item.bizCode}`,
      title: item.title,
      description: item.summary ?? `${item.category}相关内容`,
      icon: '泉',
      type: '内容',
      filterType: 'content',
      goals: this.resolveGoals(`${item.title} ${item.summary ?? ''} ${item.category}`),
      duration: '内容',
      stat: item.category,
      buttonText: '查看',
      route: '/pages/lucky/index',
      sourceType: 'lucky_item',
      sourceLabel: '幸运物',
      publishedAt: this.resolvePublishedAt(item.publishedAt, item.publishDate),
    }));

    const liveFortuneContents: ExploreContentItem[] = contents.map((item) => ({
      id: `fortune-${item.contentType}-${item.bizCode}`,
      title: item.title,
      description: item.summary ?? `${item.contentType} 内容`,
      icon: this.resolveContentIcon(item.contentType),
      type: this.resolveContentType(item.contentType),
      filterType: this.resolveFilterType(item.contentType),
      goals: this.resolveGoals(`${item.title} ${item.summary ?? ''} ${item.contentType}`),
      duration: '内容',
      stat: item.contentType,
      buttonText: '查看',
      route: this.resolveFortuneContentRoute(item),
      sourceType: 'fortune_content',
      sourceLabel: '内容中心',
      publishedAt: this.resolvePublishedAt(item.publishedAt, item.publishDate),
    }));

    const liveTemplates: ExploreContentItem[] = templates.map((item) => ({
      id: `template-${item.templateType}-${item.bizCode}`,
      title: item.title,
      description: item.description ?? `${item.templateType} 模板`,
      icon: '报',
      type: '报告',
      filterType: this.resolveFilterType(item.templateType),
      goals: this.resolveGoals(`${item.title} ${item.description ?? ''} ${item.templateType}`),
      duration: '报告',
      stat: item.templateType,
      buttonText: '查看',
      route: this.resolveTemplateRoute(item.templateType),
      sourceType: 'report_template',
      sourceLabel: '报告模板',
      publishedAt: this.resolvePublishedAt(item.publishedAt),
    }));

    const liveAssessments: ExploreContentItem[] = assessments.map((item) => ({
      id: `assessment-${item.category}-${item.code}`,
      title: item.title,
      description: item.description || item.subtitle || `${item.category}测评`,
      icon: item.category === 'emotion' ? '测' : '格',
      type: '测评',
      filterType: 'test',
      goals: this.resolveGoals(
        `${item.title} ${item.subtitle} ${item.description} ${(item.tagsJson || []).join(' ')}`,
      ),
      duration: `${item.durationMinutes} 分钟`,
      stat: item.category === 'emotion' ? '情绪自检' : '性格测评',
      buttonText: '开始',
      route: this.resolveAssessmentRoute(item),
      sourceType: 'assessment_test',
      sourceLabel: '题库测评',
      publishedAt: this.resolvePublishedAt(item.publishedAt),
    }));

    return this.sortExploreContents(
      [...liveLuckyItems, ...liveFortuneContents, ...liveTemplates, ...liveAssessments].slice(
        0,
        14,
      ),
      null,
      'recommended',
    ).slice(0, 10);
  }

  private resolveContentType(contentType: string) {
    if (contentType.includes('zodiac')) {
      return '星座';
    }

    if (contentType.includes('bazi')) {
      return '八字';
    }

    return '内容';
  }

  private resolveFilterType(rawType: string) {
    if (rawType.includes('zodiac')) {
      return 'zodiac';
    }

    if (rawType.includes('bazi')) {
      return 'bazi';
    }

    if (rawType.includes('emotion') || rawType.includes('test')) {
      return 'test';
    }

    return 'content';
  }

  private resolveContentIcon(contentType: string) {
    if (contentType.includes('zodiac')) {
      return '星';
    }

    if (contentType.includes('bazi')) {
      return '卦';
    }

    if (contentType.includes('lucky')) {
      return '签';
    }

    return '泉';
  }

  private resolveFortuneContentRoute(item: FortuneContentEntity) {
    if (item.contentType === 'lucky_sign') {
      return `/pages/lucky/sign/index?bizCode=${encodeURIComponent(item.bizCode)}`;
    }

    if (item.contentType.includes('zodiac')) {
      return '/pages/zodiac/index';
    }

    return '/pages/lucky/index';
  }

  private resolveTemplateRoute(templateType: string) {
    if (templateType.includes('emotion')) {
      return '/pages/emotion/index';
    }

    if (templateType.includes('personality')) {
      return '/pages/personality/index';
    }

    if (templateType.includes('bazi')) {
      return '/pages/bazi/index';
    }

    if (templateType.includes('zodiac')) {
      return '/pages/zodiac/index';
    }

    return '/pages/report/index';
  }

  private resolveAssessmentRoute(item: AssessmentTestConfigEntity) {
    if (item.category === 'emotion') {
      return '/pages/emotion/index';
    }

    if (item.category === 'personality') {
      return '/pages/personality/index';
    }

    return '/pages/explore/index';
  }

  private resolveGoals(text: string) {
    const normalized = text.toLowerCase();
    const goals = new Set<string>();

    if (
      /睡|眠|呼吸|放松|冥想|疗愈|relax|sleep/.test(normalized)
    ) {
      goals.add('relax');
      goals.add('sleep');
    }

    if (/压|焦虑|紧张|stress|anxiety/.test(normalized)) {
      goals.add('stress');
    }

    if (/星|八字|命理|自我|探索|test|report|template/.test(normalized)) {
      goals.add('self');
    }

    if (/关系|合盘|compatibility/.test(normalized)) {
      goals.add('relationship');
    }

    return goals.size ? [...goals] : ['self'];
  }

  private matchExploreItem(title: string, description: string, keyword: string | null) {
    if (!keyword) {
      return true;
    }

    const haystack = `${title} ${description}`.toLowerCase();
    return haystack.includes(keyword);
  }

  private matchExploreFilters(
    type: string,
    goals: string[],
    requestedType: string | null,
    requestedGoals: string[],
  ) {
    if (requestedType && type !== requestedType) {
      return false;
    }

    if (requestedGoals.length && !requestedGoals.some((goal) => goals.includes(goal))) {
      return false;
    }

    return true;
  }

  private normalizeKeyword(keyword?: string) {
    const normalized = keyword?.trim().toLowerCase() ?? '';
    return normalized || null;
  }

  private normalizeSort(sort?: string, hasKeyword = false): ExploreSortType {
    const normalized = sort?.trim().toLowerCase();

    if (normalized === 'latest') {
      return 'latest';
    }

    if (normalized === 'related') {
      return 'related';
    }

    return hasKeyword ? 'related' : 'recommended';
  }

  private normalizeType(type?: string) {
    const normalized = type?.trim().toLowerCase() ?? '';
    return normalized && normalized !== 'all' ? normalized : null;
  }

  private normalizeGoalQuery(goal?: string) {
    return (goal ?? '')
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);
  }

  private sortExploreFeatures(
    items: ExploreFeatureItem[],
    keyword: string | null,
    sort: ExploreSortType,
  ) {
    return [...items].sort((left, right) => {
      if (sort === 'latest') {
        return left.id.localeCompare(right.id);
      }

      return this.compareByKeyword(
        `${left.title} ${left.description}`,
        `${right.title} ${right.description}`,
        keyword,
      );
    });
  }

  private sortExploreTopics(
    items: ExploreTopicItem[],
    keyword: string | null,
    sort: ExploreSortType,
  ) {
    return [...items].sort((left, right) => {
      if (sort === 'latest') {
        return this.compareDateDesc(left.publishedAt, right.publishedAt);
      }

      const keywordCompare = this.compareByKeyword(
        `${left.title} ${left.summary}`,
        `${right.title} ${right.summary}`,
        keyword,
      );

      if (keywordCompare !== 0) {
        return keywordCompare;
      }

      return this.compareDateDesc(left.publishedAt, right.publishedAt);
    });
  }

  private sortExploreContents(
    items: ExploreContentItem[],
    keyword: string | null,
    sort: ExploreSortType,
  ) {
    return [...items].sort((left, right) => {
      if (sort === 'latest') {
        return this.compareDateDesc(left.publishedAt, right.publishedAt);
      }

      const leftScore = this.computeContentScore(left, keyword, sort);
      const rightScore = this.computeContentScore(right, keyword, sort);

      if (rightScore !== leftScore) {
        return rightScore - leftScore;
      }

      return this.compareDateDesc(left.publishedAt, right.publishedAt);
    });
  }

  private computeContentScore(
    item: ExploreContentItem,
    keyword: string | null,
    sort: ExploreSortType,
  ) {
    const basePriority = this.resolveSourcePriority(item.sourceType);
    const keywordScore = this.resolveKeywordScore(
      `${item.title} ${item.description} ${item.type} ${item.sourceLabel}`,
      keyword,
      item.title,
    );

    if (sort === 'related') {
      return keywordScore * 10 + basePriority;
    }

    return basePriority * 10 + keywordScore;
  }

  private resolveSourcePriority(sourceType: ExploreContentItem['sourceType']) {
    switch (sourceType) {
      case 'assessment_test':
        return 6;
      case 'fortune_content':
        return 5;
      case 'report_template':
        return 4;
      case 'lucky_item':
        return 3;
      case 'fallback':
      default:
        return 1;
    }
  }

  private compareByKeyword(leftText: string, rightText: string, keyword: string | null) {
    const leftScore = this.resolveKeywordScore(leftText, keyword);
    const rightScore = this.resolveKeywordScore(rightText, keyword);

    return rightScore - leftScore;
  }

  private resolveKeywordScore(text: string, keyword: string | null, title?: string) {
    if (!keyword) {
      return 0;
    }

    const normalizedText = text.toLowerCase();
    const normalizedTitle = title?.toLowerCase() ?? '';

    if (normalizedTitle === keyword) {
      return 16;
    }

    if (normalizedTitle.includes(keyword)) {
      return 10;
    }

    if (normalizedText.includes(keyword)) {
      return 6;
    }

    return 0;
  }

  private compareDateDesc(left: string | null, right: string | null) {
    const leftTimestamp = left ? new Date(left).getTime() : 0;
    const rightTimestamp = right ? new Date(right).getTime() : 0;
    return rightTimestamp - leftTimestamp;
  }

  private resolvePublishedAt(
    publishedAt?: Date | null,
    publishDate?: string | null,
  ) {
    if (publishedAt instanceof Date) {
      return publishedAt.toISOString();
    }

    if (publishDate) {
      return new Date(`${publishDate}T00:00:00.000Z`).toISOString();
    }

    return null;
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
