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

interface PersonalityOptionDefinition {
  key: string;
  label: string;
  dimension: string;
  score: number;
}

interface PersonalityQuestionDefinition {
  id: string;
  prompt: string;
  options: PersonalityOptionDefinition[];
}

interface PersonalityProfileDefinition {
  title: string;
  summary: string;
  strengths: string[];
  suggestions: string[];
}

interface PersonalityTestDefinition {
  code: string;
  title: string;
  subtitle: string;
  description: string;
  intro: string;
  durationMinutes: number;
  tags: string[];
  dimensionLabels: Record<string, string>;
  profiles: Record<string, PersonalityProfileDefinition>;
  sharePoster?: SharePosterConfigDefinition;
  questions: PersonalityQuestionDefinition[];
}

interface DimensionScoreItem {
  key: string;
  label: string;
  value: number;
  ratio: number;
}

const PERSONALITY_TESTS: PersonalityTestDefinition[] = [
  {
    code: 'daily-rhythm',
    title: '日常节奏感测评',
    subtitle: '看你更偏行动、稳定还是感受',
    description: '适合先快速了解自己的日常推进方式和情绪节奏。',
    intro: '5 道轻量题，帮你看清自己在推进事情时最自然的状态。',
    durationMinutes: 3,
    tags: ['入门推荐', '节奏感', '轻量 3 分钟'],
    dimensionLabels: {
      drive: '行动感',
      balance: '稳定感',
      empathy: '感受力',
    },
    profiles: {
      drive: {
        title: '轻快执行型',
        summary: '你在启动与推进上很有优势，适合先动起来，再逐步打磨细节。',
        strengths: [
          '面对任务时容易迅速进入状态',
          '适合把复杂事项拆成清晰步骤',
          '在团队里常常能带出行动节奏',
        ],
        suggestions: [
          '给自己留一点复盘空间，避免只顾着往前冲',
          '关键节点多确认一次信息，稳定感会更强',
        ],
      },
      balance: {
        title: '稳感掌舵型',
        summary: '你擅长在变化中维持秩序，通常能把事情安排得更稳妥。',
        strengths: [
          '对节奏和边界有较好的掌控力',
          '在复杂安排里更容易保持清晰',
          '适合负责长期和持续性的任务',
        ],
        suggestions: [
          '偶尔允许自己更快开始，别把准备拖得太久',
          '为灵感留一点空白，会让行动更轻盈',
        ],
      },
      empathy: {
        title: '细腻感知型',
        summary: '你对氛围与他人感受很敏锐，往往能在细节里捕捉到真实需求。',
        strengths: [
          '能够快速感知情绪和环境变化',
          '适合需要理解他人和共情的场景',
          '在表达关心时更容易让人感到舒服',
        ],
        suggestions: [
          '重要事项先定一个时间点，能减少犹豫和消耗',
          '把感受写下来再行动，会更容易进入稳定节奏',
        ],
      },
    },
    questions: [
      {
        id: 'rhythm-1',
        prompt: '当你开始新一天时，最自然的方式通常是？',
        options: [
          { key: 'A', label: '先定一个最重要的目标，尽快开动。', dimension: 'drive', score: 4 },
          { key: 'B', label: '先看整体安排，按顺序推进。', dimension: 'balance', score: 3 },
          { key: 'C', label: '先感受状态，找最顺手的切入口。', dimension: 'empathy', score: 3 },
        ],
      },
      {
        id: 'rhythm-2',
        prompt: '计划突然变化时，你更像哪一种反应？',
        options: [
          { key: 'A', label: '马上调整方案，先让事情继续往前走。', dimension: 'drive', score: 4 },
          { key: 'B', label: '先确认影响范围，再决定怎么改。', dimension: 'balance', score: 4 },
          { key: 'C', label: '会先留意自己和他人的感受再处理。', dimension: 'empathy', score: 3 },
        ],
      },
      {
        id: 'rhythm-3',
        prompt: '如果朋友找你商量一件事，你通常会先？',
        options: [
          { key: 'A', label: '帮他列出几个可执行方案。', dimension: 'drive', score: 3 },
          { key: 'B', label: '先把信息听完整，梳理关键点。', dimension: 'balance', score: 4 },
          { key: 'C', label: '先理解他的真实情绪和顾虑。', dimension: 'empathy', score: 4 },
        ],
      },
      {
        id: 'rhythm-4',
        prompt: '遇到积压任务时，你更容易靠什么重新进入状态？',
        options: [
          { key: 'A', label: '先完成最短的一项，让节奏重新起来。', dimension: 'drive', score: 4 },
          { key: 'B', label: '把任务重新排序，给自己一个可控清单。', dimension: 'balance', score: 4 },
          { key: 'C', label: '让自己缓一缓，再回到更舒服的状态。', dimension: 'empathy', score: 3 },
        ],
      },
      {
        id: 'rhythm-5',
        prompt: '你理想中的一天，更接近下面哪种体验？',
        options: [
          { key: 'A', label: '做成几件具体的事，成就感明显。', dimension: 'drive', score: 4 },
          { key: 'B', label: '安排顺畅、节奏稳定、不慌不乱。', dimension: 'balance', score: 4 },
          { key: 'C', label: '身心放松，也和重要的人保持良好连接。', dimension: 'empathy', score: 4 },
        ],
      },
    ],
  },
  {
    code: 'expression-style',
    title: '表达风格测评',
    subtitle: '看你在交流里更偏条理、亲和还是灵感',
    description: '适合用来快速了解自己的表达习惯与对外沟通风格。',
    intro: '5 道小题，帮你识别自己更自然的沟通气质。',
    durationMinutes: 3,
    tags: ['沟通表达', '风格识别', '轻量 3 分钟'],
    dimensionLabels: {
      clarity: '条理感',
      warmth: '亲和感',
      spark: '灵感感',
    },
    profiles: {
      clarity: {
        title: '清晰表达型',
        summary: '你擅长把复杂内容讲清楚，交流时更容易让人快速抓住重点。',
        strengths: [
          '结构感强，适合做说明和总结',
          '能在讨论里稳定节奏，减少沟通成本',
          '在协作场景中更容易建立信任感',
        ],
        suggestions: [
          '适当加一点情绪温度，表达会更有连接感',
          '别把每句话都打磨到太完整，留一点自然感更舒服',
        ],
      },
      warmth: {
        title: '温柔连接型',
        summary: '你很会照顾交流中的情绪感受，能让对方更愿意继续打开自己。',
        strengths: [
          '容易营造轻松安全的沟通氛围',
          '适合做协调、陪伴和支持型表达',
          '在一对一关系里往往更有感染力',
        ],
        suggestions: [
          '关键观点可以再说得更直接一点',
          '重要信息尽量落到具体行动，避免只停留在感受层面',
        ],
      },
      spark: {
        title: '灵感激发型',
        summary: '你有很强的想法流动感，往往能给谈话带来新鲜视角和活力。',
        strengths: [
          '点子多，适合头脑风暴和创意表达',
          '容易带动场面，让沟通不沉闷',
          '擅长用画面感和比喻增强记忆点',
        ],
        suggestions: [
          '重要结论可以再收束一下，便于别人接住',
          '给观点配一个落地步骤，会更容易转化成行动',
        ],
      },
    },
    questions: [
      {
        id: 'expression-1',
        prompt: '需要向别人说明一件事时，你通常会先怎么组织？',
        options: [
          { key: 'A', label: '先给结构，再补细节。', dimension: 'clarity', score: 4 },
          { key: 'B', label: '先照顾对方的理解节奏和感受。', dimension: 'warmth', score: 3 },
          { key: 'C', label: '先抛一个有画面感的例子吸引注意。', dimension: 'spark', score: 4 },
        ],
      },
      {
        id: 'expression-2',
        prompt: '聊天气氛变冷时，你更可能怎么做？',
        options: [
          { key: 'A', label: '重新拉回重点，让对话更有方向。', dimension: 'clarity', score: 3 },
          { key: 'B', label: '换一种更轻松、让人舒服的说法。', dimension: 'warmth', score: 4 },
          { key: 'C', label: '抛出一个新角度或有趣的问题。', dimension: 'spark', score: 4 },
        ],
      },
      {
        id: 'expression-3',
        prompt: '如果要做一次分享，你最希望别人记住你什么？',
        options: [
          { key: 'A', label: '内容清晰，逻辑很顺。', dimension: 'clarity', score: 4 },
          { key: 'B', label: '氛围舒服，让人愿意继续交流。', dimension: 'warmth', score: 4 },
          { key: 'C', label: '观点新鲜，很有启发。', dimension: 'spark', score: 4 },
        ],
      },
      {
        id: 'expression-4',
        prompt: '当别人误解你时，你更自然的处理方式是？',
        options: [
          { key: 'A', label: '重新梳理逻辑，把误会解释清楚。', dimension: 'clarity', score: 4 },
          { key: 'B', label: '先缓和情绪，再继续沟通。', dimension: 'warmth', score: 4 },
          { key: 'C', label: '换一种说法或例子，让对方更容易理解。', dimension: 'spark', score: 3 },
        ],
      },
      {
        id: 'expression-5',
        prompt: '你更喜欢哪一种理想沟通状态？',
        options: [
          { key: 'A', label: '信息传递高效，大家很快有共识。', dimension: 'clarity', score: 4 },
          { key: 'B', label: '彼此都觉得被理解，关系更靠近。', dimension: 'warmth', score: 4 },
          { key: 'C', label: '对话里不断冒出新的想法和火花。', dimension: 'spark', score: 4 },
        ],
      },
    ],
  },
];

@Injectable()
export class AssessmentService {
  constructor(
    @InjectRepository(UserRecordEntity)
    private readonly userRecordRepository: Repository<UserRecordEntity>,
    @InjectRepository(AssessmentQuestionEntity)
    private readonly assessmentQuestionRepository: Repository<AssessmentQuestionEntity>,
    @InjectRepository(AssessmentTestConfigEntity)
    private readonly assessmentTestConfigRepository: Repository<AssessmentTestConfigEntity>,
  ) {}

  async getPersonalityTests() {
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

  async getPersonalityTestDetail(code: string) {
    const test = await this.findTestOrThrow(code);

    return {
      code: 0,
      message: 'ok',
      data: {
        test: {
          ...this.serializeTestSummary(test),
          intro: test.intro,
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

  async submitPersonalityTest(
    code: string,
    dto: SubmitAssessmentDto,
    user: UserEntity | null,
  ) {
    const test = await this.findTestOrThrow(code);
    const answerMap = new Map(
      dto.answers.map((answer) => [answer.questionId, answer.optionKey]),
    );

    if (answerMap.size !== test.questions.length) {
      throw new BadRequestException('请完成全部题目后再提交');
    }

    const dimensionScores = Object.keys(test.dimensionLabels).reduce<Record<string, number>>(
      (result, key) => {
        result[key] = 0;
        return result;
      },
      {},
    );

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

      dimensionScores[selectedOption.dimension] += selectedOption.score;
      totalScore += selectedOption.score;
    }

    const result = this.buildResultPayload(test, dimensionScores, totalScore);

    let recordId: string | null = null;

    if (user) {
      const record = this.userRecordRepository.create({
        userId: user.id,
        recordType: 'personality',
        sourceCode: test.code,
        resultTitle: result.title,
        score: result.score.toFixed(2),
        resultLevel: result.level,
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

  async getPersonalityHistory(user: UserEntity) {
    const records = await this.userRecordRepository.find({
      where: {
        userId: user.id,
        recordType: 'personality',
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
          category: 'personality',
          status: 'published',
        },
        order: {
          testCode: 'ASC',
          sortOrder: 'ASC',
        },
      }),
      this.assessmentTestConfigRepository.find({
        where: {
          category: 'personality',
          status: 'published',
        },
        order: {
          code: 'ASC',
        },
      }),
    ]);
    const groupedQuestions = questions.reduce<Record<string, PersonalityQuestionDefinition[]>>(
      (result, question) => {
        result[question.testCode] = result[question.testCode] ?? [];
        result[question.testCode].push({
          id: question.questionId,
          prompt: question.prompt,
          options: ((question.optionsJson as unknown) as PersonalityOptionDefinition[]).map((option) => ({
            key: String(option.key),
            label: String(option.label),
            dimension: String(option.dimension),
            score: Number(option.score),
          })),
        });
        return result;
      },
      {},
    );

    const seedMap = PERSONALITY_TESTS.reduce<Record<string, PersonalityTestDefinition>>(
      (result, test) => {
        result[test.code] = test;
        return result;
      },
      {},
    );

    return configs.map((config) => {
      const seed = seedMap[config.code];
      const normalizedConfig = this.normalizePersonalityConfig(config.configJson, seed);

      return {
        code: config.code,
        title: config.title,
        subtitle: config.subtitle,
        description: config.description,
        intro: config.intro,
        durationMinutes: config.durationMinutes,
        tags: this.normalizeStringArray(config.tagsJson, seed?.tags ?? []),
        dimensionLabels: normalizedConfig.dimensionLabels,
        profiles: normalizedConfig.profiles,
        sharePoster: normalizedConfig.sharePoster,
        questions:
          groupedQuestions[config.code]?.length
            ? groupedQuestions[config.code]
            : seed?.questions ??
              this.createFallbackPersonalityQuestions(
                config.code,
                normalizedConfig.dimensionLabels,
              ),
      };
    });
  }

  private async seedQuestionBank() {
    await this.assessmentQuestionRepository.upsert(
      PERSONALITY_TESTS.flatMap((test) =>
        test.questions.map((question, index) => ({
          category: 'personality',
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
      PERSONALITY_TESTS.map((test) => ({
        category: 'personality',
        code: test.code,
        title: test.title,
        subtitle: test.subtitle,
        description: test.description,
        intro: test.intro,
        durationMinutes: test.durationMinutes,
        optionSchema: 'personality',
        tagsJson: test.tags,
        configJson: {
          dimensionLabels: test.dimensionLabels,
          profiles: test.profiles,
          sharePoster: test.sharePoster ?? createDefaultSharePosterConfig('personality'),
        },
        status: 'published',
      })),
      ['category', 'code'],
    );
  }

  private buildResultPayload(
    test: PersonalityTestDefinition,
    dimensionScores: Record<string, number>,
    totalScore: number,
  ) {
    const dominantDimensionEntry =
      Object.entries(dimensionScores).sort((left, right) => right[1] - left[1])[0] ??
      Object.entries(test.dimensionLabels)[0];
    const [dominantDimensionKey, dominantDimensionScore] = dominantDimensionEntry;
    const dominantProfile = test.profiles[dominantDimensionKey];
    const maxScore = test.questions.length * 4;
    const score = Math.round((totalScore / maxScore) * 100);
    const level = score >= 85 ? 'high' : score >= 70 ? 'balanced' : 'gentle';
    const levelSummary =
      level === 'high'
        ? '你的状态已经比较成型，优势清晰，适合把它用在持续表达和稳定推进上。'
        : level === 'balanced'
          ? '你的状态比较均衡，已经有明显倾向，也保留了不错的弹性。'
          : '你的风格正在形成中，先观察和练习，比急着定义自己更重要。';

    const sortedDimensionScores = Object.entries(dimensionScores)
      .map(([key, value]) => ({
        key,
        label: test.dimensionLabels[key],
        value,
        ratio: totalScore ? Math.round((value / totalScore) * 100) : 0,
      }))
      .sort((left, right) => right.value - left.value);

    return {
      title: dominantProfile.title,
      subtitle: `${test.dimensionLabels[dominantDimensionKey]}更突出，说明你在这类场景下最有自然优势。`,
      summary: `${dominantProfile.summary}${levelSummary}`,
      level,
      score,
      dominantDimension: {
        key: dominantDimensionKey,
        label: test.dimensionLabels[dominantDimensionKey],
        value: dominantDimensionScore,
      },
      dimensionScores: sortedDimensionScores,
      strengths: dominantProfile.strengths,
      suggestions: dominantProfile.suggestions,
      sharePoster: this.renderSharePoster(test, {
        resultTitle: dominantProfile.title,
        subtitle: `${test.dimensionLabels[dominantDimensionKey]}更突出，说明你在这类场景下最有自然优势。`,
        score: String(score),
        summary: `${dominantProfile.summary}${levelSummary}`,
        level,
        dominantDimensionLabel: test.dimensionLabels[dominantDimensionKey],
      }),
      completedAt: new Date().toISOString(),
    };
  }

  private async findTestOrThrow(code: string) {
    const tests = await this.loadTests();
    const test = tests.find((item) => item.code === code);

    if (!test) {
      throw new NotFoundException('测评不存在或暂未开放');
    }

    return test;
  }

  private normalizePersonalityConfig(
    configJson: unknown,
    seed?: PersonalityTestDefinition,
  ) {
    const configRecord = this.asRecord(configJson);
    const dimensionSource = this.asRecord(configRecord.dimensionLabels);
    const dimensionEntries = Object.entries(dimensionSource).filter(
      ([key, value]) => key.trim() && typeof value === 'string' && value.trim(),
    );
    const dimensionLabels =
      dimensionEntries.length > 0
        ? Object.fromEntries(
            dimensionEntries.map(([key, value]) => [key.trim(), String(value).trim()]),
          )
        : seed?.dimensionLabels ?? {
            focus: '专注感',
            balance: '稳定感',
            spark: '灵感感',
          };
    const profileSource = this.asRecord(configRecord.profiles);
    const profiles = Object.keys(dimensionLabels).reduce<
      Record<string, PersonalityProfileDefinition>
    >((result, key) => {
      const rawProfile = this.asRecord(profileSource[key]);
      const seedProfile = seed?.profiles[key];
      const label = dimensionLabels[key];
      result[key] = {
        title: this.pickString(rawProfile.title, seedProfile?.title ?? `${label}优势型`),
        summary: this.pickString(
          rawProfile.summary,
          seedProfile?.summary ?? `你的${label}更突出，适合继续观察这种自然优势。`,
        ),
        strengths: this.pickStringArray(rawProfile.strengths, seedProfile?.strengths ?? [
          `在${label}相关场景里更容易表现自然`,
          '适合补充更具体的优势描述',
        ]),
        suggestions: this.pickStringArray(rawProfile.suggestions, seedProfile?.suggestions ?? [
          '建议补一条更具体的行动建议',
          '建议把文案写得更贴近用户日常语言',
        ]),
      };
      return result;
    }, {});

    return {
      dimensionLabels,
      profiles,
      sharePoster: this.normalizeSharePoster(configRecord.sharePoster),
    };
  }

  private createFallbackPersonalityQuestions(
    code: string,
    dimensionLabels: Record<string, string>,
  ) {
    const [firstKey, secondKey, thirdKey] = Object.keys(dimensionLabels);
    return [1, 2, 3].map((index) => ({
      id: `${code}-${index}`,
      prompt: `请补充第 ${index} 题的正式题干`,
      options: [
        {
          key: 'A',
          label: `偏向${dimensionLabels[firstKey] ?? '第一维度'}`,
          dimension: firstKey,
          score: 4,
        },
        {
          key: 'B',
          label: `偏向${dimensionLabels[secondKey] ?? '第二维度'}`,
          dimension: secondKey,
          score: 3,
        },
        {
          key: 'C',
          label: `偏向${dimensionLabels[thirdKey] ?? '第三维度'}`,
          dimension: thirdKey,
          score: 3,
        },
      ],
    }));
  }

  private normalizeStringArray(value: unknown, fallback: string[]) {
    if (!Array.isArray(value)) {
      return fallback;
    }

    const items = value.map((item) => String(item).trim()).filter(Boolean);
    return items.length > 0 ? items : fallback;
  }

  private pickStringArray(value: unknown, fallback: string[]) {
    return this.normalizeStringArray(value, fallback);
  }

  private pickString(value: unknown, fallback: string) {
    return typeof value === 'string' && value.trim() ? value.trim() : fallback;
  }

  private normalizeSharePoster(value: unknown) {
    const record = this.asRecord(value);
    const fallback = createDefaultSharePosterConfig('personality');

    return {
      headlineTemplate: this.pickString(record.headlineTemplate, fallback.headlineTemplate),
      subtitleTemplate: this.pickString(record.subtitleTemplate, fallback.subtitleTemplate),
      accentText: this.pickString(record.accentText, fallback.accentText),
      footerText: this.pickString(record.footerText, fallback.footerText),
      themeName: this.pickString(record.themeName, fallback.themeName),
    };
  }

  private renderSharePoster(
    test: PersonalityTestDefinition,
    payload: {
      resultTitle: string;
      subtitle: string;
      summary: string;
      score: string;
      level: string;
      dominantDimensionLabel: string;
    },
  ) {
    const config = test.sharePoster ?? createDefaultSharePosterConfig('personality');
    const variables: Record<string, string> = {
      resultTitle: payload.resultTitle,
      testTitle: test.title,
      subtitle: payload.subtitle,
      summary: payload.summary,
      score: payload.score,
      level: payload.level,
      dominantDimensionLabel: payload.dominantDimensionLabel,
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

  private serializeTestSummary(test: PersonalityTestDefinition) {
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
      dominantDimension?: { label?: string };
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
      dominantDimensionLabel: resultData.dominantDimension?.label ?? '',
      completedAt: resultData.completedAt ?? record.createdAt.toISOString(),
    };
  }
}
