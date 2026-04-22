import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssessmentQuestionEntity } from '../database/entities/assessment-question.entity';
import { AssessmentTestConfigEntity } from '../database/entities/assessment-test-config.entity';
import { AssessmentTestGroupEntity } from '../database/entities/assessment-test-group.entity';
import { CreateQuestionBankGroupDto } from './dto/create-question-bank-group.dto';
import { CreateQuestionBankTestDto } from './dto/create-question-bank-test.dto';
import { UpdateQuestionBankDto } from './dto/update-question-bank.dto';
import {
  EMOTION_TESTS,
  PERSONALITY_TESTS,
  QUESTION_BANK_CATEGORY_LABELS,
  createDefaultSharePosterConfig,
  type EmotionThresholdDefinition,
  type PersonalityProfileDefinition,
  type QuestionBankCategory,
  type SharePosterConfigDefinition,
} from './question-bank.defaults';

type QuestionBankOptionSchema = 'personality' | 'emotion';

type QuestionBankOption = {
  key: string;
  label: string;
  score: number;
  dimension?: string;
};

type DraftQuestion = {
  questionId: string;
  prompt: string;
  options: QuestionBankOption[];
};

type PersonalityConfigPayload = {
  dimensionLabels: Record<string, string>;
  profiles: Record<string, PersonalityProfileDefinition>;
  sharePoster: SharePosterConfigDefinition;
};

type EmotionConfigPayload = {
  disclaimer: string;
  relaxSteps: string[];
  thresholds: EmotionThresholdDefinition[];
  sharePoster: SharePosterConfigDefinition;
};

const DEFAULT_PERSONALITY_DIMENSIONS: Record<string, string> = {
  focus: '专注感',
  balance: '稳定感',
  spark: '灵感感',
};

const DEFAULT_EMOTION_THRESHOLDS: EmotionThresholdDefinition[] = [
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
];

const DEFAULT_GROUPS: Array<{
  category: QuestionBankCategory;
  code: string;
  label: string;
  description: string;
  sortOrder: number;
}> = [
  {
    category: 'personality',
    code: 'default',
    label: '默认分类',
    description: '默认的性格测评运营分类。',
    sortOrder: 100,
  },
  {
    category: 'emotion',
    code: 'default',
    label: '默认分类',
    description: '默认的情绪自检运营分类。',
    sortOrder: 100,
  },
];

@Injectable()
export class QuestionBankService {
  constructor(
    @InjectRepository(AssessmentQuestionEntity)
    private readonly assessmentQuestionRepository: Repository<AssessmentQuestionEntity>,
    @InjectRepository(AssessmentTestConfigEntity)
    private readonly assessmentTestConfigRepository: Repository<AssessmentTestConfigEntity>,
    @InjectRepository(AssessmentTestGroupEntity)
    private readonly assessmentTestGroupRepository: Repository<AssessmentTestGroupEntity>,
  ) {}

  async getTests(category?: string) {
    await this.ensureDefaults();

    const selectedCategory = this.normalizeCategory(category);
    const [configs, records, groups] = await Promise.all([
      this.assessmentTestConfigRepository.find({
        where: selectedCategory
          ? {
              category: selectedCategory,
              status: 'published',
            }
          : {
              status: 'published',
            },
        order: {
          category: 'ASC',
          code: 'ASC',
        },
      }),
      this.assessmentQuestionRepository.find({
        where: selectedCategory
          ? {
              category: selectedCategory,
              status: 'published',
            }
          : {
              status: 'published',
            },
        order: {
          category: 'ASC',
          testCode: 'ASC',
          sortOrder: 'ASC',
        },
      }),
      this.assessmentTestGroupRepository.find({
        where: selectedCategory
          ? {
              category: selectedCategory,
              status: 'published',
            }
          : {
              status: 'published',
            },
        order: {
          category: 'ASC',
          sortOrder: 'ASC',
          createdAt: 'ASC',
        },
      }),
    ]);

    const groupMap = new Map(
      groups.map((group) => [`${group.category}:${group.code}`, group] as const),
    );
    const grouped = records.reduce<
      Record<string, { count: number; latestUpdate: Date | null }>
    >((result, item) => {
      const key = `${item.category}:${item.testCode}`;
      const current = result[key] ?? { count: 0, latestUpdate: null };
      current.count += 1;
      current.latestUpdate =
        !current.latestUpdate || item.updatedAt > current.latestUpdate
          ? item.updatedAt
          : current.latestUpdate;
      result[key] = current;
      return result;
    }, {});

    return {
      code: 0,
      message: 'ok',
      data: {
        categories: [
          { value: 'personality', label: '性格测评' },
          { value: 'emotion', label: '情绪自检' },
        ],
        tests: configs.map((config) => {
          const key = `${config.category}:${config.code}`;
          const group = grouped[key];
          return this.serializeTestSummary(
            config,
            groupMap.get(`${config.category}:${config.groupCode}`) ?? null,
            group?.count ?? 0,
            group?.latestUpdate,
          );
        }),
      },
      timestamp: new Date().toISOString(),
    };
  }

  async getGroups(category?: string) {
    await this.ensureDefaults();

    const selectedCategory = this.normalizeCategory(category);
    const groups = await this.assessmentTestGroupRepository.find({
      where: selectedCategory
        ? {
            category: selectedCategory,
            status: 'published',
          }
        : {
            status: 'published',
          },
      order: {
        category: 'ASC',
        sortOrder: 'ASC',
        createdAt: 'ASC',
      },
    });

    return {
      code: 0,
      message: 'ok',
      data: {
        groups: groups.map((group) => ({
          category: group.category,
          code: group.code,
          label: group.label,
          description: group.description,
          sortOrder: group.sortOrder,
          isDefault: group.code === 'default',
        })),
      },
      timestamp: new Date().toISOString(),
    };
  }

  async createGroup(dto: CreateQuestionBankGroupDto) {
    await this.ensureDefaults();

    const category = this.normalizeCategory(dto.category);
    if (!category) {
      throw new BadRequestException('暂不支持该题库分类');
    }

    const exists = await this.assessmentTestGroupRepository.findOne({
      where: {
        category,
        code: dto.code,
      },
    });

    if (exists) {
      throw new BadRequestException('该分类编码已存在，请换一个 code');
    }

    const latest = await this.assessmentTestGroupRepository.findOne({
      where: {
        category,
        status: 'published',
      },
      order: {
        sortOrder: 'DESC',
        createdAt: 'DESC',
      },
    });

    await this.assessmentTestGroupRepository.save(
      this.assessmentTestGroupRepository.create({
        category,
        code: dto.code,
        label: dto.label.trim(),
        description: dto.description?.trim() || '',
        sortOrder: (latest?.sortOrder ?? 90) + 10,
        status: 'published',
      }),
    );

    return this.getGroups(category);
  }

  async deleteGroup(category: string, code: string) {
    await this.ensureDefaults();

    const normalizedCategory = this.normalizeCategory(category);
    if (!normalizedCategory) {
      throw new NotFoundException('分类不存在');
    }

    if (code === 'default') {
      throw new BadRequestException('默认分类不能删除');
    }

    const group = await this.assessmentTestGroupRepository.findOne({
      where: {
        category: normalizedCategory,
        code,
        status: 'published',
      },
    });

    if (!group) {
      throw new NotFoundException('分类不存在');
    }

    const usedCount = await this.assessmentTestConfigRepository.count({
      where: {
        category: normalizedCategory,
        groupCode: code,
        status: 'published',
      },
    });

    if (usedCount > 0) {
      throw new BadRequestException('该分类下仍有测试集，请先调整测试集归属');
    }

    await this.assessmentTestGroupRepository.delete({
      category: normalizedCategory,
      code,
    });

    return this.getGroups(normalizedCategory);
  }

  async getTestDetail(category: string, code: string) {
    await this.ensureDefaults();

    const config = await this.getConfigOrThrow(category, code);
    const [questions, groups] = await Promise.all([
      this.assessmentQuestionRepository.find({
        where: {
          category: config.category,
          testCode: config.code,
          status: 'published',
        },
        order: {
          sortOrder: 'ASC',
        },
      }),
      this.assessmentTestGroupRepository.find({
        where: {
          category: config.category,
          status: 'published',
        },
        order: {
          sortOrder: 'ASC',
        },
      }),
    ]);

    return {
      code: 0,
      message: 'ok',
      data: {
        test: this.serializeTestDetail(
          config,
          questions,
          groups.find((item) => item.code === config.groupCode) ?? null,
        ),
      },
      timestamp: new Date().toISOString(),
    };
  }

  async createTest(dto: CreateQuestionBankTestDto) {
    await this.ensureDefaults();

    const category = this.normalizeCategory(dto.category);
    if (!category) {
      throw new BadRequestException('暂不支持该题库分类');
    }

    const exists = await this.assessmentTestConfigRepository.findOne({
      where: {
        category,
        code: dto.code,
      },
    });

    if (exists) {
      throw new BadRequestException('该测试集编码已存在，请换一个 code');
    }

    const groupCode = await this.ensureGroupExists(category, dto.groupCode ?? 'default');
    const draft = dto.cloneFromCode
      ? await this.createClonedDraft(category, dto, groupCode)
      : this.createFreshDraft(category, dto, groupCode);

    const savedConfig = await this.assessmentTestConfigRepository.save(
      this.assessmentTestConfigRepository.create({
        category,
        code: dto.code,
        groupCode,
        title: draft.title,
        subtitle: draft.subtitle,
        description: draft.description,
        intro: draft.intro,
        durationMinutes: draft.durationMinutes,
        optionSchema: draft.optionSchema,
        tagsJson: draft.tags,
        configJson: draft.configJson,
        status: 'published',
      }),
    );

    await this.assessmentQuestionRepository.save(
      draft.questions.map((question, index) =>
        this.assessmentQuestionRepository.create({
          category,
          testCode: dto.code,
          questionId: question.questionId,
          prompt: question.prompt,
          optionsJson: question.options.map((option) => ({ ...option })),
          sortOrder: index + 1,
          status: 'published',
        }),
      ),
    );

    return this.getTestDetail(savedConfig.category, savedConfig.code);
  }

  async updateTest(category: string, code: string, dto: UpdateQuestionBankDto) {
    await this.ensureDefaults();

    const config = await this.getConfigOrThrow(category, code);
    const optionSchema = this.normalizeOptionSchema(config.optionSchema, config.category);
    const groupCode = await this.ensureGroupExists(config.category as QuestionBankCategory, dto.groupCode);

    const normalizedConfig =
      optionSchema === 'personality'
        ? this.normalizePersonalityConfig(dto.dimensionLabels, dto.profiles, dto.sharePoster)
        : this.normalizeEmotionConfig(
            dto.disclaimer,
            dto.relaxSteps,
            dto.thresholds,
            dto.sharePoster,
          );

    await this.assessmentTestConfigRepository.save({
      ...config,
      groupCode,
      title: dto.title.trim(),
      subtitle: dto.subtitle.trim(),
      description: dto.description.trim(),
      intro: dto.intro.trim(),
      durationMinutes: dto.durationMinutes,
      tagsJson: dto.tags.map((tag) => tag.trim()).filter(Boolean),
      configJson: normalizedConfig,
      status: 'published',
    });

    await this.assessmentQuestionRepository.delete({
      category: config.category,
      testCode: config.code,
    });

    const defaultDimension =
      optionSchema === 'personality'
        ? Object.keys((normalizedConfig as PersonalityConfigPayload).dimensionLabels)[0] ?? ''
        : '';

    await this.assessmentQuestionRepository.save(
      dto.questions.map((question, index) =>
        this.assessmentQuestionRepository.create({
          category: config.category,
          testCode: config.code,
          questionId: question.questionId?.trim() || `${config.code}-${index + 1}`,
          prompt: question.prompt.trim(),
          optionsJson: question.options.map((option) => ({
            key: option.key,
            label: option.label,
            score: option.score,
            ...(optionSchema === 'personality'
              ? {
                  dimension: option.dimension?.trim() || defaultDimension,
                }
              : {}),
          })),
          sortOrder: index + 1,
          status: 'published',
        }),
      ),
    );

    return this.getTestDetail(category, code);
  }

  private async ensureDefaults() {
    await this.seedDefaultGroups();
    await this.seedDefaultConfigs();
    await this.seedDefaultQuestions();
  }

  private async seedDefaultGroups() {
    for (const item of DEFAULT_GROUPS) {
      const existing = await this.assessmentTestGroupRepository.findOne({
        where: {
          category: item.category,
          code: item.code,
        },
      });

      if (existing) {
        if (
          existing.label !== item.label ||
          existing.description !== item.description ||
          existing.sortOrder !== item.sortOrder ||
          existing.status !== 'published'
        ) {
          await this.assessmentTestGroupRepository.save({
            ...existing,
            label: item.label,
            description: item.description,
            sortOrder: item.sortOrder,
            status: 'published',
          });
        }
        continue;
      }

      await this.assessmentTestGroupRepository.save(
        this.assessmentTestGroupRepository.create({
          category: item.category,
          code: item.code,
          label: item.label,
          description: item.description,
          sortOrder: item.sortOrder,
          status: 'published',
        }),
      );
    }
  }

  private async seedDefaultConfigs() {
    await this.assessmentTestConfigRepository.upsert(
      [
        ...PERSONALITY_TESTS.map((test) => ({
          category: 'personality',
          code: test.code,
          groupCode: 'default',
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
            sharePoster: createDefaultSharePosterConfig('personality'),
          },
          status: 'published',
        })),
        ...EMOTION_TESTS.map((test) => ({
          category: 'emotion',
          code: test.code,
          groupCode: 'default',
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
            sharePoster: createDefaultSharePosterConfig('emotion'),
          },
          status: 'published',
        })),
      ],
      ['category', 'code'],
    );
  }

  private async seedDefaultQuestions() {
    await this.assessmentQuestionRepository.upsert(
      [
        ...PERSONALITY_TESTS.flatMap((test) =>
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
        ...EMOTION_TESTS.flatMap((test) =>
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
      ],
      ['category', 'testCode', 'questionId'],
    );
  }

  private async getConfigOrThrow(category: string, code: string) {
    const normalizedCategory = this.normalizeCategory(category);

    if (!normalizedCategory) {
      throw new NotFoundException('题库不存在或暂未开放');
    }

    const config = await this.assessmentTestConfigRepository.findOne({
      where: {
        category: normalizedCategory,
        code,
        status: 'published',
      },
    });

    if (!config) {
      throw new NotFoundException('题库不存在或暂未开放');
    }

    return config;
  }

  private serializeTestSummary(
    config: AssessmentTestConfigEntity,
    group: AssessmentTestGroupEntity | null,
    questionCount: number,
    latestQuestionUpdate: Date | null,
  ) {
    const optionSchema = this.normalizeOptionSchema(config.optionSchema, config.category);
    const detail =
      optionSchema === 'personality'
        ? this.normalizePersonalityConfig(
            this.asRecord(config.configJson).dimensionLabels,
            this.asRecord(config.configJson).profiles,
            this.asRecord(config.configJson).sharePoster,
          )
        : null;
    const updatedAt =
      latestQuestionUpdate && latestQuestionUpdate > config.updatedAt
        ? latestQuestionUpdate
        : config.updatedAt;

    return {
      category: config.category as QuestionBankCategory,
      categoryLabel:
        QUESTION_BANK_CATEGORY_LABELS[config.category as QuestionBankCategory] ?? '题库',
      code: config.code,
      groupCode: config.groupCode,
      groupLabel: group?.label ?? '未分组',
      title: config.title,
      subtitle: config.subtitle,
      description: config.description,
      questionCount,
      optionSchema,
      dimensionLabels: detail?.dimensionLabels,
      updatedAt: updatedAt.toISOString(),
    };
  }

  private serializeTestDetail(
    config: AssessmentTestConfigEntity,
    questions: AssessmentQuestionEntity[],
    group: AssessmentTestGroupEntity | null,
  ) {
    const summary = this.serializeTestSummary(
      config,
      group,
      questions.length,
      questions[questions.length - 1]?.updatedAt ?? null,
    );
    const optionSchema = this.normalizeOptionSchema(config.optionSchema, config.category);
    const personalityConfig = this.normalizePersonalityConfig(
      this.asRecord(config.configJson).dimensionLabels,
      this.asRecord(config.configJson).profiles,
      this.asRecord(config.configJson).sharePoster,
    );
    const emotionConfig = this.normalizeEmotionConfig(
      this.asRecord(config.configJson).disclaimer,
      this.asRecord(config.configJson).relaxSteps,
      this.asRecord(config.configJson).thresholds,
      this.asRecord(config.configJson).sharePoster,
    );

    return {
      ...summary,
      intro: config.intro,
      durationMinutes: config.durationMinutes,
      tags: this.normalizeTags(config.tagsJson),
      status: config.status,
      questions: questions.map((question) => ({
        id: question.id,
        questionId: question.questionId,
        prompt: question.prompt,
        sortOrder: question.sortOrder,
        options: ((question.optionsJson as unknown) as Array<Record<string, unknown>>).map(
          (option) => ({
            key: String(option.key ?? ''),
            label: String(option.label ?? ''),
            score: Number(option.score ?? 0),
            ...(optionSchema === 'personality' && option.dimension
              ? { dimension: String(option.dimension) }
              : {}),
          }),
        ),
      })),
      ...(optionSchema === 'personality'
        ? {
            dimensionLabels: personalityConfig.dimensionLabels,
            profiles: personalityConfig.profiles,
            sharePoster: personalityConfig.sharePoster,
          }
        : {
            disclaimer: emotionConfig.disclaimer,
            relaxSteps: emotionConfig.relaxSteps,
            thresholds: emotionConfig.thresholds,
            sharePoster: emotionConfig.sharePoster,
          }),
    };
  }

  private createFreshDraft(
    category: QuestionBankCategory,
    dto: CreateQuestionBankTestDto,
    groupCode: string,
  ) {
    if (category === 'personality') {
      const dimensionLabels = { ...DEFAULT_PERSONALITY_DIMENSIONS };
      return {
        groupCode,
        optionSchema: 'personality' as const,
        title: dto.title.trim(),
        subtitle: dto.subtitle?.trim() || '新建性格测评',
        description:
          dto.description?.trim() || '一套新的性格测评，适合继续补充题目与结果画像。',
        intro: '先用 3 道示例题搭起结构，再逐步替换成正式题目。',
        durationMinutes: 3,
        tags: ['新建测试集', '待完善'],
        configJson: {
          dimensionLabels,
          profiles: this.createDefaultPersonalityProfiles(dimensionLabels),
          sharePoster: createDefaultSharePosterConfig('personality'),
        },
        questions: this.createStarterPersonalityQuestions(dto.code, dimensionLabels),
      };
    }

    return {
      groupCode,
      optionSchema: 'emotion' as const,
      title: dto.title.trim(),
      subtitle: dto.subtitle?.trim() || '新建情绪自检',
      description:
        dto.description?.trim() || '一套新的情绪自检题库，适合继续补充阈值与支持提醒。',
      intro: '先用 3 道示例题搭起结构，再替换成正式量表题目。',
      durationMinutes: 3,
      tags: ['新建测试集', '待完善'],
      configJson: {
        disclaimer:
          '本结果仅用于日常自我观察，不构成医学诊断或治疗建议；如持续不适，请及时联系专业机构。',
        relaxSteps: [
          '先做 1 分钟缓慢呼气，让身体稍微降下来。',
          '把当前最担心的一件事写成一句话，再写下一个最小动作。',
          '如果已经明显影响生活，请优先联系现实中的支持资源。',
        ],
        thresholds: DEFAULT_EMOTION_THRESHOLDS,
        sharePoster: createDefaultSharePosterConfig('emotion'),
      },
      questions: this.createStarterEmotionQuestions(dto.code),
    };
  }

  private async createClonedDraft(
    category: QuestionBankCategory,
    dto: CreateQuestionBankTestDto,
    groupCode: string,
  ) {
    const source = await this.getConfigOrThrow(category, dto.cloneFromCode ?? '');
    const questions = await this.assessmentQuestionRepository.find({
      where: {
        category,
        testCode: source.code,
        status: 'published',
      },
      order: {
        sortOrder: 'ASC',
      },
    });

    const optionSchema = this.normalizeOptionSchema(source.optionSchema, source.category);

    return {
      groupCode,
      optionSchema,
      title: dto.title.trim(),
      subtitle: dto.subtitle?.trim() || `${source.subtitle} · 副本`,
      description: dto.description?.trim() || source.description,
      intro: source.intro,
      durationMinutes: source.durationMinutes,
      tags: this.normalizeTags(source.tagsJson),
      configJson: this.asRecord(source.configJson),
      questions: questions.map((question, index) => ({
        questionId: `${dto.code}-${index + 1}`,
        prompt: question.prompt,
        options: ((question.optionsJson as unknown) as Array<Record<string, unknown>>).map(
          (option) => ({
            key: String(option.key ?? ''),
            label: String(option.label ?? ''),
            score: Number(option.score ?? 0),
            ...(optionSchema === 'personality' && option.dimension
              ? { dimension: String(option.dimension) }
              : {}),
          }),
        ),
      })),
    };
  }

  private createStarterPersonalityQuestions(
    code: string,
    dimensionLabels: Record<string, string>,
  ): DraftQuestion[] {
    const [firstKey, secondKey, thirdKey] = Object.keys(dimensionLabels);
    return [1, 2, 3].map((index) => ({
      questionId: `${code}-${index}`,
      prompt: `请补充第 ${index} 题的正式题干`,
      options: [
        {
          key: 'A',
          label: `偏向${dimensionLabels[firstKey] ?? '第一维度'}`,
          score: 4,
          dimension: firstKey,
        },
        {
          key: 'B',
          label: `偏向${dimensionLabels[secondKey] ?? '第二维度'}`,
          score: 3,
          dimension: secondKey,
        },
        {
          key: 'C',
          label: `偏向${dimensionLabels[thirdKey] ?? '第三维度'}`,
          score: 3,
          dimension: thirdKey,
        },
      ],
    }));
  }

  private createStarterEmotionQuestions(code: string): DraftQuestion[] {
    return [1, 2, 3].map((index) => ({
      questionId: `${code}-${index}`,
      prompt: `请补充第 ${index} 题的正式题干`,
      options: [
        { key: 'A', label: '几乎没有', score: 0 },
        { key: 'B', label: '偶尔会有', score: 1 },
        { key: 'C', label: '经常会有', score: 2 },
        { key: 'D', label: '几乎每天', score: 3 },
      ],
    }));
  }

  private normalizeCategory(category?: string): QuestionBankCategory | null {
    if (category === 'personality' || category === 'emotion') {
      return category;
    }

    return null;
  }

  private normalizeOptionSchema(
    optionSchema: string,
    category: string,
  ): QuestionBankOptionSchema {
    if (optionSchema === 'personality' || optionSchema === 'emotion') {
      return optionSchema;
    }

    return category === 'emotion' ? 'emotion' : 'personality';
  }

  private normalizeTags(value: unknown) {
    if (!Array.isArray(value)) {
      return [];
    }

    return value.map((item) => String(item)).filter(Boolean);
  }

  private normalizePersonalityConfig(
    dimensionLabelsInput?: unknown,
    profilesInput?: unknown,
    sharePosterInput?: unknown,
  ): PersonalityConfigPayload {
    const dimensionSource = this.asRecord(dimensionLabelsInput);
    const dimensionEntries = Object.entries(dimensionSource).filter(
      ([key, label]) => key.trim() && typeof label === 'string' && label.trim(),
    );
    const dimensionLabels =
      dimensionEntries.length > 0
        ? Object.fromEntries(
            dimensionEntries.map(([key, label]) => [key.trim(), String(label).trim()]),
          )
        : { ...DEFAULT_PERSONALITY_DIMENSIONS };

    const profilesSource = this.asRecord(profilesInput);
    const profiles = Object.keys(dimensionLabels).reduce<
      Record<string, PersonalityProfileDefinition>
    >((result, key) => {
      const rawProfile = this.asRecord(profilesSource[key]);
      const label = dimensionLabels[key];
      result[key] = {
        title: this.pickString(rawProfile.title, `${label}优势型`),
        summary: this.pickString(
          rawProfile.summary,
          `你的${label}更突出，适合继续补充更细的结果画像。`,
        ),
        strengths: this.pickStringArray(rawProfile.strengths, [
          `更容易在${label}相关场景里发挥自然优势`,
          '适合继续补充 2 到 3 条具体优势描述',
        ]),
        suggestions: this.pickStringArray(rawProfile.suggestions, [
          '建议再补一条更具体的行动建议',
          '建议把语言写得更像用户能直接执行的提醒',
        ]),
      };
      return result;
    }, {});

    return {
      dimensionLabels,
      profiles,
      sharePoster: this.normalizeSharePoster(sharePosterInput, 'personality'),
    };
  }

  private normalizeEmotionConfig(
    disclaimerInput?: unknown,
    relaxStepsInput?: unknown,
    thresholdsInput?: unknown,
    sharePosterInput?: unknown,
  ): EmotionConfigPayload {
    const relaxSteps = this.pickStringArray(relaxStepsInput, [
      '先做 1 分钟缓慢呼气，让身体稍微降下来。',
      '把当前最担心的一件事写成一句话，再写下一个最小动作。',
      '如果已经明显影响生活，请优先联系现实中的支持资源。',
    ]);

    const thresholds = Array.isArray(thresholdsInput)
      ? thresholdsInput
          .map((item) => this.normalizeThresholdItem(item))
          .filter((item): item is EmotionThresholdDefinition => Boolean(item))
      : [];

    return {
      disclaimer: this.pickString(
        disclaimerInput,
        '本结果仅用于日常自我观察，不构成医学诊断或治疗建议；如持续不适，请及时联系专业机构。',
      ),
      relaxSteps,
      thresholds: thresholds.length > 0 ? thresholds : DEFAULT_EMOTION_THRESHOLDS,
      sharePoster: this.normalizeSharePoster(sharePosterInput, 'emotion'),
    };
  }

  private normalizeSharePoster(
    value: unknown,
    category: QuestionBankCategory,
  ): SharePosterConfigDefinition {
    const record = this.asRecord(value);
    const fallback = createDefaultSharePosterConfig(category);

    return {
      headlineTemplate: this.pickString(record.headlineTemplate, fallback.headlineTemplate),
      subtitleTemplate: this.pickString(record.subtitleTemplate, fallback.subtitleTemplate),
      accentText: this.pickString(record.accentText, fallback.accentText),
      footerText: this.pickString(record.footerText, fallback.footerText),
      themeName: this.pickString(record.themeName, fallback.themeName),
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

  private createDefaultPersonalityProfiles(dimensionLabels: Record<string, string>) {
    return Object.keys(dimensionLabels).reduce<Record<string, PersonalityProfileDefinition>>(
      (result, key) => {
        const label = dimensionLabels[key];
        result[key] = {
          title: `${label}优势型`,
          summary: `你的${label}更突出，后续可以继续补充更细的画像文案和适用场景。`,
          strengths: [
            `在${label}相关场景里更容易表现自然`,
            '适合继续补充 2 到 3 条更具体的优势描述',
          ],
          suggestions: [
            '建议补一条更具体的行动建议',
            '建议把文案写得更贴近用户日常语言',
          ],
        };
        return result;
      },
      {},
    );
  }

  private async ensureGroupExists(
    category: QuestionBankCategory,
    groupCode: string,
  ) {
    const code = groupCode?.trim() || 'default';
    const group = await this.assessmentTestGroupRepository.findOne({
      where: {
        category,
        code,
        status: 'published',
      },
    });

    if (!group) {
      throw new BadRequestException('所选运营分类不存在，请先创建分类');
    }

    return code;
  }

  private pickString(value: unknown, fallback: string) {
    return typeof value === 'string' && value.trim() ? value.trim() : fallback;
  }

  private pickStringArray(value: unknown, fallback: string[]) {
    if (!Array.isArray(value)) {
      return fallback;
    }

    const items = value.map((item) => String(item).trim()).filter(Boolean);
    return items.length > 0 ? items : fallback;
  }

  private asRecord(value: unknown) {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  }
}
