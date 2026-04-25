<template>
  <div class="content-center">
    <section class="content-center__toolbar">
      <el-tabs v-model="activeTab" class="content-center__tabs" @tab-change="handleTabChange">
        <el-tab-pane label="运势内容" name="fortune" />
        <el-tab-pane label="幸运物库" name="luckyItems" />
        <el-tab-pane label="报告模板" name="templates" />
        <el-tab-pane label="配置中心" name="configs" />
      </el-tabs>

      <div class="content-center__filters">
        <el-select
          v-if="activeTab === 'fortune'"
          v-model="contentFilters.contentType"
          clearable
          placeholder="按内容类型筛选"
        >
          <el-option
            v-for="item in contentTypeOptions"
            :key="item"
            :label="item"
            :value="item"
          />
        </el-select>

        <el-select
          v-else-if="activeTab === 'templates'"
          v-model="templateFilters.templateType"
          clearable
          placeholder="按模板类型筛选"
        >
          <el-option
            v-for="item in templateTypeOptions"
            :key="item"
            :label="item"
            :value="item"
          />
        </el-select>

        <el-select
          v-else-if="activeTab === 'configs'"
          v-model="configFilters.namespace"
          clearable
          placeholder="按命名空间筛选"
        >
          <el-option
            v-for="item in namespaceOptions"
            :key="item"
            :label="item"
            :value="item"
          />
        </el-select>

        <el-select v-model="currentStatusFilter" placeholder="按状态筛选">
          <el-option
            v-for="item in statusFilterOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>

        <el-input
          v-model="currentKeywordFilter"
          clearable
          :placeholder="currentKeywordPlaceholder"
        />
        <el-button type="primary" :loading="loading" @click="loadCurrentTab">刷新</el-button>
        <el-button plain @click="openCreateDialog">{{ createButtonText }}</el-button>
      </div>
    </section>

    <el-card shadow="never">
      <el-table :data="currentItems" stripe v-loading="loading">
        <template v-if="activeTab === 'fortune'">
          <el-table-column prop="contentType" label="类型" min-width="140" />
          <el-table-column prop="bizCode" label="bizCode" min-width="160" />
          <el-table-column prop="title" label="标题" min-width="180" />
          <el-table-column prop="status" label="状态" min-width="110">
            <template #default="{ row }">
              <el-tag :type="statusTagType(row.status)">
                {{ statusLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="publishDate" label="发布日期" min-width="120">
            <template #default="{ row }">
              {{ row.publishDate || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="updatedAt" label="更新时间" min-width="170">
            <template #default="{ row }">
              {{ formatDateTime(row.updatedAt) }}
            </template>
          </el-table-column>
        </template>

        <template v-else-if="activeTab === 'luckyItems'">
          <el-table-column prop="category" label="分类" min-width="120" />
          <el-table-column prop="bizCode" label="bizCode" min-width="160" />
          <el-table-column prop="title" label="标题" min-width="180" />
          <el-table-column prop="sortOrder" label="排序" min-width="100" />
          <el-table-column prop="status" label="状态" min-width="110">
            <template #default="{ row }">
              <el-tag :type="statusTagType(row.status)">
                {{ statusLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="updatedAt" label="更新时间" min-width="170">
            <template #default="{ row }">
              {{ formatDateTime(row.updatedAt) }}
            </template>
          </el-table-column>
        </template>

        <template v-else-if="activeTab === 'templates'">
          <el-table-column prop="templateType" label="模板类型" min-width="140" />
          <el-table-column prop="bizCode" label="bizCode" min-width="160" />
          <el-table-column prop="title" label="标题" min-width="180" />
          <el-table-column prop="engine" label="引擎" min-width="110" />
          <el-table-column prop="sortOrder" label="排序" min-width="100" />
          <el-table-column prop="status" label="状态" min-width="110">
            <template #default="{ row }">
              <el-tag :type="statusTagType(row.status)">
                {{ statusLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="updatedAt" label="更新时间" min-width="170">
            <template #default="{ row }">
              {{ formatDateTime(row.updatedAt) }}
            </template>
          </el-table-column>
        </template>

        <template v-else>
          <el-table-column prop="namespace" label="命名空间" min-width="140" />
          <el-table-column prop="configKey" label="配置键" min-width="160" />
          <el-table-column prop="title" label="标题" min-width="180" />
          <el-table-column prop="valueType" label="值类型" min-width="110" />
          <el-table-column prop="status" label="状态" min-width="110">
            <template #default="{ row }">
              <el-tag :type="statusTagType(row.status)">
                {{ statusLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="updatedAt" label="更新时间" min-width="170">
            <template #default="{ row }">
              {{ formatDateTime(row.updatedAt) }}
            </template>
          </el-table-column>
        </template>

        <el-table-column label="发布时间" min-width="160">
          <template #default="{ row }">
            {{ formatLifecycle(row.publishedAt, row.archivedAt) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" min-width="260" fixed="right">
          <template #default="{ row }">
            <el-button text type="primary" @click="openEditDialog(row)">编辑</el-button>
            <el-button
              v-if="row.status !== 'published'"
              text
              type="success"
              @click="changeStatus(row, 'published')"
            >
              发布
            </el-button>
            <el-button
              v-if="row.status !== 'draft'"
              text
              @click="changeStatus(row, 'draft')"
            >
              转草稿
            </el-button>
            <el-button
              v-if="row.status !== 'archived'"
              text
              type="warning"
              @click="changeStatus(row, 'archived')"
            >
              归档
            </el-button>
            <el-button text type="danger" @click="removeItem(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="820px"
      destroy-on-close
    >
      <el-form label-position="top">
        <template v-if="activeTab === 'fortune'">
          <div class="content-center__grid content-center__grid--four">
            <el-form-item label="内容类型">
              <el-input
                v-model="fortuneForm.contentType"
                placeholder="例如 lucky_sign / zodiac_daily"
              />
            </el-form-item>
            <el-form-item label="bizCode">
              <el-input v-model="fortuneForm.bizCode" />
            </el-form-item>
            <el-form-item label="发布日期">
              <el-input v-model="fortuneForm.publishDate" placeholder="YYYY-MM-DD，可留空" />
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="fortuneForm.status">
                <el-option
                  v-for="item in editorStatusOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </div>

          <el-form-item label="标题">
            <el-input v-model="fortuneForm.title" />
          </el-form-item>
          <el-form-item label="摘要">
            <el-input v-model="fortuneForm.summary" type="textarea" :rows="2" />
          </el-form-item>
          <el-form-item label="内容 JSON">
            <el-input v-model="fortuneForm.contentJsonText" type="textarea" :rows="16" />
          </el-form-item>
        </template>

        <template v-else-if="activeTab === 'luckyItems'">
          <div class="content-center__grid content-center__grid--four">
            <el-form-item label="分类">
              <el-input v-model="luckyItemForm.category" placeholder="例如 香气 / 饰品 / 桌面摆件" />
            </el-form-item>
            <el-form-item label="bizCode">
              <el-input v-model="luckyItemForm.bizCode" />
            </el-form-item>
            <el-form-item label="发布日期">
              <el-input v-model="luckyItemForm.publishDate" placeholder="YYYY-MM-DD，可留空" />
            </el-form-item>
            <el-form-item label="排序">
              <el-input-number v-model="luckyItemForm.sortOrder" :min="1" :max="9999" />
            </el-form-item>
          </div>

          <div class="content-center__grid content-center__grid--two">
            <el-form-item label="标题">
              <el-input v-model="luckyItemForm.title" />
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="luckyItemForm.status">
                <el-option
                  v-for="item in editorStatusOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </div>

          <el-form-item label="摘要">
            <el-input v-model="luckyItemForm.summary" type="textarea" :rows="2" />
          </el-form-item>
          <el-form-item label="幸运物配置 JSON">
            <el-input v-model="luckyItemForm.contentJsonText" type="textarea" :rows="16" />
          </el-form-item>
        </template>

        <template v-else-if="activeTab === 'templates'">
          <div class="content-center__grid content-center__grid--four">
            <el-form-item label="模板类型">
              <el-input v-model="reportTemplateForm.templateType" placeholder="例如 report_result / share_poster" />
            </el-form-item>
            <el-form-item label="bizCode">
              <el-input v-model="reportTemplateForm.bizCode" />
            </el-form-item>
            <el-form-item label="引擎">
              <el-input v-model="reportTemplateForm.engine" placeholder="json" />
            </el-form-item>
            <el-form-item label="排序">
              <el-input-number v-model="reportTemplateForm.sortOrder" :min="1" :max="9999" />
            </el-form-item>
          </div>

          <div class="content-center__grid content-center__grid--two">
            <el-form-item label="标题">
              <el-input v-model="reportTemplateForm.title" />
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="reportTemplateForm.status">
                <el-option
                  v-for="item in editorStatusOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </div>

          <el-form-item label="描述">
            <el-input v-model="reportTemplateForm.description" type="textarea" :rows="2" />
          </el-form-item>
          <el-form-item label="模板载荷 JSON">
            <el-input v-model="reportTemplateForm.payloadJsonText" type="textarea" :rows="16" />
          </el-form-item>
        </template>

        <template v-else>
          <div class="content-center__grid content-center__grid--four">
            <el-form-item label="命名空间">
              <el-input v-model="configForm.namespace" placeholder="例如 lucky / reports / assessment" />
            </el-form-item>
            <el-form-item label="配置键">
              <el-input v-model="configForm.configKey" />
            </el-form-item>
            <el-form-item label="值类型">
              <el-select v-model="configForm.valueType">
                <el-option label="json" value="json" />
                <el-option label="string" value="string" />
                <el-option label="number" value="number" />
                <el-option label="boolean" value="boolean" />
              </el-select>
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="configForm.status">
                <el-option
                  v-for="item in editorStatusOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </div>

          <el-form-item label="标题">
            <el-input v-model="configForm.title" />
          </el-form-item>
          <el-form-item label="描述">
            <el-input v-model="configForm.description" type="textarea" :rows="2" />
          </el-form-item>
          <template v-if="isMeditationMusicConfig">
            <el-form-item label="冥想音乐条目">
              <div class="content-center__music-editor">
                <div
                  v-for="(item, index) in meditationMusicItems"
                  :key="item.localId"
                  class="content-center__music-item"
                >
                  <div class="content-center__grid content-center__grid--four">
                    <el-form-item label="音乐 ID">
                      <el-input v-model="item.id" placeholder="例如 moon-breath" />
                    </el-form-item>
                    <el-form-item label="分类">
                      <el-select v-model="item.category">
                        <el-option label="sleep" value="sleep" />
                        <el-option label="breath" value="breath" />
                        <el-option label="focus" value="focus" />
                        <el-option label="healing" value="healing" />
                      </el-select>
                    </el-form-item>
                    <el-form-item label="时长（分钟）">
                      <el-input-number v-model="item.durationMinutes" :min="1" :max="180" />
                    </el-form-item>
                    <el-form-item label="启用">
                      <el-switch v-model="item.enabled" />
                    </el-form-item>
                  </div>

                  <div class="content-center__grid content-center__grid--two">
                    <el-form-item label="标题">
                      <el-input v-model="item.title" />
                    </el-form-item>
                    <el-form-item label="氛围">
                      <el-input v-model="item.atmosphere" placeholder="例如 柔和白噪" />
                    </el-form-item>
                  </div>

                  <el-form-item label="副标题">
                    <el-input v-model="item.subtitle" type="textarea" :rows="2" />
                  </el-form-item>

                  <div class="content-center__grid content-center__grid--two">
                    <el-form-item label="试听地址">
                      <el-input v-model="item.previewUrl" placeholder="上传后自动回填" />
                    </el-form-item>
                    <el-form-item label="上传音频">
                      <el-upload
                        :show-file-list="false"
                        accept="audio/*"
                        :http-request="(options: UploadRequestOptions) => handleMeditationAudioUpload(index, options.file as File)"
                      >
                        <el-button :loading="uploadingAudioIndex === index">上传音乐</el-button>
                      </el-upload>
                    </el-form-item>
                  </div>

                  <div class="content-center__music-actions">
                    <el-button text @click="duplicateMeditationMusicItem(index)">复制一条</el-button>
                    <el-button text type="danger" @click="removeMeditationMusicItem(index)">删除</el-button>
                  </div>
                </div>

                <el-button plain @click="addMeditationMusicItem">新增音乐条目</el-button>
              </div>
            </el-form-item>
          </template>
          <el-form-item label="配置值 JSON">
            <el-input v-model="configForm.valueJsonText" type="textarea" :rows="16" />
          </el-form-item>
        </template>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveItem">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { UploadRequestOptions } from 'element-plus';
import {
  createConfigEntry,
  createFortuneContent,
  createLuckyItem,
  createReportTemplate,
  deleteConfigEntry,
  deleteFortuneContent,
  deleteLuckyItem,
  deleteReportTemplate,
  fetchConfigEntries,
  fetchFortuneContents,
  fetchLuckyItems,
  fetchReportTemplates,
  updateConfigEntry,
  updateConfigEntryStatus,
  updateFortuneContent,
  updateFortuneContentStatus,
  updateLuckyItem,
  updateLuckyItemStatus,
  updateReportTemplate,
  updateReportTemplateStatus,
  uploadAdminAudio,
  type ConfigEntryItem,
  type FortuneContentItem,
  type LifecycleStatus,
  type LuckyItem,
  type ReportTemplateItem,
} from '../api/content-center';

type ContentTab = 'fortune' | 'luckyItems' | 'templates' | 'configs';
type ContentRow = FortuneContentItem | LuckyItem | ReportTemplateItem | ConfigEntryItem;

const contentTypeOptions = [
  'lucky_sign',
  'zodiac_daily',
  'zodiac_weekly',
  'zodiac_yearly',
  'zodiac_knowledge',
  'zodiac_compatibility',
];

const templateTypeOptions = ['report_result', 'share_poster'];
const namespaceOptions = ['lucky', 'meditation', 'reports', 'posters', 'assessment', 'commerce'];
const statusFilterOptions = [
  { label: '全部状态', value: 'all' },
  { label: '草稿', value: 'draft' },
  { label: '已发布', value: 'published' },
  { label: '已归档', value: 'archived' },
];
const editorStatusOptions = statusFilterOptions.filter((item) => item.value !== 'all');

const activeTab = ref<ContentTab>('fortune');
const loading = ref(false);
const saving = ref(false);
const dialogVisible = ref(false);
const editingId = ref('');

const fortuneContents = ref<FortuneContentItem[]>([]);
const luckyItems = ref<LuckyItem[]>([]);
const reportTemplates = ref<ReportTemplateItem[]>([]);
const configEntries = ref<ConfigEntryItem[]>([]);

const contentFilters = reactive({
  contentType: '',
  status: 'all',
  keyword: '',
});

const luckyItemFilters = reactive({
  status: 'all',
  keyword: '',
});

const templateFilters = reactive({
  templateType: '',
  status: 'all',
  keyword: '',
});

const configFilters = reactive({
  namespace: '',
  status: 'all',
  keyword: '',
});

const fortuneForm = reactive({
  contentType: 'lucky_sign',
  bizCode: '',
  publishDate: '',
  title: '',
  summary: '',
  status: 'draft' as LifecycleStatus,
  contentJsonText:
    '{\n  "tag": "今日吉签",\n  "mantra": "先稳住节奏，再顺势推进。"\n}',
});

const luckyItemForm = reactive({
  category: '幸运物',
  bizCode: '',
  publishDate: '',
  title: '',
  summary: '',
  sortOrder: 100,
  status: 'draft' as LifecycleStatus,
  contentJsonText:
    '{\n  "elements": ["木"],\n  "palette": ["#d7f0e6", "#edf8f6", "#9ccdb7"],\n  "wallpaperPrompt": "clean apple style still life"\n}',
});

const reportTemplateForm = reactive({
  templateType: 'report_result',
  bizCode: '',
  title: '',
  description: '',
  engine: 'json',
  sortOrder: 100,
  status: 'draft' as LifecycleStatus,
  payloadJsonText:
    '{\n  "baseTitle": "你的结果概览",\n  "shareTitle": "我的今日结果"\n}',
});

const configForm = reactive({
  namespace: 'lucky',
  configKey: '',
  title: '',
  description: '',
  valueType: 'json' as ConfigEntryItem['valueType'],
  status: 'draft' as LifecycleStatus,
  valueJsonText: '{\n  "enabled": true\n}',
});
type MeditationMusicEditorItem = {
  localId: string;
  id: string;
  title: string;
  subtitle: string;
  category: 'sleep' | 'breath' | 'focus' | 'healing';
  durationMinutes: number;
  atmosphere: string;
  previewUrl: string;
  enabled: boolean;
};

const meditationMusicItems = ref<MeditationMusicEditorItem[]>([]);
const uploadingAudioIndex = ref(-1);

const DEFAULT_CONFIG_TEMPLATE = '{\n  "enabled": true\n}';
const MEDITATION_MUSIC_TEMPLATE =
  '{\n  "items": [\n    {\n      "id": "moon-breath",\n      "title": "月光呼吸",\n      "subtitle": "适合睡前放松，呼吸节奏更慢一点。",\n      "category": "sleep",\n      "durationMinutes": 12,\n      "atmosphere": "柔和白噪",\n      "previewUrl": "https://actions.google.com/sounds/v1/ambiences/ocean_waves.ogg",\n      "enabled": true\n    }\n  ]\n}';

const currentItems = computed(() => {
  if (activeTab.value === 'fortune') {
    return fortuneContents.value;
  }

  if (activeTab.value === 'luckyItems') {
    return luckyItems.value;
  }

  if (activeTab.value === 'templates') {
    return reportTemplates.value;
  }

  return configEntries.value;
});
const isMeditationMusicConfig = computed(
  () =>
    activeTab.value === 'configs' &&
    configForm.namespace === 'meditation' &&
    configForm.configKey === 'music_library',
);

const currentStatusFilter = computed({
  get: () => {
    if (activeTab.value === 'fortune') {
      return contentFilters.status;
    }
    if (activeTab.value === 'luckyItems') {
      return luckyItemFilters.status;
    }
    if (activeTab.value === 'templates') {
      return templateFilters.status;
    }
    return configFilters.status;
  },
  set: (value: string) => {
    if (activeTab.value === 'fortune') {
      contentFilters.status = value;
      return;
    }
    if (activeTab.value === 'luckyItems') {
      luckyItemFilters.status = value;
      return;
    }
    if (activeTab.value === 'templates') {
      templateFilters.status = value;
      return;
    }
    configFilters.status = value;
  },
});

const currentKeywordFilter = computed({
  get: () => {
    if (activeTab.value === 'fortune') {
      return contentFilters.keyword;
    }
    if (activeTab.value === 'luckyItems') {
      return luckyItemFilters.keyword;
    }
    if (activeTab.value === 'templates') {
      return templateFilters.keyword;
    }
    return configFilters.keyword;
  },
  set: (value: string) => {
    if (activeTab.value === 'fortune') {
      contentFilters.keyword = value;
      return;
    }
    if (activeTab.value === 'luckyItems') {
      luckyItemFilters.keyword = value;
      return;
    }
    if (activeTab.value === 'templates') {
      templateFilters.keyword = value;
      return;
    }
    configFilters.keyword = value;
  },
});

const currentKeywordPlaceholder = computed(() => {
  if (activeTab.value === 'fortune') {
    return '搜索标题 / bizCode / 内容类型';
  }
  if (activeTab.value === 'luckyItems') {
    return '搜索幸运物标题 / bizCode / 分类';
  }
  if (activeTab.value === 'templates') {
    return '搜索模板标题 / bizCode / 模板类型';
  }
  return '搜索配置标题 / namespace / configKey';
});

const createButtonText = computed(() => {
  if (activeTab.value === 'fortune') {
    return '新增内容';
  }
  if (activeTab.value === 'luckyItems') {
    return '新增幸运物';
  }
  if (activeTab.value === 'templates') {
    return '新增模板';
  }
  return '新增配置';
});

const dialogTitle = computed(() => {
  const prefix = editingId.value ? '编辑' : '新增';
  if (activeTab.value === 'fortune') {
    return `${prefix}运势内容`;
  }
  if (activeTab.value === 'luckyItems') {
    return `${prefix}幸运物`;
  }
  if (activeTab.value === 'templates') {
    return `${prefix}报告模板`;
  }
  return `${prefix}配置`;
});

async function loadCurrentTab() {
  try {
    loading.value = true;

    if (activeTab.value === 'fortune') {
      const response = await fetchFortuneContents({
        contentType: contentFilters.contentType || undefined,
        status: contentFilters.status,
        keyword: contentFilters.keyword || undefined,
      });
      fortuneContents.value = response.data.items;
      return;
    }

    if (activeTab.value === 'luckyItems') {
      const response = await fetchLuckyItems({
        status: luckyItemFilters.status,
        keyword: luckyItemFilters.keyword || undefined,
      });
      luckyItems.value = response.data.items;
      return;
    }

    if (activeTab.value === 'templates') {
      const response = await fetchReportTemplates({
        templateType: templateFilters.templateType || undefined,
        status: templateFilters.status,
        keyword: templateFilters.keyword || undefined,
      });
      reportTemplates.value = response.data.items;
      return;
    }

    const response = await fetchConfigEntries({
      namespace: configFilters.namespace || undefined,
      status: configFilters.status,
      keyword: configFilters.keyword || undefined,
    });
    configEntries.value = response.data.items;
  } catch (error) {
    console.warn('load content center resources failed', error);
    ElMessage.error('内容中心列表加载失败');
  } finally {
    loading.value = false;
  }
}

async function handleTabChange() {
  await loadCurrentTab();
}

function openCreateDialog() {
  editingId.value = '';
  resetCurrentForm();
  dialogVisible.value = true;
}

function openEditDialog(row: ContentRow) {
  editingId.value = row.id;

  if (activeTab.value === 'fortune') {
    const item = row as FortuneContentItem;
    fortuneForm.contentType = item.contentType;
    fortuneForm.bizCode = item.bizCode;
    fortuneForm.publishDate = item.publishDate || '';
    fortuneForm.title = item.title;
    fortuneForm.summary = item.summary || '';
    fortuneForm.status = item.status;
    fortuneForm.contentJsonText = JSON.stringify(item.contentJson, null, 2);
  } else if (activeTab.value === 'luckyItems') {
    const item = row as LuckyItem;
    luckyItemForm.category = item.category;
    luckyItemForm.bizCode = item.bizCode;
    luckyItemForm.publishDate = item.publishDate || '';
    luckyItemForm.title = item.title;
    luckyItemForm.summary = item.summary || '';
    luckyItemForm.sortOrder = item.sortOrder;
    luckyItemForm.status = item.status;
    luckyItemForm.contentJsonText = JSON.stringify(item.contentJson, null, 2);
  } else if (activeTab.value === 'templates') {
    const item = row as ReportTemplateItem;
    reportTemplateForm.templateType = item.templateType;
    reportTemplateForm.bizCode = item.bizCode;
    reportTemplateForm.title = item.title;
    reportTemplateForm.description = item.description || '';
    reportTemplateForm.engine = item.engine;
    reportTemplateForm.sortOrder = item.sortOrder;
    reportTemplateForm.status = item.status;
    reportTemplateForm.payloadJsonText = JSON.stringify(item.payloadJson, null, 2);
  } else {
    const item = row as ConfigEntryItem;
    configForm.namespace = item.namespace;
    configForm.configKey = item.configKey;
    configForm.title = item.title;
    configForm.description = item.description || '';
    configForm.valueType = item.valueType;
    configForm.status = item.status;
    configForm.valueJsonText = JSON.stringify(item.valueJson, null, 2);
    syncMeditationMusicFromValue(item.valueJson);
  }

  dialogVisible.value = true;
}

async function saveItem() {
  try {
    saving.value = true;

    if (activeTab.value === 'fortune') {
      const payload = {
        contentType: fortuneForm.contentType.trim(),
        bizCode: fortuneForm.bizCode.trim(),
        publishDate: fortuneForm.publishDate.trim() || null,
        title: fortuneForm.title.trim(),
        summary: fortuneForm.summary.trim(),
        status: fortuneForm.status,
        contentJson: parseJsonText('内容 JSON', fortuneForm.contentJsonText),
      };

      if (editingId.value) {
        await updateFortuneContent(editingId.value, payload);
      } else {
        await createFortuneContent(payload);
      }
    } else if (activeTab.value === 'luckyItems') {
      const payload = {
        category: luckyItemForm.category.trim(),
        bizCode: luckyItemForm.bizCode.trim(),
        publishDate: luckyItemForm.publishDate.trim() || null,
        title: luckyItemForm.title.trim(),
        summary: luckyItemForm.summary.trim(),
        sortOrder: Number(luckyItemForm.sortOrder) || 100,
        status: luckyItemForm.status,
        contentJson: parseJsonText('幸运物配置 JSON', luckyItemForm.contentJsonText),
      };

      if (editingId.value) {
        await updateLuckyItem(editingId.value, payload);
      } else {
        await createLuckyItem(payload);
      }
    } else if (activeTab.value === 'templates') {
      const payload = {
        templateType: reportTemplateForm.templateType.trim(),
        bizCode: reportTemplateForm.bizCode.trim(),
        title: reportTemplateForm.title.trim(),
        description: reportTemplateForm.description.trim(),
        engine: reportTemplateForm.engine.trim() || 'json',
        sortOrder: Number(reportTemplateForm.sortOrder) || 100,
        status: reportTemplateForm.status,
        payloadJson: parseJsonText('模板载荷 JSON', reportTemplateForm.payloadJsonText),
      };

      if (editingId.value) {
        await updateReportTemplate(editingId.value, payload);
      } else {
        await createReportTemplate(payload);
      }
    } else {
      if (isMeditationMusicConfig.value) {
        syncMeditationMusicToJson();
      }

      const payload = {
        namespace: configForm.namespace.trim(),
        configKey: configForm.configKey.trim(),
        title: configForm.title.trim(),
        description: configForm.description.trim(),
        valueType: configForm.valueType,
        status: configForm.status,
        valueJson: parseJsonText('配置值 JSON', configForm.valueJsonText),
      };

      if (editingId.value) {
        await updateConfigEntry(editingId.value, payload);
      } else {
        await createConfigEntry(payload);
      }
    }

    ElMessage.success('内容已保存');
    dialogVisible.value = false;
    await loadCurrentTab();
  } catch (error) {
    if (error instanceof Error) {
      ElMessage.error(error.message);
    } else {
      console.warn('save content center resource failed', error);
      ElMessage.error('保存失败');
    }
  } finally {
    saving.value = false;
  }
}

async function changeStatus(row: ContentRow, status: LifecycleStatus) {
  try {
    if (activeTab.value === 'fortune') {
      await updateFortuneContentStatus(row.id, status);
    } else if (activeTab.value === 'luckyItems') {
      await updateLuckyItemStatus(row.id, status);
    } else if (activeTab.value === 'templates') {
      await updateReportTemplateStatus(row.id, status);
    } else {
      await updateConfigEntryStatus(row.id, status);
    }

    ElMessage.success(`状态已切换为${statusLabel(status)}`);
    await loadCurrentTab();
  } catch (error) {
    console.warn('change content center status failed', error);
    ElMessage.error('状态切换失败');
  }
}

async function removeItem(row: ContentRow) {
  try {
    await ElMessageBox.confirm(`确认删除 ${resolveRowTitle(row)} 吗？`, '删除内容', {
      type: 'warning',
    });

    if (activeTab.value === 'fortune') {
      await deleteFortuneContent(row.id);
    } else if (activeTab.value === 'luckyItems') {
      await deleteLuckyItem(row.id);
    } else if (activeTab.value === 'templates') {
      await deleteReportTemplate(row.id);
    } else {
      await deleteConfigEntry(row.id);
    }

    ElMessage.success('内容已删除');
    await loadCurrentTab();
  } catch (error) {
    if (error !== 'cancel') {
      console.warn('delete content center resource failed', error);
    }
  }
}

function resetCurrentForm() {
  if (activeTab.value === 'fortune') {
    fortuneForm.contentType = 'lucky_sign';
    fortuneForm.bizCode = '';
    fortuneForm.publishDate = '';
    fortuneForm.title = '';
    fortuneForm.summary = '';
    fortuneForm.status = 'draft';
    fortuneForm.contentJsonText =
      '{\n  "tag": "今日吉签",\n  "mantra": "先稳住节奏，再顺势推进。"\n}';
    return;
  }

  if (activeTab.value === 'luckyItems') {
    luckyItemForm.category = '幸运物';
    luckyItemForm.bizCode = '';
    luckyItemForm.publishDate = '';
    luckyItemForm.title = '';
    luckyItemForm.summary = '';
    luckyItemForm.sortOrder = 100;
    luckyItemForm.status = 'draft';
    luckyItemForm.contentJsonText =
      '{\n  "elements": ["木"],\n  "palette": ["#d7f0e6", "#edf8f6", "#9ccdb7"],\n  "wallpaperPrompt": "clean apple style still life"\n}';
    return;
  }

  if (activeTab.value === 'templates') {
    reportTemplateForm.templateType = 'report_result';
    reportTemplateForm.bizCode = '';
    reportTemplateForm.title = '';
    reportTemplateForm.description = '';
    reportTemplateForm.engine = 'json';
    reportTemplateForm.sortOrder = 100;
    reportTemplateForm.status = 'draft';
    reportTemplateForm.payloadJsonText =
      '{\n  "baseTitle": "你的结果概览",\n  "shareTitle": "我的今日结果"\n}';
    return;
  }

  configForm.namespace = 'meditation';
  configForm.configKey = 'music_library';
  configForm.title = '';
  configForm.description = '';
  configForm.valueType = 'json';
  configForm.status = 'draft';
  configForm.valueJsonText = buildConfigTemplate(
    configForm.namespace,
    configForm.configKey,
  );
  syncMeditationMusicFromValue(safeParseJsonText(configForm.valueJsonText));
}

function buildConfigTemplate(namespace: string, configKey: string) {
  if (namespace === 'meditation' && configKey === 'music_library') {
    return MEDITATION_MUSIC_TEMPLATE;
  }

  return DEFAULT_CONFIG_TEMPLATE;
}

function createMeditationMusicItem(
  input?: Partial<Omit<MeditationMusicEditorItem, 'localId'>>,
): MeditationMusicEditorItem {
  return {
    localId: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    id: input?.id || '',
    title: input?.title || '',
    subtitle: input?.subtitle || '',
    category: input?.category || 'healing',
    durationMinutes: input?.durationMinutes || 5,
    atmosphere: input?.atmosphere || '',
    previewUrl: input?.previewUrl || '',
    enabled: input?.enabled ?? true,
  };
}

function syncMeditationMusicFromValue(value: Record<string, unknown>) {
  const rawItems = Array.isArray((value as { items?: unknown[] }).items)
    ? (((value as { items?: unknown[] }).items ?? []) as unknown[])
    : [];

  meditationMusicItems.value = rawItems.length
    ? rawItems.map((item) => {
        const record = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
        return createMeditationMusicItem({
          id: typeof record.id === 'string' ? record.id : '',
          title: typeof record.title === 'string' ? record.title : '',
          subtitle: typeof record.subtitle === 'string' ? record.subtitle : '',
          category:
            record.category === 'sleep' ||
            record.category === 'breath' ||
            record.category === 'focus'
              ? record.category
              : 'healing',
          durationMinutes: Number(record.durationMinutes) || 5,
          atmosphere: typeof record.atmosphere === 'string' ? record.atmosphere : '',
          previewUrl: typeof record.previewUrl === 'string' ? record.previewUrl : '',
          enabled: record.enabled !== false,
        });
      })
    : [createMeditationMusicItem({ id: 'moon-breath', title: '月光呼吸', category: 'sleep', durationMinutes: 12 })];
}

function syncMeditationMusicToJson() {
  configForm.valueJsonText = JSON.stringify(
    {
      items: meditationMusicItems.value.map((item) => ({
        id: item.id.trim(),
        title: item.title.trim(),
        subtitle: item.subtitle.trim(),
        category: item.category,
        durationMinutes: Number(item.durationMinutes) || 5,
        atmosphere: item.atmosphere.trim(),
        previewUrl: item.previewUrl.trim(),
        enabled: item.enabled,
      })),
    },
    null,
    2,
  );
}

function addMeditationMusicItem() {
  meditationMusicItems.value.push(createMeditationMusicItem());
  syncMeditationMusicToJson();
}

function duplicateMeditationMusicItem(index: number) {
  const current = meditationMusicItems.value[index];
  if (!current) {
    return;
  }

  meditationMusicItems.value.splice(
    index + 1,
    0,
    createMeditationMusicItem({
      ...current,
      id: current.id ? `${current.id}-copy` : '',
    }),
  );
  syncMeditationMusicToJson();
}

function removeMeditationMusicItem(index: number) {
  meditationMusicItems.value.splice(index, 1);
  if (!meditationMusicItems.value.length) {
    meditationMusicItems.value.push(createMeditationMusicItem());
  }
  syncMeditationMusicToJson();
}

async function handleMeditationAudioUpload(index: number, file: File) {
  try {
    uploadingAudioIndex.value = index;
    const response = await uploadAdminAudio(file);
    const target = meditationMusicItems.value[index];

    if (!target) {
      return;
    }

    target.previewUrl = response.data.item.url;
    if (!target.title) {
      target.title = file.name.replace(/\.[^.]+$/, '');
    }
    syncMeditationMusicToJson();
    ElMessage.success('音频上传成功');
  } catch (error) {
    console.warn('upload meditation audio failed', error);
    ElMessage.error(error instanceof Error ? error.message : '音频上传失败');
  } finally {
    uploadingAudioIndex.value = -1;
  }
}

watch(
  () => [configForm.namespace, configForm.configKey, dialogVisible.value, editingId.value] as const,
  ([namespace, configKey, visible, currentEditingId], [, , previousVisible]) => {
    if (!visible || currentEditingId) {
      return;
    }

    if (namespace === 'meditation' && configKey === 'music_library') {
      if (!configForm.title) {
        configForm.title = '冥想音乐库';
      }
      if (!configForm.description) {
        configForm.description = '移动端冥想页可选音乐列表，支持试听链接与分类配置。';
      }
      syncMeditationMusicFromValue(safeParseJsonText(configForm.valueJsonText));
    }

    if (
      !previousVisible ||
      configForm.valueJsonText === DEFAULT_CONFIG_TEMPLATE ||
      configForm.valueJsonText === MEDITATION_MUSIC_TEMPLATE
    ) {
      configForm.valueJsonText = buildConfigTemplate(namespace, configKey);
    }
  },
);

function parseJsonText(label: string, value: string) {
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    throw new Error(`${label} 不是合法 JSON`);
  }
}

function safeParseJsonText(value: string) {
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function resolveRowTitle(row: ContentRow) {
  return row.title;
}

function statusLabel(status: string) {
  if (status === 'published') {
    return '已发布';
  }
  if (status === 'archived') {
    return '已归档';
  }
  return '草稿';
}

function statusTagType(status: string) {
  if (status === 'published') {
    return 'success';
  }
  if (status === 'archived') {
    return 'warning';
  }
  return 'info';
}

function formatDateTime(value: string | null) {
  if (!value) {
    return '-';
  }

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

function formatLifecycle(publishedAt: string | null, archivedAt: string | null) {
  if (archivedAt) {
    return `归档于 ${formatDateTime(archivedAt)}`;
  }
  if (publishedAt) {
    return `发布于 ${formatDateTime(publishedAt)}`;
  }
  return '未发布';
}

onMounted(() => {
  void loadCurrentTab();
});
</script>

<style scoped>
.content-center__music-editor {
  display: grid;
  gap: 16px;
}

.content-center__music-item {
  padding: 16px;
  border-radius: 14px;
  background: #f7f9fc;
  border: 1px solid rgba(15, 23, 42, 0.08);
}

.content-center__music-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>

<style scoped lang="scss">
.content-center {
  display: grid;
  gap: 20px;
}

.content-center__toolbar {
  display: grid;
  gap: 14px;
}

.content-center__tabs :deep(.el-tabs__header) {
  margin-bottom: 0;
}

.content-center__filters,
.content-center__grid {
  display: grid;
  gap: 14px;
}

.content-center__filters {
  grid-template-columns: 200px 160px minmax(0, 1fr) auto auto;
}

.content-center__grid--two {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.content-center__grid--four {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

@media (max-width: 1200px) {
  .content-center__filters,
  .content-center__grid--four {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .content-center__filters,
  .content-center__grid--two,
  .content-center__grid--four {
    grid-template-columns: 1fr;
  }
}
</style>
