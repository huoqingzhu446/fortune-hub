<template>
  <div class="question-bank">
    <section class="question-bank__rail">
      <div class="question-bank__toolbar">
        <div class="question-bank__section-title">分类</div>
        <div class="question-bank__filters">
          <button
            v-for="item in categories"
            :key="item.value"
            class="question-bank__filter"
            :class="{ 'question-bank__filter--active': selectedCategory === item.value }"
            @click="switchCategory(item.value)"
          >
            {{ item.label }}
          </button>
        </div>

        <div class="question-bank__hero-actions">
          <el-button plain @click="openGroupDialog">管理分类</el-button>
          <el-button type="primary" plain @click="openCreateDialog">新增测试集</el-button>
        </div>
      </div>

      <div v-if="loadingList" class="question-bank__empty">
        正在同步题库列表...
      </div>

      <div v-else class="question-bank__test-list">
        <button
          v-for="item in tests"
          :key="`${item.category}:${item.code}`"
          class="question-bank__test-item"
          :class="{
            'question-bank__test-item--active':
              selectedKey === `${item.category}:${item.code}`,
          }"
          @click="openTest(item)"
        >
          <div class="question-bank__test-item-eyebrow">
            {{ item.categoryLabel }} · {{ item.groupLabel }}
          </div>
          <div class="question-bank__test-item-title">{{ item.title }}</div>
          <div class="question-bank__test-item-subtitle">{{ item.subtitle }}</div>
          <div class="question-bank__test-item-meta">
            <span>{{ item.questionCount }} 题</span>
            <span>{{ item.updatedAt ? formatDate(item.updatedAt) : '未更新' }}</span>
          </div>
        </button>
      </div>
    </section>

    <section class="question-bank__workspace">
      <div v-if="loadingDetail" class="question-bank__empty">
        正在载入题目详情...
      </div>

      <div v-else-if="activeTest" class="question-bank__editor">
        <div class="question-bank__hero">
          <div>
            <div class="question-bank__eyebrow">{{ activeTest.categoryLabel }}</div>
            <h2 class="question-bank__title">{{ activeTest.title }}</h2>
            <p class="question-bank__text">{{ activeTest.description }}</p>
          </div>

          <div class="question-bank__hero-actions">
            <el-button plain @click="addQuestion">新增题目</el-button>
            <el-button type="primary" :loading="saving" @click="saveTest">
              保存配置
            </el-button>
          </div>
        </div>

        <div class="question-bank__summary">
          <span>{{ editableQuestions.length }} 题</span>
          <span>{{ activeTest.optionSchema === 'personality' ? '带维度评分' : '量表阈值判定' }}</span>
          <span>{{ activeTest.groupLabel }}</span>
          <span v-if="activeTest.updatedAt">最近更新：{{ formatDate(activeTest.updatedAt) }}</span>
        </div>

        <article class="question-bank__panel">
          <div class="question-bank__panel-header">
            <div>
              <div class="question-bank__section-title">基础信息</div>
              <div class="question-bank__helper">
                这里决定测试集的标题、分类、简介、耗时和标签展示。
              </div>
            </div>
          </div>

          <div class="question-bank__field-grid question-bank__field-grid--three">
            <label class="question-bank__field">
              <span class="question-bank__field-label">标题</span>
              <el-input v-model="editableMeta.title" placeholder="例如 日常节奏感测评" />
            </label>
            <label class="question-bank__field">
              <span class="question-bank__field-label">运营分类</span>
              <el-select v-model="editableMeta.groupCode" placeholder="请选择分类">
                <el-option
                  v-for="group in currentGroups"
                  :key="group.code"
                  :label="group.label"
                  :value="group.code"
                />
              </el-select>
            </label>
            <label class="question-bank__field">
              <span class="question-bank__field-label">预计时长（分钟）</span>
              <el-input-number v-model="editableMeta.durationMinutes" :min="1" :max="30" />
            </label>
            <label class="question-bank__field question-bank__field--wide">
              <span class="question-bank__field-label">副标题</span>
              <el-input v-model="editableMeta.subtitle" placeholder="一句话解释这套测试" />
            </label>
            <label class="question-bank__field question-bank__field--wide">
              <span class="question-bank__field-label">说明文案</span>
              <el-input
                v-model="editableMeta.description"
                type="textarea"
                :rows="2"
                placeholder="展示在列表和详情顶部的简介"
              />
            </label>
            <label class="question-bank__field question-bank__field--wide">
              <span class="question-bank__field-label">答题引导</span>
              <el-input
                v-model="editableMeta.intro"
                type="textarea"
                :rows="2"
                placeholder="开始答题前给用户看的说明"
              />
            </label>
            <label class="question-bank__field question-bank__field--wide">
              <span class="question-bank__field-label">标签（每行一个）</span>
              <el-input
                v-model="editableMeta.tagsText"
                type="textarea"
                :rows="3"
                placeholder="入门推荐&#10;轻量 3 分钟"
              />
            </label>
          </div>
        </article>

        <article class="question-bank__panel">
          <div class="question-bank__panel-header">
            <div>
              <div class="question-bank__section-title">结果页分享海报</div>
              <div class="question-bank__helper">
                配置结果页展示的分享文案与主题，支持 `{resultTitle}`、`{testTitle}`、`{score}` 等变量。
              </div>
            </div>
          </div>

          <div class="question-bank__field-grid question-bank__field-grid--three">
            <label class="question-bank__field">
              <span class="question-bank__field-label">主标题模板</span>
              <el-input
                v-model="editablePoster.headlineTemplate"
                placeholder="例如 {resultTitle}"
              />
            </label>
            <label class="question-bank__field question-bank__field--wide">
              <span class="question-bank__field-label">副标题模板</span>
              <el-input
                v-model="editablePoster.subtitleTemplate"
                placeholder="例如 我刚完成了{testTitle}"
              />
            </label>
            <label class="question-bank__field">
              <span class="question-bank__field-label">强调文案</span>
              <el-input v-model="editablePoster.accentText" placeholder="例如 轻量测评 · 认识自己" />
            </label>
            <label class="question-bank__field">
              <span class="question-bank__field-label">主题名</span>
              <el-input v-model="editablePoster.themeName" placeholder="例如 fresh-mint" />
            </label>
            <label class="question-bank__field question-bank__field--wide">
              <span class="question-bank__field-label">底部文案</span>
              <el-input
                v-model="editablePoster.footerText"
                placeholder="例如 先看见自己的自然优势，再决定下一步怎么用。"
              />
            </label>
          </div>

          <div class="question-bank__poster-preview">
            <div class="question-bank__poster-shell">
              <div class="question-bank__poster-theme">{{ editablePoster.themeName || 'theme' }}</div>
              <div class="question-bank__poster-title">{{ editablePoster.headlineTemplate || '海报主标题' }}</div>
              <div class="question-bank__poster-subtitle">{{ editablePoster.subtitleTemplate || '海报副标题' }}</div>
              <div class="question-bank__poster-accent">{{ editablePoster.accentText || '强调文案' }}</div>
              <div class="question-bank__poster-footer">{{ editablePoster.footerText || '底部文案' }}</div>
            </div>
          </div>
        </article>

        <article v-if="activeTest.optionSchema === 'personality'" class="question-bank__panel">
          <div class="question-bank__panel-header">
            <div>
              <div class="question-bank__section-title">结果画像配置</div>
              <div class="question-bank__helper">
                配置维度名称和每个维度命中后的标题、总结、优势和建议。
              </div>
            </div>

            <el-button plain @click="addDimension">新增维度</el-button>
          </div>

          <div class="question-bank__dimension-list">
            <div
              v-for="(dimension, index) in editableDimensions"
              :key="`${dimension.key}-${index}`"
              class="question-bank__dimension-card"
            >
              <div class="question-bank__field-grid">
                <label class="question-bank__field">
                  <span class="question-bank__field-label">维度 key</span>
                  <el-input v-model="dimension.key" placeholder="例如 drive" @change="syncProfilesWithDimensions" />
                </label>
                <label class="question-bank__field">
                  <span class="question-bank__field-label">维度名称</span>
                  <el-input v-model="dimension.label" placeholder="例如 行动力" />
                </label>
              </div>
              <div class="question-bank__card-actions">
                <el-button
                  text
                  type="danger"
                  @click="removeDimension(index)"
                  :disabled="editableDimensions.length <= 1"
                >
                  删除维度
                </el-button>
              </div>
            </div>
          </div>

          <div class="question-bank__profile-list">
            <article
              v-for="dimension in editableDimensions"
              :key="dimension.key || dimension.label"
              class="question-bank__profile-card"
            >
              <div class="question-bank__section-title">
                {{ dimension.label || '未命名维度' }} 画像
              </div>
              <div class="question-bank__field-grid">
                <label class="question-bank__field">
                  <span class="question-bank__field-label">结果标题</span>
                  <el-input
                    v-model="editableProfiles[dimension.key].title"
                    placeholder="例如 轻快执行型"
                  />
                </label>
                <label class="question-bank__field question-bank__field--wide">
                  <span class="question-bank__field-label">结果总结</span>
                  <el-input
                    v-model="editableProfiles[dimension.key].summary"
                    type="textarea"
                    :rows="3"
                    placeholder="描述这个维度突出的用户画像"
                  />
                </label>
                <label class="question-bank__field question-bank__field--wide">
                  <span class="question-bank__field-label">优势（每行一条）</span>
                  <el-input
                    v-model="editableProfiles[dimension.key].strengthsText"
                    type="textarea"
                    :rows="4"
                    placeholder="例如 在高节奏任务里更容易快速启动"
                  />
                </label>
                <label class="question-bank__field question-bank__field--wide">
                  <span class="question-bank__field-label">建议（每行一条）</span>
                  <el-input
                    v-model="editableProfiles[dimension.key].suggestionsText"
                    type="textarea"
                    :rows="4"
                    placeholder="例如 建议在关键节点多留一点复盘时间"
                  />
                </label>
              </div>
            </article>
          </div>
        </article>

        <article v-else class="question-bank__panel">
          <div class="question-bank__panel-header">
            <div>
              <div class="question-bank__section-title">阈值与提醒配置</div>
              <div class="question-bank__helper">
                配置免责声明、放松建议和每个分数段对应的结果文案。
              </div>
            </div>

            <el-button plain @click="addThreshold">新增阈值段</el-button>
          </div>

          <div class="question-bank__field-grid">
            <label class="question-bank__field question-bank__field--wide">
              <span class="question-bank__field-label">免责声明</span>
              <el-input
                v-model="editableEmotionConfig.disclaimer"
                type="textarea"
                :rows="3"
                placeholder="提示这不是医疗诊断"
              />
            </label>
            <label class="question-bank__field question-bank__field--wide">
              <span class="question-bank__field-label">放松建议（每行一个）</span>
              <el-input
                v-model="editableEmotionConfig.relaxStepsText"
                type="textarea"
                :rows="4"
                placeholder="先做 1 分钟缓慢呼气"
              />
            </label>
          </div>

          <div class="question-bank__threshold-list">
            <article
              v-for="(threshold, index) in editableEmotionConfig.thresholds"
              :key="`${threshold.level}-${index}`"
              class="question-bank__threshold-card"
            >
              <div class="question-bank__panel-header">
                <div class="question-bank__section-title">阈值段 {{ index + 1 }}</div>
                <el-button
                  text
                  type="danger"
                  @click="removeThreshold(index)"
                  :disabled="editableEmotionConfig.thresholds.length <= 1"
                >
                  删除
                </el-button>
              </div>

              <div class="question-bank__field-grid question-bank__field-grid--three">
                <label class="question-bank__field">
                  <span class="question-bank__field-label">最高分</span>
                  <el-input-number v-model="threshold.maxScore" :min="0" :max="99" />
                </label>
                <label class="question-bank__field">
                  <span class="question-bank__field-label">风险等级</span>
                  <el-select v-model="threshold.level">
                    <el-option label="steady" value="steady" />
                    <el-option label="watch" value="watch" />
                    <el-option label="support" value="support" />
                    <el-option label="urgent" value="urgent" />
                  </el-select>
                </label>
                <label class="question-bank__field">
                  <span class="question-bank__field-label">结果标题</span>
                  <el-input v-model="threshold.title" placeholder="例如 平稳观察区" />
                </label>
                <label class="question-bank__field">
                  <span class="question-bank__field-label">副标题</span>
                  <el-input v-model="threshold.subtitle" placeholder="例如 最近整体还算稳定" />
                </label>
                <label class="question-bank__field question-bank__field--wide">
                  <span class="question-bank__field-label">总结</span>
                  <el-input v-model="threshold.summary" type="textarea" :rows="2" />
                </label>
                <label class="question-bank__field question-bank__field--wide">
                  <span class="question-bank__field-label">主要建议</span>
                  <el-input v-model="threshold.primarySuggestion" type="textarea" :rows="2" />
                </label>
                <label class="question-bank__field question-bank__field--wide">
                  <span class="question-bank__field-label">支持提醒</span>
                  <el-input v-model="threshold.supportSignal" type="textarea" :rows="2" />
                </label>
              </div>
            </article>
          </div>
        </article>

        <div class="question-bank__question-list">
          <article
            v-for="(question, questionIndex) in editableQuestions"
            :key="`${question.questionId}-${questionIndex}`"
            class="question-bank__question"
          >
            <div class="question-bank__question-head">
              <div>
                <div class="question-bank__question-index">Question {{ questionIndex + 1 }}</div>
                <div class="question-bank__question-id">
                  {{ question.questionId || '未设置 questionId' }}
                </div>
              </div>

              <div class="question-bank__question-actions">
                <el-button text @click="moveQuestion(questionIndex, -1)" :disabled="questionIndex === 0">
                  上移
                </el-button>
                <el-button
                  text
                  @click="moveQuestion(questionIndex, 1)"
                  :disabled="questionIndex === editableQuestions.length - 1"
                >
                  下移
                </el-button>
                <el-button text type="danger" @click="removeQuestion(questionIndex)">
                  删除
                </el-button>
              </div>
            </div>

            <div class="question-bank__field-grid">
              <label class="question-bank__field">
                <span class="question-bank__field-label">questionId</span>
                <el-input v-model="question.questionId" placeholder="例如 rhythm-1" />
              </label>
              <label class="question-bank__field question-bank__field--wide">
                <span class="question-bank__field-label">题目内容</span>
                <el-input
                  v-model="question.prompt"
                  type="textarea"
                  :rows="2"
                  placeholder="请输入题目"
                />
              </label>
            </div>

            <div class="question-bank__options">
              <div class="question-bank__options-head">
                <div class="question-bank__section-title">选项配置</div>
                <el-button text @click="addOption(question)">新增选项</el-button>
              </div>

              <div
                v-for="(option, optionIndex) in question.options"
                :key="`${option.key}-${optionIndex}`"
                class="question-bank__option-row"
              >
                <el-input v-model="option.key" class="question-bank__option-key" placeholder="A" />
                <el-input v-model="option.label" class="question-bank__option-label" placeholder="选项文案" />
                <el-select
                  v-if="activeTest.optionSchema === 'personality'"
                  v-model="option.dimension"
                  class="question-bank__option-dimension"
                  placeholder="维度"
                >
                  <el-option
                    v-for="dimension in editableDimensions"
                    :key="dimension.key"
                    :label="dimension.label || dimension.key"
                    :value="dimension.key"
                  />
                </el-select>
                <el-input-number
                  v-model="option.score"
                  :min="0"
                  :max="9"
                  class="question-bank__option-score"
                />
                <el-button text type="danger" @click="removeOption(question, optionIndex)">
                  删除
                </el-button>
              </div>
            </div>
          </article>
        </div>
      </div>

      <div v-else class="question-bank__empty">先从左侧选择一套题库开始编辑。</div>
    </section>
  </div>

  <el-dialog v-model="createDialogVisible" width="520px" title="新增测试集">
    <div class="question-bank__dialog">
      <label class="question-bank__field">
        <span class="question-bank__field-label">分类</span>
        <el-select v-model="createForm.category">
          <el-option v-for="item in categories" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </label>
      <label class="question-bank__field">
        <span class="question-bank__field-label">运营分类</span>
        <el-select v-model="createForm.groupCode" placeholder="请选择分类">
          <el-option
            v-for="group in createDialogGroups"
            :key="group.code"
            :label="group.label"
            :value="group.code"
          />
        </el-select>
      </label>
      <label class="question-bank__field">
        <span class="question-bank__field-label">code</span>
        <el-input v-model="createForm.code" placeholder="例如 social-rhythm" />
      </label>
      <label class="question-bank__field">
        <span class="question-bank__field-label">标题</span>
        <el-input v-model="createForm.title" placeholder="例如 社交节奏测评" />
      </label>
      <label class="question-bank__field">
        <span class="question-bank__field-label">副标题</span>
        <el-input v-model="createForm.subtitle" placeholder="可选" />
      </label>
      <label class="question-bank__field">
        <span class="question-bank__field-label">简介</span>
        <el-input v-model="createForm.description" type="textarea" :rows="3" placeholder="可选" />
      </label>
      <label class="question-bank__field">
        <span class="question-bank__field-label">复制现有测试集（可选）</span>
        <el-select v-model="createForm.cloneFromCode" clearable placeholder="不选则创建空白模板">
          <el-option
            v-for="item in cloneSourceTests"
            :key="item.code"
            :label="`${item.title} (${item.code})`"
            :value="item.code"
          />
        </el-select>
      </label>
    </div>

    <template #footer>
      <el-button @click="createDialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="creating" @click="submitCreateTest">创建</el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="groupDialogVisible" width="640px" title="管理运营分类">
    <div class="question-bank__dialog">
      <div class="question-bank__group-list">
        <div v-for="group in currentGroups" :key="group.code" class="question-bank__group-row">
          <div>
            <div class="question-bank__group-title">{{ group.label }}</div>
            <div class="question-bank__group-meta">{{ group.code }} · {{ group.description || '暂无描述' }}</div>
          </div>
          <el-button
            text
            type="danger"
            :disabled="group.isDefault"
            @click="removeGroup(group.code)"
          >
            删除
          </el-button>
        </div>
      </div>

      <div class="question-bank__panel">
        <div class="question-bank__section-title">新增分类</div>
        <div class="question-bank__field-grid question-bank__field-grid--three">
          <label class="question-bank__field">
            <span class="question-bank__field-label">code</span>
            <el-input v-model="groupForm.code" placeholder="例如 starter" />
          </label>
          <label class="question-bank__field">
            <span class="question-bank__field-label">名称</span>
            <el-input v-model="groupForm.label" placeholder="例如 入门推荐" />
          </label>
          <label class="question-bank__field question-bank__field--wide">
            <span class="question-bank__field-label">描述</span>
            <el-input v-model="groupForm.description" placeholder="可选" />
          </label>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="groupDialogVisible = false">关闭</el-button>
      <el-button type="primary" :loading="creatingGroup" @click="submitCreateGroup">
        新增分类
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus';
import { computed, onMounted, reactive, ref, watch } from 'vue';
import {
  createQuestionBankGroup,
  createQuestionBankTest,
  deleteQuestionBankGroup,
  fetchQuestionBankDetail,
  fetchQuestionBankGroups,
  fetchQuestionBankTests,
  updateQuestionBankDetail,
  type CreateQuestionBankTestPayload,
  type EmotionQuestionBankDetail,
  type EmotionThresholdConfig,
  type PersonalityProfileConfig,
  type PersonalityQuestionBankDetail,
  type QuestionBankCategory,
  type QuestionBankDetail,
  type QuestionBankGroup,
  type QuestionBankOption,
  type QuestionBankQuestion,
  type QuestionBankTestSummary,
  type SharePosterConfig,
} from '../api/question-bank';

type CategoryItem = { value: QuestionBankCategory; label: string };
type EditableDimension = { key: string; label: string };
type EditableProfile = {
  title: string;
  summary: string;
  strengthsText: string;
  suggestionsText: string;
};

const categories = ref<CategoryItem[]>([
  { value: 'personality', label: '性格测评' },
  { value: 'emotion', label: '情绪自检' },
]);
const selectedCategory = ref<QuestionBankCategory>('personality');
const tests = ref<QuestionBankTestSummary[]>([]);
const activeTest = ref<QuestionBankDetail | null>(null);
const editableQuestions = ref<QuestionBankQuestion[]>([]);
const editableDimensions = ref<EditableDimension[]>([]);
const editableProfiles = ref<Record<string, EditableProfile>>({});
const loadingList = ref(false);
const loadingDetail = ref(false);
const saving = ref(false);
const creating = ref(false);
const creatingGroup = ref(false);
const selectedKey = ref('');
const createDialogVisible = ref(false);
const groupDialogVisible = ref(false);
const groupMap = reactive<Record<QuestionBankCategory, QuestionBankGroup[]>>({
  personality: [],
  emotion: [],
});

const editableMeta = reactive({
  title: '',
  subtitle: '',
  description: '',
  intro: '',
  durationMinutes: 3,
  tagsText: '',
  groupCode: 'default',
});

const editableEmotionConfig = reactive({
  disclaimer: '',
  relaxStepsText: '',
  thresholds: [] as EmotionThresholdConfig[],
});

const editablePoster = reactive<SharePosterConfig>({
  headlineTemplate: '',
  subtitleTemplate: '',
  accentText: '',
  footerText: '',
  themeName: '',
});

const createForm = reactive<CreateQuestionBankTestPayload>({
  category: 'personality',
  groupCode: 'default',
  code: '',
  title: '',
  subtitle: '',
  description: '',
  cloneFromCode: '',
});

const groupForm = reactive({
  code: '',
  label: '',
  description: '',
});

const currentGroups = computed(() => groupMap[selectedCategory.value] ?? []);
const createDialogGroups = computed(() => groupMap[createForm.category] ?? []);
const cloneSourceTests = computed(() =>
  tests.value.filter((item) => item.category === createForm.category),
);

watch(
  () => createForm.category,
  (value) => {
    const firstGroup = groupMap[value]?.[0];
    createForm.groupCode = firstGroup?.code ?? 'default';
  },
);

async function bootstrap() {
  await loadGroupMap();
  await loadTests();
}

async function loadGroupMap() {
  try {
    const [personalityGroups, emotionGroups] = await Promise.all([
      fetchQuestionBankGroups('personality'),
      fetchQuestionBankGroups('emotion'),
    ]);
    groupMap.personality = personalityGroups;
    groupMap.emotion = emotionGroups;
  } catch (error) {
    console.warn('load question bank groups failed', error);
    ElMessage.error('题库分类读取失败');
  }
}

async function loadTests(keepSelection = false) {
  try {
    loadingList.value = true;
    const payload = await fetchQuestionBankTests(selectedCategory.value);
    categories.value = payload.categories as CategoryItem[];
    tests.value = payload.tests;

    const hasSelected = tests.value.some(
      (item) => `${item.category}:${item.code}` === selectedKey.value,
    );

    if (!keepSelection || !hasSelected) {
      const first = tests.value[0];
      if (first) {
        await openTest(first);
      } else {
        activeTest.value = null;
        editableQuestions.value = [];
        selectedKey.value = '';
      }
    }
  } catch (error) {
    console.warn('load question bank tests failed', error);
    ElMessage.error('题库列表读取失败');
  } finally {
    loadingList.value = false;
  }
}

async function openTest(item: QuestionBankTestSummary) {
  try {
    loadingDetail.value = true;
    selectedKey.value = `${item.category}:${item.code}`;
    const detail = await fetchQuestionBankDetail(item.category, item.code);
    applyDetail(detail);
  } catch (error) {
    console.warn('load question bank detail failed', error);
    ElMessage.error('题库详情读取失败');
  } finally {
    loadingDetail.value = false;
  }
}

function applyDetail(detail: QuestionBankDetail) {
  activeTest.value = detail;
  editableMeta.title = detail.title;
  editableMeta.subtitle = detail.subtitle;
  editableMeta.description = detail.description;
  editableMeta.intro = detail.intro;
  editableMeta.durationMinutes = detail.durationMinutes;
  editableMeta.tagsText = detail.tags.join('\n');
  editableMeta.groupCode = detail.groupCode;
  editableQuestions.value = detail.questions.map((question) => ({
    ...question,
    options: question.options.map((option) => ({ ...option })),
  }));
  editablePoster.headlineTemplate = detail.sharePoster.headlineTemplate;
  editablePoster.subtitleTemplate = detail.sharePoster.subtitleTemplate;
  editablePoster.accentText = detail.sharePoster.accentText;
  editablePoster.footerText = detail.sharePoster.footerText;
  editablePoster.themeName = detail.sharePoster.themeName;

  if (detail.optionSchema === 'personality') {
    applyPersonalityConfig(detail);
    editableEmotionConfig.disclaimer = '';
    editableEmotionConfig.relaxStepsText = '';
    editableEmotionConfig.thresholds = [];
  } else {
    editableDimensions.value = [];
    editableProfiles.value = {};
    applyEmotionConfig(detail);
  }
}

function applyPersonalityConfig(detail: PersonalityQuestionBankDetail) {
  editableDimensions.value = Object.entries(detail.dimensionLabels).map(([key, label]) => ({
    key,
    label,
  }));

  editableProfiles.value = Object.fromEntries(
    editableDimensions.value.map((dimension) => {
      const profile = detail.profiles[dimension.key] ?? {
        title: `${dimension.label}优势型`,
        summary: `你的${dimension.label}更突出，适合继续补充更细的结果画像。`,
        strengths: [],
        suggestions: [],
      };

      return [
        dimension.key,
        {
          title: profile.title,
          summary: profile.summary,
          strengthsText: profile.strengths.join('\n'),
          suggestionsText: profile.suggestions.join('\n'),
        },
      ];
    }),
  );

  syncProfilesWithDimensions();
}

function applyEmotionConfig(detail: EmotionQuestionBankDetail) {
  editableEmotionConfig.disclaimer = detail.disclaimer;
  editableEmotionConfig.relaxStepsText = detail.relaxSteps.join('\n');
  editableEmotionConfig.thresholds = detail.thresholds.map((item) => ({ ...item }));
}

async function switchCategory(category: QuestionBankCategory) {
  if (selectedCategory.value === category) {
    return;
  }

  selectedCategory.value = category;
  selectedKey.value = '';
  activeTest.value = null;
  await loadTests();
}

function openCreateDialog() {
  createForm.category = selectedCategory.value;
  createForm.groupCode = groupMap[selectedCategory.value]?.[0]?.code ?? 'default';
  createForm.code = '';
  createForm.title = '';
  createForm.subtitle = '';
  createForm.description = '';
  createForm.cloneFromCode = '';
  createDialogVisible.value = true;
}

async function submitCreateTest() {
  if (!createForm.code.trim() || !createForm.title.trim()) {
    ElMessage.warning('请先填写 code 和标题');
    return;
  }

  try {
    creating.value = true;
    const detail = await createQuestionBankTest({
      category: createForm.category,
      groupCode: createForm.groupCode,
      code: createForm.code.trim(),
      title: createForm.title.trim(),
      subtitle: createForm.subtitle?.trim() || undefined,
      description: createForm.description?.trim() || undefined,
      cloneFromCode: createForm.cloneFromCode?.trim() || undefined,
    });

    selectedCategory.value = detail.category;
    selectedKey.value = `${detail.category}:${detail.code}`;
    createDialogVisible.value = false;
    applyDetail(detail);
    await loadTests(true);
    ElMessage.success('测试集已创建');
  } catch (error) {
    console.warn('create question bank test failed', error);
    ElMessage.error('新增测试集失败');
  } finally {
    creating.value = false;
  }
}

function openGroupDialog() {
  groupForm.code = '';
  groupForm.label = '';
  groupForm.description = '';
  groupDialogVisible.value = true;
}

async function submitCreateGroup() {
  if (!groupForm.code.trim() || !groupForm.label.trim()) {
    ElMessage.warning('请先填写分类 code 和名称');
    return;
  }

  try {
    creatingGroup.value = true;
    const groups = await createQuestionBankGroup({
      category: selectedCategory.value,
      code: groupForm.code.trim(),
      label: groupForm.label.trim(),
      description: groupForm.description.trim() || undefined,
    });
    groupMap[selectedCategory.value] = groups;
    groupForm.code = '';
    groupForm.label = '';
    groupForm.description = '';
    ElMessage.success('分类已新增');
  } catch (error) {
    console.warn('create question bank group failed', error);
    ElMessage.error('新增分类失败');
  } finally {
    creatingGroup.value = false;
  }
}

async function removeGroup(code: string) {
  try {
    const groups = await deleteQuestionBankGroup(selectedCategory.value, code);
    groupMap[selectedCategory.value] = groups;
    ElMessage.success('分类已删除');
  } catch (error) {
    console.warn('delete question bank group failed', error);
    ElMessage.error('分类删除失败');
  }
}

function addDimension() {
  const nextIndex = editableDimensions.value.length + 1;
  editableDimensions.value.push({
    key: `dimension${nextIndex}`,
    label: `维度 ${nextIndex}`,
  });
  syncProfilesWithDimensions();
}

function removeDimension(index: number) {
  const [removed] = editableDimensions.value.splice(index, 1);
  if (removed) {
    delete editableProfiles.value[removed.key];
  }
  syncProfilesWithDimensions();
}

function syncProfilesWithDimensions() {
  const nextProfiles: Record<string, EditableProfile> = {};

  editableDimensions.value = editableDimensions.value.map((dimension, index) => ({
    key: dimension.key.trim() || `dimension${index + 1}`,
    label: dimension.label.trim() || `维度 ${index + 1}`,
  }));

  for (const dimension of editableDimensions.value) {
    nextProfiles[dimension.key] =
      editableProfiles.value[dimension.key] ?? createDefaultProfileState(dimension.label);
  }

  editableProfiles.value = nextProfiles;

  for (const question of editableQuestions.value) {
    for (const option of question.options) {
      if (!option.dimension || !nextProfiles[option.dimension]) {
        option.dimension = editableDimensions.value[0]?.key ?? '';
      }
    }
  }
}

function addThreshold() {
  editableEmotionConfig.thresholds.push({
    maxScore: 7,
    level: 'watch',
    title: '待补充标题',
    subtitle: '待补充副标题',
    summary: '待补充结果总结',
    primarySuggestion: '待补充主要建议',
    supportSignal: '待补充支持提醒',
  });
}

function removeThreshold(index: number) {
  editableEmotionConfig.thresholds.splice(index, 1);
}

function addQuestion() {
  if (!activeTest.value) {
    return;
  }

  editableQuestions.value.push({
    id: '',
    questionId: `${activeTest.value.code}-${editableQuestions.value.length + 1}`,
    prompt: '',
    sortOrder: editableQuestions.value.length + 1,
    options: createDefaultOptions(activeTest.value.optionSchema),
  });
}

function removeQuestion(index: number) {
  editableQuestions.value.splice(index, 1);
}

function moveQuestion(index: number, offset: number) {
  const target = index + offset;
  if (target < 0 || target >= editableQuestions.value.length) {
    return;
  }

  const clone = [...editableQuestions.value];
  const [current] = clone.splice(index, 1);
  clone.splice(target, 0, current);
  editableQuestions.value = clone;
}

function addOption(question: QuestionBankQuestion) {
  question.options.push({
    key: String.fromCharCode(65 + question.options.length),
    label: '',
    score: activeTest.value?.optionSchema === 'emotion' ? 0 : 3,
    ...(activeTest.value?.optionSchema === 'personality'
      ? { dimension: editableDimensions.value[0]?.key ?? '' }
      : {}),
  });
}

function removeOption(question: QuestionBankQuestion, optionIndex: number) {
  question.options.splice(optionIndex, 1);
}

async function saveTest() {
  if (!activeTest.value) {
    return;
  }

  if (!editableMeta.title.trim() || !editableMeta.subtitle.trim()) {
    ElMessage.warning('请先完善标题和副标题');
    return;
  }

  if (!editableMeta.groupCode) {
    ElMessage.warning('请先选择运营分类');
    return;
  }

  if (activeTest.value.optionSchema === 'personality' && editableDimensions.value.length === 0) {
    ElMessage.warning('至少保留一个维度');
    return;
  }

  if (activeTest.value.optionSchema === 'emotion' && editableEmotionConfig.thresholds.length === 0) {
    ElMessage.warning('至少保留一个阈值段');
    return;
  }

  try {
    saving.value = true;
    const detail = await updateQuestionBankDetail(
      activeTest.value.category,
      activeTest.value.code,
      buildSavePayload(),
    );
    applyDetail(detail);
    await loadTests(true);
    ElMessage.success('题库配置已保存');
  } catch (error) {
    console.warn('save question bank failed', error);
    ElMessage.error('题库保存失败');
  } finally {
    saving.value = false;
  }
}

function buildSavePayload() {
  const questions = editableQuestions.value.map((question, index) => ({
    questionId: question.questionId || `${activeTest.value?.code}-${index + 1}`,
    prompt: question.prompt,
    options: question.options.map((option) => ({
      key: option.key,
      label: option.label,
      score: Number(option.score),
      ...(activeTest.value?.optionSchema === 'personality'
        ? { dimension: option.dimension || editableDimensions.value[0]?.key || '' }
        : {}),
    })),
  }));

  const basePayload = {
    title: editableMeta.title.trim(),
    subtitle: editableMeta.subtitle.trim(),
    description: editableMeta.description.trim(),
    intro: editableMeta.intro.trim(),
    durationMinutes: Number(editableMeta.durationMinutes) || 3,
    tags: splitLines(editableMeta.tagsText),
    groupCode: editableMeta.groupCode,
    sharePoster: {
      headlineTemplate: editablePoster.headlineTemplate.trim(),
      subtitleTemplate: editablePoster.subtitleTemplate.trim(),
      accentText: editablePoster.accentText.trim(),
      footerText: editablePoster.footerText.trim(),
      themeName: editablePoster.themeName.trim(),
    },
    questions,
  };

  if (activeTest.value?.optionSchema === 'personality') {
    const dimensionLabels = Object.fromEntries(
      editableDimensions.value
        .map((item) => [item.key.trim(), item.label.trim()] as const)
        .filter(([key, label]) => key && label),
    );

    const profiles = Object.fromEntries(
      Object.entries(editableProfiles.value).map(([key, value]) => [
        key,
        {
          title: value.title.trim(),
          summary: value.summary.trim(),
          strengths: splitLines(value.strengthsText),
          suggestions: splitLines(value.suggestionsText),
        } satisfies PersonalityProfileConfig,
      ]),
    );

    return {
      ...basePayload,
      dimensionLabels,
      profiles,
    };
  }

  return {
    ...basePayload,
    disclaimer: editableEmotionConfig.disclaimer.trim(),
    relaxSteps: splitLines(editableEmotionConfig.relaxStepsText),
    thresholds: editableEmotionConfig.thresholds.map((item) => ({
      ...item,
      maxScore: Number(item.maxScore),
    })),
  };
}

function createDefaultOptions(schema: 'personality' | 'emotion'): QuestionBankOption[] {
  if (schema === 'emotion') {
    return ['A', 'B', 'C', 'D'].map((key, index) => ({
      key,
      label: '',
      score: index,
    }));
  }

  const [firstKey, secondKey, thirdKey] = editableDimensions.value.map((item) => item.key);

  return [
    { key: 'A', label: '', score: 4, dimension: firstKey ?? '' },
    { key: 'B', label: '', score: 3, dimension: secondKey ?? firstKey ?? '' },
    { key: 'C', label: '', score: 3, dimension: thirdKey ?? secondKey ?? firstKey ?? '' },
  ];
}

function createDefaultProfileState(label: string): EditableProfile {
  return {
    title: `${label}优势型`,
    summary: `你的${label}更突出，适合继续补充更细的结果画像。`,
    strengthsText: `在${label}相关场景里更容易表现自然\n适合继续补充更具体的优势描述`,
    suggestionsText: '建议补一条更具体的行动建议\n建议把文案写得更贴近用户日常语言',
  };
}

function splitLines(value: string) {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  const hour = `${date.getHours()}`.padStart(2, '0');
  const minute = `${date.getMinutes()}`.padStart(2, '0');
  return `${month}-${day} ${hour}:${minute}`;
}

onMounted(() => {
  void bootstrap();
});
</script>
