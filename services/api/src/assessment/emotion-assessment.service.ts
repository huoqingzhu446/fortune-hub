import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssessmentQuestionEntity } from '../database/entities/assessment-question.entity';
import { AssessmentTestConfigEntity } from '../database/entities/assessment-test-config.entity';
import { UserRecordEntity } from '../database/entities/user-record.entity';
import { UserEntity } from '../database/entities/user.entity';
import { SubmitAssessmentDto } from './dto/submit-assessment.dto';
import {
  createDefaultSharePosterConfig,
  type SharePosterConfigDefinition,
} from './question-bank.defaults';

interface EmotionOptionDefinition {
  key: string;
  label: string;
  score: number;
}

interface EmotionQuestionDefinition {
  id: string;
  prompt: string;
  options: EmotionOptionDefinition[];
}

interface EmotionThresholdDefinition {
  maxScore: number;
  level: 'steady' | 'watch' | 'support' | 'urgent';
  title: string;
  subtitle: string;
  summary: string;
  primarySuggestion: string;
  supportSignal: string;
}

interface EmotionTestDefinition {
  code: string;
  title: string;
  subtitle: string;
  description: string;
  intro: string;
  durationMinutes: number;
  tags: string[];
  disclaimer: string;
  relaxSteps: string[];
  sharePoster?: SharePosterConfigDefinition;
  questions: EmotionQuestionDefinition[];
  thresholds: EmotionThresholdDefinition[];
}

const COMMON_OPTIONS: EmotionOptionDefinition[] = [
  { key: 'A', label: '几乎没有', score: 0 },
  { key: 'B', label: '偶尔会有', score: 1 },
  { key: 'C', label: '经常会有', score: 2 },
  { key: 'D', label: '几乎每天', score: 3 },
];

const EMOTION_TESTS: EmotionTestDefinition[] = [
  {
    code: 'mood-check',
    title: '近七日低落感自检',
    subtitle: '观察近期心情、兴趣和能量的变化',
    description: '帮助你快速感受最近一周的情绪起伏，但它不能替代专业诊断。',
    intro: '请按最近 7 天的真实体验作答，不用追求标准答案。',
    durationMinutes: 3,
    tags: ['低落感', '非诊断', '轻量 3 分钟'],
    disclaimer:
      '本结果仅用于日常自我观察，不构成医学诊断或治疗建议；如持续低落或影响生活，请尽快联系专业机构。',
    relaxSteps: [
      '先把今天最耗能的一件事拆成更小的一步。',
      '给自己留 10 分钟的安静呼吸或散步时间。',
      '找一个信任的人，简单说出你最近最累的一件事。',
    ],
    questions: [
      {
        id: 'mood-1',
        prompt: '最近 7 天，你是否常常提不起劲去做原本能完成的事？',
        options: COMMON_OPTIONS,
      },
      {
        id: 'mood-2',
        prompt: '最近 7 天，你对原本会让你开心的事情是否变得没那么有兴趣？',
        options: COMMON_OPTIONS,
      },
      {
        id: 'mood-3',
        prompt: '最近 7 天，你是否会明显感到心情低落、空掉或者无力？',
        options: COMMON_OPTIONS,
      },
      {
        id: 'mood-4',
        prompt: '最近 7 天，你是否更容易自责，或者觉得自己做得不够好？',
        options: COMMON_OPTIONS,
      },
      {
        id: 'mood-5',
        prompt: '最近 7 天，你的睡眠或精力是否因为心情而受到影响？',
        options: COMMON_OPTIONS,
      },
    ],
    thresholds: [
      {
        maxScore: 3,
        level: 'steady',
        title: '平稳观察区',
        subtitle: '最近整体还算稳定，可以继续保持日常节奏。',
        summary: '你的情绪波动目前不算明显，更适合通过规律休息和轻量活动维持状态。',
        primarySuggestion: '继续保持作息、饮食和基础运动节奏。',
        supportSignal: '如果后面连续几天明显下滑，再回来做一次复查会更有参考价值。',
      },
      {
        maxScore: 7,
        level: 'watch',
        title: '轻度波动区',
        subtitle: '最近有一些情绪起伏，值得多留意自己的消耗来源。',
        summary: '你已经出现一定程度的低落感，建议先减少不必要的压力，给自己更多恢复空间。',
        primarySuggestion: '把目标先缩小一点，优先保证睡眠和稳定吃饭。',
        supportSignal: '如果连续两周都处在这种状态，可以考虑和信任的人聊聊，必要时寻求专业支持。',
      },
      {
        maxScore: 11,
        level: 'support',
        title: '需要多留意',
        subtitle: '你的低落感已经比较明显，建议尽快增加支持和照顾。',
        summary: '最近这段时间对你来说可能比较辛苦，单靠硬撑不一定是最有效的方式。',
        primarySuggestion: '尽量减少独自承受，优先联系信任的人或专业支持资源。',
        supportSignal: '如果这种状态已经影响学习、工作、吃饭或睡眠，建议尽快联系心理咨询或医疗机构。',
      },
      {
        maxScore: Number.POSITIVE_INFINITY,
        level: 'urgent',
        title: '建议尽快寻求支持',
        subtitle: '当前波动已经比较重，先把安全和支持放在第一位。',
        summary: '这份结果提示你近期的情绪压力较高，请不要一个人硬扛。',
        primarySuggestion: '尽快联系家人、朋友、学校或医院等现实支持渠道，优先获得陪伴和帮助。',
        supportSignal: '如果你已经出现明显失控感、持续失眠或伤害自己的想法，请立即联系当地急救、医院或心理危机干预热线。',
      },
    ],
  },
  {
    code: 'anxiety-check',
    title: '近期紧张感自检',
    subtitle: '观察担忧、紧绷和身体警觉感的变化',
    description: '帮助你了解最近的紧张压力水平，但它不能替代专业诊断。',
    intro: '请按最近 7 天的真实体验作答，越直觉越好。',
    durationMinutes: 3,
    tags: ['紧张感', '非诊断', '轻量 3 分钟'],
    disclaimer:
      '本结果仅用于日常自我观察，不构成医学诊断或治疗建议；如果紧张持续升级并影响生活，请尽快寻求专业帮助。',
    relaxSteps: [
      '先做 1 分钟缓慢呼气，把呼气时间拉长到吸气的两倍。',
      '把你现在最担心的事写成一句话，再写出一个可做的小动作。',
      '如果身体很绷，先离开屏幕做一次轻度拉伸或走动。',
    ],
    questions: [
      {
        id: 'anxiety-1',
        prompt: '最近 7 天，你是否常常停不下来地担心某些事？',
        options: COMMON_OPTIONS,
      },
      {
        id: 'anxiety-2',
        prompt: '最近 7 天，你是否经常感到身体紧绷、坐立不安或难以放松？',
        options: COMMON_OPTIONS,
      },
      {
        id: 'anxiety-3',
        prompt: '最近 7 天，你是否会因为紧张而影响专注或效率？',
        options: COMMON_OPTIONS,
      },
      {
        id: 'anxiety-4',
        prompt: '最近 7 天，你是否会反复预想不好的结果，难以停下来？',
        options: COMMON_OPTIONS,
      },
      {
        id: 'anxiety-5',
        prompt: '最近 7 天，你是否因为紧张而影响睡眠、食欲或身体状态？',
        options: COMMON_OPTIONS,
      },
    ],
    thresholds: [
      {
        maxScore: 3,
        level: 'steady',
        title: '平稳观察区',
        subtitle: '你的紧张感目前在可调节范围内。',
        summary: '现在更多像是日常压力波动，适合通过呼吸、运动和节奏管理继续维持稳定。',
        primarySuggestion: '把注意力放回当下能完成的一件事上，减少多线程消耗。',
        supportSignal: '如果后面几天明显变得更绷，可以再做一次自检观察变化。',
      },
      {
        maxScore: 7,
        level: 'watch',
        title: '轻度紧绷区',
        subtitle: '最近担忧感有点偏高，值得适当减压。',
        summary: '你的注意力可能被担忧感持续占用，先把节奏降下来，会更容易恢复。',
        primarySuggestion: '今天先减少一到两个非必要任务，给自己留出喘息空间。',
        supportSignal: '如果紧绷感持续影响效率或睡眠，可以考虑找人聊聊或寻求专业建议。',
      },
      {
        maxScore: 11,
        level: 'support',
        title: '需要多留意',
        subtitle: '你的紧张感已经比较明显，建议尽快增加支持。',
        summary: '最近你可能长期处在绷紧状态，身体和情绪都需要更多缓冲和照顾。',
        primarySuggestion: '把“先稳定下来”排在“再继续推进”之前，适当暂停并寻求支持。',
        supportSignal: '如果心慌、失眠、反复惊醒等情况已经比较明显，建议尽快联系专业机构。',
      },
      {
        maxScore: Number.POSITIVE_INFINITY,
        level: 'urgent',
        title: '建议尽快寻求支持',
        subtitle: '现在更重要的是先让自己回到安全和支持里。',
        summary: '这份结果提示你近期的紧张压力已经很高，不建议继续一个人硬撑。',
        primarySuggestion: '优先联系现实中的家人、朋友、老师、同事或专业机构，先获得陪伴和帮助。',
        supportSignal: '如果你已经出现明显惊恐、持续失眠或失控感，请立即联系当地急救、医院或心理危机干预热线。',
      },
    ],
  },
];

@Injectable()
export class EmotionAssessmentService {
  constructor(
    @InjectRepository(UserRecordEntity)
    private readonly userRecordRepository: Repository<UserRecordEntity>,
    @InjectRepository(AssessmentQuestionEntity)
    private readonly assessmentQuestionRepository: Repository<AssessmentQuestionEntity>,
    @InjectRepository(AssessmentTestConfigEntity)
    private readonly assessmentTestConfigRepository: Repository<AssessmentTestConfigEntity>,
  ) {}

  async getEmotionTests() {
    const tests = await this.loadTests();

    return {
      code: 0,
      message: 'ok',
      data: {
        tests: tests.map((test) => this.serializeTestSummary(test)),
      },
      timestamp: new Date().toISOString(),
    };
  }

  async getEmotionTestDetail(code: string) {
    const test = await this.findTestOrThrow(code);

    return {
      code: 0,
      message: 'ok',
      data: {
        test: {
          ...this.serializeTestSummary(test),
          intro: test.intro,
          disclaimer: test.disclaimer,
          questions: test.questions.map((question) => ({
            id: question.id,
            prompt: question.prompt,
            options: question.options.map((option) => ({
              key: option.key,
              label: option.label,
            })),
          })),
        },
      },
      timestamp: new Date().toISOString(),
    };
  }

  async submitEmotionTest(
    code: string,
    dto: SubmitAssessmentDto,
    user: UserEntity | null,
  ) {
    const test = await this.findTestOrThrow(code);
    const answerMap = new Map(dto.answers.map((answer) => [answer.questionId, answer.optionKey]));

    if (answerMap.size !== test.questions.length) {
      throw new BadRequestException('请完成全部题目后再提交');
    }

    let totalScore = 0;

    for (const question of test.questions) {
      const selectedOptionKey = answerMap.get(question.id);

      if (!selectedOptionKey) {
        throw new BadRequestException('存在未完成的题目，请检查后重试');
      }

      const selectedOption = question.options.find(
        (option) => option.key === selectedOptionKey,
      );

      if (!selectedOption) {
        throw new BadRequestException(`题目 ${question.id} 的选项无效`);
      }

      totalScore += selectedOption.score;
    }

    const result = this.buildResultPayload(test, totalScore);
    let recordId: string | null = null;

    if (user) {
      const record = this.userRecordRepository.create({
        userId: user.id,
        recordType: 'emotion',
        sourceCode: test.code,
        resultTitle: result.title,
        score: result.score.toFixed(2),
        resultLevel: result.riskLevel,
        resultData: {
          testCode: test.code,
          testTitle: test.title,
          ...result,
        },
        isFullReportUnlocked: false,
        unlockType: null,
      });

      const savedRecord = await this.userRecordRepository.save(record);
      recordId = savedRecord.id;
    }

    return {
      code: 0,
      message: 'ok',
      data: {
        recordId,
        isSaved: Boolean(recordId),
        test: this.serializeTestSummary(test),
        result,
      },
      timestamp: new Date().toISOString(),
    };
  }

  async getEmotionHistory(user: UserEntity) {
    const records = await this.userRecordRepository.find({
      where: {
        userId: user.id,
        recordType: 'emotion',
      },
      order: {
        createdAt: 'DESC',
      },
      take: 6,
    });

    return {
      code: 0,
      message: 'ok',
      data: {
        items: records.map((record) => this.serializeHistoryItem(record)),
      },
      timestamp: new Date().toISOString(),
    };
  }

  private async loadTests() {
    await Promise.all([this.seedQuestionBank(), this.seedTestConfigs()]);

    const [questions, configs] = await Promise.all([
      this.assessmentQuestionRepository.find({
        where: {
          category: 'emotion',
          status: 'published',
        },
        order: {
          testCode: 'ASC',
          sortOrder: 'ASC',
        },
      }),
      this.assessmentTestConfigRepository.find({
        where: {
          category: 'emotion',
          status: 'published',
        },
        order: {
          code: 'ASC',
        },
      }),
    ]);
    const groupedQuestions = questions.reduce<Record<string, EmotionQuestionDefinition[]>>(
      (result, question) => {
        result[question.testCode] = result[question.testCode] ?? [];
        result[question.testCode].push({
          id: question.questionId,
          prompt: question.prompt,
          options: ((question.optionsJson as unknown) as EmotionOptionDefinition[]).map((option) => ({
            key: String(option.key),
            label: String(option.label),
            score: Number(option.score),
          })),
        });
        return result;
      },
      {},
    );

    const seedMap = EMOTION_TESTS.reduce<Record<string, EmotionTestDefinition>>(
      (result, test) => {
        result[test.code] = test;
        return result;
      },
      {},
    );

    return configs.map((config) => {
      const seed = seedMap[config.code];
      const normalizedConfig = this.normalizeEmotionConfig(config.configJson, seed);

      return {
        code: config.code,
        title: config.title,
        subtitle: config.subtitle,
        description: config.description,
        intro: config.intro,
        durationMinutes: config.durationMinutes,
        tags: this.normalizeStringArray(config.tagsJson, seed?.tags ?? []),
        disclaimer: normalizedConfig.disclaimer,
        relaxSteps: normalizedConfig.relaxSteps,
        thresholds: normalizedConfig.thresholds,
        sharePoster: normalizedConfig.sharePoster,
        questions:
          groupedQuestions[config.code]?.length
            ? groupedQuestions[config.code]
            : seed?.questions ?? this.createFallbackEmotionQuestions(config.code),
      };
    });
  }

  private async seedQuestionBank() {
    await this.assessmentQuestionRepository.upsert(
      EMOTION_TESTS.flatMap((test) =>
        test.questions.map((question, index) => ({
          category: 'emotion',
          testCode: test.code,
          questionId: question.id,
          prompt: question.prompt,
          optionsJson: question.options.map((option) => ({ ...option })),
          sortOrder: index + 1,
          status: 'published',
        })),
      ),
      ['category', 'testCode', 'questionId'],
    );
  }

  private async seedTestConfigs() {
    await this.assessmentTestConfigRepository.upsert(
      EMOTION_TESTS.map((test) => ({
        category: 'emotion',
        code: test.code,
        title: test.title,
        subtitle: test.subtitle,
        description: test.description,
        intro: test.intro,
        durationMinutes: test.durationMinutes,
        optionSchema: 'emotion',
        tagsJson: test.tags,
        configJson: {
          disclaimer: test.disclaimer,
          relaxSteps: test.relaxSteps,
          thresholds: test.thresholds,
          sharePoster: test.sharePoster ?? createDefaultSharePosterConfig('emotion'),
        },
        status: 'published',
      })),
      ['category', 'code'],
    );
  }

  private buildResultPayload(test: EmotionTestDefinition, totalScore: number) {
    const threshold =
      test.thresholds.find((item) => totalScore <= item.maxScore) ??
      test.thresholds[test.thresholds.length - 1];
    const maxScore = test.questions.length * 3;

    return {
      title: threshold.title,
      subtitle: threshold.subtitle,
      summary: threshold.summary,
      riskLevel: threshold.level,
      score: totalScore,
      scoreRangeLabel: `${totalScore}/${maxScore}`,
      primarySuggestion: threshold.primarySuggestion,
      supportSignal: threshold.supportSignal,
      relaxSteps: test.relaxSteps,
      disclaimer: test.disclaimer,
      sharePoster: this.renderSharePoster(test, {
        resultTitle: threshold.title,
        subtitle: threshold.subtitle,
        score: `${totalScore}/${maxScore}`,
        summary: threshold.summary,
        riskLevel: threshold.level,
      }),
      completedAt: new Date().toISOString(),
    };
  }

  private async findTestOrThrow(code: string) {
    const tests = await this.loadTests();
    const test = tests.find((item) => item.code === code);

    if (!test) {
      throw new NotFoundException('自检不存在或暂未开放');
    }

    return test;
  }

  private normalizeEmotionConfig(configJson: unknown, seed?: EmotionTestDefinition) {
    const configRecord = this.asRecord(configJson);
    const thresholds = Array.isArray(configRecord.thresholds)
      ? configRecord.thresholds
          .map((item) => this.normalizeThresholdItem(item))
          .filter((item): item is EmotionThresholdDefinition => Boolean(item))
      : [];

    return {
      disclaimer: this.pickString(
        configRecord.disclaimer,
        seed?.disclaimer ??
          '本结果仅用于日常自我观察，不构成医学诊断或治疗建议；如持续不适，请及时联系专业机构。',
      ),
      relaxSteps: this.pickStringArray(configRecord.relaxSteps, seed?.relaxSteps ?? [
        '先做 1 分钟缓慢呼气，让身体稍微降下来。',
        '把当前最担心的一件事写成一句话，再写下一个最小动作。',
        '如果已经明显影响生活，请优先联系现实中的支持资源。',
      ]),
      thresholds:
        thresholds.length > 0
          ? thresholds
          : seed?.thresholds ?? [
              {
                maxScore: 3,
                level: 'steady',
                title: '平稳观察区',
                subtitle: '近期整体波动不大，适合继续保持自己的节奏。',
                summary: '当前更像日常压力起伏，先维持作息与能量恢复即可。',
                primarySuggestion: '先把今天最重要的一件事做完，减少额外分心。',
                supportSignal: '如果接下来连续几天明显下滑，可以再做一次复测观察变化。',
              },
              {
                maxScore: 7,
                level: 'watch',
                title: '轻度波动区',
                subtitle: '最近有一些起伏，值得留意消耗来源。',
                summary: '你已经出现一定程度的紧绷或低落，建议先降低节奏，优先恢复。',
                primarySuggestion: '先减少一到两个非必要任务，给自己留出喘息空间。',
                supportSignal: '如果这种状态连续两周没有回落，可以考虑和信任的人聊聊。',
              },
              {
                maxScore: 11,
                level: 'support',
                title: '需要多留意',
                subtitle: '最近的消耗已经比较明显，建议主动增加支持。',
                summary: '现在更需要照顾自己的状态，而不是继续硬撑。',
                primarySuggestion: '优先联系现实中的支持资源，让自己不再单独承受。',
                supportSignal: '如果学习、工作、睡眠或进食已经受影响，建议尽快寻求专业支持。',
              },
              {
                maxScore: 99,
                level: 'urgent',
                title: '建议尽快寻求支持',
                subtitle: '当前波动已经偏高，先把安全与支持放在第一位。',
                summary: '这份结果提示近期压力偏高，不建议继续一个人硬扛。',
                primarySuggestion: '优先联系家人、朋友、学校、医院或其他现实支持渠道。',
                supportSignal: '如果你已经出现明显失控感、持续失眠或伤害自己的想法，请立即联系急救或当地心理危机干预资源。',
              },
            ],
      sharePoster: this.normalizeSharePoster(configRecord.sharePoster),
    };
  }

  private normalizeThresholdItem(value: unknown): EmotionThresholdDefinition | null {
    const record = this.asRecord(value);
    const level = this.pickString(record.level, 'watch');

    if (!['steady', 'watch', 'support', 'urgent'].includes(level)) {
      return null;
    }

    return {
      maxScore: Number(record.maxScore ?? 0),
      level: level as EmotionThresholdDefinition['level'],
      title: this.pickString(record.title, '待补充标题'),
      subtitle: this.pickString(record.subtitle, '待补充副标题'),
      summary: this.pickString(record.summary, '待补充结果总结'),
      primarySuggestion: this.pickString(record.primarySuggestion, '待补充主要建议'),
      supportSignal: this.pickString(record.supportSignal, '待补充支持提醒'),
    };
  }

  private createFallbackEmotionQuestions(code: string) {
    return [1, 2, 3].map((index) => ({
      id: `${code}-${index}`,
      prompt: `请补充第 ${index} 题的正式题干`,
      options: [
        { key: 'A', label: '几乎没有', score: 0 },
        { key: 'B', label: '偶尔会有', score: 1 },
        { key: 'C', label: '经常会有', score: 2 },
        { key: 'D', label: '几乎每天', score: 3 },
      ],
    }));
  }

  private pickStringArray(value: unknown, fallback: string[]) {
    return this.normalizeStringArray(value, fallback);
  }

  private normalizeStringArray(value: unknown, fallback: string[]) {
    if (!Array.isArray(value)) {
      return fallback;
    }

    const items = value.map((item) => String(item).trim()).filter(Boolean);
    return items.length > 0 ? items : fallback;
  }

  private pickString(value: unknown, fallback: string) {
    return typeof value === 'string' && value.trim() ? value.trim() : fallback;
  }

  private normalizeSharePoster(value: unknown) {
    const record = this.asRecord(value);
    const fallback = createDefaultSharePosterConfig('emotion');

    return {
      headlineTemplate: this.pickString(record.headlineTemplate, fallback.headlineTemplate),
      subtitleTemplate: this.pickString(record.subtitleTemplate, fallback.subtitleTemplate),
      accentText: this.pickString(record.accentText, fallback.accentText),
      footerText: this.pickString(record.footerText, fallback.footerText),
      themeName: this.pickString(record.themeName, fallback.themeName),
    };
  }

  private renderSharePoster(
    test: EmotionTestDefinition,
    payload: {
      resultTitle: string;
      subtitle: string;
      score: string;
      summary: string;
      riskLevel: string;
    },
  ) {
    const config = test.sharePoster ?? createDefaultSharePosterConfig('emotion');
    const variables: Record<string, string> = {
      resultTitle: payload.resultTitle,
      testTitle: test.title,
      subtitle: payload.subtitle,
      score: payload.score,
      summary: payload.summary,
      riskLevel: payload.riskLevel,
    };

    return {
      themeName: config.themeName,
      title: this.fillTemplate(config.headlineTemplate, variables),
      subtitle: this.fillTemplate(config.subtitleTemplate, variables),
      accentText: this.fillTemplate(config.accentText, variables),
      footerText: this.fillTemplate(config.footerText, variables),
    };
  }

  private fillTemplate(template: string, variables: Record<string, string>) {
    return template.replace(/\{(\w+)\}/g, (_, key: string) => variables[key] ?? '');
  }

  private asRecord(value: unknown) {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  }

  private serializeTestSummary(test: EmotionTestDefinition) {
    return {
      code: test.code,
      title: test.title,
      subtitle: test.subtitle,
      description: test.description,
      durationMinutes: test.durationMinutes,
      questionCount: test.questions.length,
      tags: test.tags,
    };
  }

  private serializeHistoryItem(record: UserRecordEntity) {
    const resultData = record.resultData as {
      summary?: string;
      subtitle?: string;
      supportSignal?: string;
      completedAt?: string;
    };

    return {
      id: record.id,
      testCode: record.sourceCode,
      title: record.resultTitle,
      score: record.score ? Number(record.score) : null,
      level: record.resultLevel,
      subtitle: resultData.subtitle ?? '',
      summary: resultData.summary ?? '',
      supportSignal: resultData.supportSignal ?? '',
      completedAt: resultData.completedAt ?? record.createdAt.toISOString(),
    };
  }
}
