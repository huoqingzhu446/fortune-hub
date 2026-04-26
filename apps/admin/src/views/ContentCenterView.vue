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
          <el-table-column prop="grayPercent" label="灰度" min-width="90">
            <template #default="{ row }">{{ row.grayPercent ?? 100 }}%</template>
          </el-table-column>
          <el-table-column prop="publishedVersionNo" label="发布版本" min-width="100">
            <template #default="{ row }">v{{ row.publishedVersionNo || '-' }}</template>
          </el-table-column>
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
            <template v-if="activeTab === 'templates'">
              <el-button text type="primary" @click="openTemplatePreview(row)">预览</el-button>
              <el-button text type="primary" @click="openTemplateVersions(row)">版本</el-button>
            </template>
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
              <el-select
                v-model="fortuneForm.contentType"
                allow-create
                filterable
                placeholder="例如 lucky_sign / zodiac_daily"
              >
                <el-option
                  v-for="item in contentTypeOptions"
                  :key="item"
                  :label="item"
                  :value="item"
                />
              </el-select>
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
          <el-form-item label="星座内容模板">
            <div class="content-center__template-row">
              <el-select v-model="selectedFortuneTemplate" placeholder="选择模板后可套用">
                <el-option
                  v-for="item in fortuneTemplateOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
              <el-button plain @click="applyFortuneTemplate">套用模板</el-button>
            </div>
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
            <el-form-item label="灰度比例">
              <el-input-number v-model="reportTemplateForm.grayPercent" :min="0" :max="100" />
            </el-form-item>
            <el-form-item label="发布备注">
              <el-input v-model="reportTemplateForm.releaseNote" placeholder="例如：小流量灰度 / 文案优化" />
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

                  <el-form-item label="在线试听">
                    <div class="content-center__audio-preview">
                      <audio
                        v-if="item.previewUrl"
                        class="content-center__audio-player"
                        :src="resolveMeditationPreviewUrl(item.previewUrl)"
                        controls
                        preload="none"
                      />
                      <span v-else class="content-center__audio-empty">上传后可直接试听</span>
                    </div>
                  </el-form-item>

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

    <el-dialog v-model="templatePreviewVisible" title="模板预览" width="760px">
      <el-input
        v-model="templatePreviewSampleText"
        type="textarea"
        :rows="8"
        placeholder='{"name":"清浅"}'
      />
      <pre class="content-center__preview">{{ templatePreviewText }}</pre>
      <template #footer>
        <el-button @click="templatePreviewVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="templateVersionsVisible" title="模板版本" width="820px">
      <el-table :data="templateVersions" stripe>
        <el-table-column prop="versionNo" label="版本" width="90">
          <template #default="{ row }">v{{ row.versionNo }}</template>
        </el-table-column>
        <el-table-column prop="status" label="来源" min-width="140" />
        <el-table-column prop="createdAt" label="创建时间" min-width="180">
          <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button text type="primary" @click="rollbackTemplateVersion(row.id)">回滚</el-button>
          </template>
        </el-table-column>
      </el-table>
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
  fetchReportTemplateVersions,
  fetchConfigEntries,
  fetchFortuneContents,
  fetchLuckyItems,
  fetchReportTemplates,
  previewReportTemplate,
  rollbackReportTemplate,
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
  type ReportTemplateVersionItem,
} from '../api/content-center';

type ContentTab = 'fortune' | 'luckyItems' | 'templates' | 'configs';
type ContentRow = FortuneContentItem | LuckyItem | ReportTemplateItem | ConfigEntryItem;

const contentTypeOptions = [
  'lucky_sign',
  'zodiac_today',
  'zodiac_daily',
  'zodiac_dimension_daily',
  'zodiac_weekly',
  'zodiac_monthly',
  'zodiac_yearly',
  'zodiac_knowledge',
  'zodiac_compatibility',
  'zodiac_share_poster',
];

const fortuneTemplateOptions = [
  { label: '幸运签', value: 'lucky_sign' },
  { label: '星座今日聚合页', value: 'zodiac_today' },
  { label: '星座四象限指数', value: 'zodiac_dimension_daily' },
  { label: '星座月运', value: 'zodiac_monthly' },
  { label: '星座分享海报', value: 'zodiac_share_poster' },
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
const templatePreviewVisible = ref(false);
const templatePreviewText = ref('');
const templatePreviewSampleText = ref('{\n  "name": "清浅",\n  "score": "88"\n}');
const templateVersionsVisible = ref(false);
const templateVersions = ref<ReportTemplateVersionItem[]>([]);
const activeTemplateId = ref('');
const selectedFortuneTemplate = ref('zodiac_today');

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
  grayPercent: 100,
  releaseNote: '',
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
    selectedFortuneTemplate.value = resolveFortuneTemplateKey(item.contentType);
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
    reportTemplateForm.grayPercent = item.grayPercent ?? 100;
    reportTemplateForm.releaseNote = item.releaseNote || '';
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
        grayPercent: Number(reportTemplateForm.grayPercent) || 0,
        releaseNote: reportTemplateForm.releaseNote.trim(),
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

async function openTemplatePreview(row: ContentRow) {
  if (activeTab.value !== 'templates') {
    return;
  }

  try {
    const sample = safeParseJsonText(templatePreviewSampleText.value);
    const response = await previewReportTemplate(row.id, sample);
    templatePreviewText.value = JSON.stringify(response.data.preview.rendered, null, 2);
    templatePreviewVisible.value = true;
  } catch (error) {
    console.warn('preview report template failed', error);
    ElMessage.error('模板预览失败');
  }
}

async function openTemplateVersions(row: ContentRow) {
  if (activeTab.value !== 'templates') {
    return;
  }

  try {
    activeTemplateId.value = row.id;
    const response = await fetchReportTemplateVersions(row.id);
    templateVersions.value = response.data.items;
    templateVersionsVisible.value = true;
  } catch (error) {
    console.warn('load report template versions failed', error);
    ElMessage.error('版本加载失败');
  }
}

async function rollbackTemplateVersion(versionId: string) {
  if (!activeTemplateId.value) {
    return;
  }

  await ElMessageBox.confirm('确认回滚到这个模板版本吗？', '模板回滚', {
    type: 'warning',
  });
  await rollbackReportTemplate(activeTemplateId.value, versionId);
  ElMessage.success('模板已回滚');
  templateVersionsVisible.value = false;
  await loadCurrentTab();
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

function resolveFortuneTemplateKey(contentType: string) {
  return fortuneTemplateOptions.some((item) => item.value === contentType)
    ? contentType
    : 'zodiac_today';
}

function applyFortuneTemplate() {
  fortuneForm.contentType = selectedFortuneTemplate.value;

  if (!fortuneForm.title) {
    fortuneForm.title = resolveFortuneTemplateTitle(selectedFortuneTemplate.value);
  }

  if (!fortuneForm.summary) {
    fortuneForm.summary = resolveFortuneTemplateSummary(selectedFortuneTemplate.value);
  }

  fortuneForm.contentJsonText = buildFortuneContentTemplate(selectedFortuneTemplate.value);
}

function resolveFortuneTemplateTitle(contentType: string) {
  const mapping: Record<string, string> = {
    lucky_sign: '今日幸运签',
    zodiac_today: '星座今日气运',
    zodiac_dimension_daily: '星座四象限指数',
    zodiac_monthly: '星座月运',
    zodiac_share_poster: '星座今日分享图',
  };

  return mapping[contentType] || '运势内容';
}

function resolveFortuneTemplateSummary(contentType: string) {
  const mapping: Record<string, string> = {
    lucky_sign: '今日签语、行动提示和分享图文案。',
    zodiac_today: '今日主题、四象限指数、时间节奏和行动签。',
    zodiac_dimension_daily: '爱情、事业、财富、身心四个维度的指数解释。',
    zodiac_monthly: '月度主题、上中下旬节奏、机会窗口和关键日期。',
    zodiac_share_poster: '星座今日气运分享图标题、强调语和视觉主题。',
  };

  return mapping[contentType] || '可运营的运势内容 JSON。';
}

function buildFortuneContentTemplate(contentType: string) {
  const templates: Record<string, Record<string, unknown>> = {
    lucky_sign: {
      tag: '今日吉签',
      mantra: '先稳住节奏，再顺势推进。',
      sharePoster: {
        title: '今日幸运签',
        accentText: '先稳住节奏',
        themeName: 'fresh-mint',
      },
    },
    zodiac_today: {
      themeTitle: '主动表达，但不急着证明自己',
      themeSummary: '今天适合把状态落到一个清晰动作里，先推进主线，再回应外界期待。',
      keywords: ['主动', '边界', '复盘', '轻表达'],
      score: {
        overall: 86,
        love: 82,
        career: 88,
        wealth: 76,
        wellbeing: 80,
      },
      dimensions: {
        love: {
          title: '让表达更轻',
          summary: '关系里适合主动开口，但不要把每次回应都看成评价。',
          action: '给一个重要的人明确回应。',
        },
        career: {
          title: '先抓主线',
          summary: '工作与学习适合集中处理一件最关键的事。',
          action: '把待办缩到三个以内。',
        },
        wealth: {
          title: '预算先稳住',
          summary: '今天不适合被短期愉悦带着消费。',
          action: '把想买的东西延迟 24 小时。',
        },
        wellbeing: {
          title: '留出恢复时间',
          summary: '身体和情绪需要一点缓冲，不必一直高强度输出。',
          action: '安排一次 10 分钟放空。',
        },
      },
      dayparts: [
        {
          label: '上午',
          suitable: '定目标、处理主线',
          avoid: '临时答应过多请求',
          hint: '把今天最重要的一件事写下来。',
        },
        {
          label: '下午',
          suitable: '沟通、协作、确认资源',
          avoid: '信息不完整时做结论',
          hint: '先对齐优先级，再推动下一步。',
        },
        {
          label: '晚上',
          suitable: '复盘、放松、整理关系',
          avoid: '带着疲惫继续硬撑',
          hint: '给明天留一个清爽起点。',
        },
      ],
      luckyItem: '透明水杯',
      action: {
        id: 'daily-action',
        title: '完成一个小而确定的行动',
        description: '今天只选一件能让你更接近目标的小事，完成后就停下来确认状态。',
        difficulty: 'normal',
        checkInText: '我做到了',
      },
      sharePoster: {
        title: '今日星座气运',
        subtitle: '把好运落到一个清晰行动里',
        accentText: '完成一个小而确定的行动',
        footerText: 'Fortune Hub · 星座气运',
        themeName: 'sky-current',
      },
    },
    zodiac_dimension_daily: {
      score: {
        love: 82,
        career: 88,
        wealth: 76,
        wellbeing: 80,
      },
      dimensions: {
        love: {
          title: '关系表达',
          summary: '适合主动表达真实想法。',
          action: '先说感受，再说期待。',
        },
        career: {
          title: '事业推进',
          summary: '适合集中处理核心任务。',
          action: '保留一个深度工作时段。',
        },
        wealth: {
          title: '财富管理',
          summary: '适合复盘预算。',
          action: '检查一笔不必要的支出。',
        },
        wellbeing: {
          title: '身心状态',
          summary: '适合降低消耗。',
          action: '晚上提前 20 分钟休息。',
        },
      },
    },
    zodiac_monthly: {
      themeTitle: '把分散灵感聚成稳定成果',
      themeSummary: '这个月适合围绕一个核心方向持续推进，减少临时切换。',
      rhythm: [
        { label: '上旬', summary: '先定方向，把最重要的事排到前面。' },
        { label: '中旬', summary: '适合沟通、协作和确认资源。' },
        { label: '下旬', summary: '复盘成果，减少无效消耗。' },
      ],
      relationship: '关系里需要更清晰的表达和边界。',
      career: '事业上适合围绕核心能力持续打磨。',
      money: '财务上先稳住预算，再考虑额外投入。',
      wellbeing: '作息和情绪恢复会影响整个月的发挥。',
      opportunities: ['开启一个可持续的小计划。', '把擅长的事变成可见成果。'],
      cautions: ['不要同时推进太多方向。', '重要决定先等状态稳定后再确认。'],
      keyDays: ['2026-04-06', '2026-04-15', '2026-04-24'],
      action: '每周固定一次复盘，把计划变成真实进度。',
    },
    zodiac_share_poster: {
      title: '今日星座气运',
      subtitle: '把好运落到一个清晰行动里',
      accentText: '完成一个小而确定的行动',
      footerText: 'Fortune Hub · 星座气运',
      themeName: 'sky-current',
      backgroundHint: '清晰星轨、透明能量流线、安静留白，适合叠加指数和行动签。',
    },
  };

  return JSON.stringify(templates[contentType] || templates.zodiac_today, null, 2);
}

function resetCurrentForm() {
  if (activeTab.value === 'fortune') {
    selectedFortuneTemplate.value = 'zodiac_today';
    fortuneForm.contentType = 'zodiac_today';
    fortuneForm.bizCode = '';
    fortuneForm.publishDate = '';
    fortuneForm.title = '星座今日气运';
    fortuneForm.summary = '今日主题、四象限指数、时间节奏和行动签。';
    fortuneForm.status = 'draft';
    fortuneForm.contentJsonText = buildFortuneContentTemplate('zodiac_today');
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
    reportTemplateForm.grayPercent = 100;
    reportTemplateForm.releaseNote = '';
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

function resolveMeditationPreviewUrl(url: string) {
  const trimmed = url.trim();

  if (!trimmed) {
    return '';
  }

  const fileIdMatch = trimmed.match(
    /(?:^|\/)(?:api(?:\/v1)?\/)?files\/([^/?#]+)\/content(?:$|[/?#])/i,
  );

  if (
    fileIdMatch?.[1] &&
    (/^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|host\.docker\.internal)(?::\d+)?\//i.test(trimmed) ||
      trimmed.startsWith('/api/files/'))
  ) {
    return `/api/v1/files/${encodeURIComponent(fileIdMatch[1])}/content`;
  }

  return trimmed;
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

.content-center__template-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  width: 100%;
}

.content-center__audio-preview {
  width: 100%;
}

.content-center__audio-player {
  width: 100%;
}

.content-center__audio-empty {
  color: #6b7280;
  font-size: 13px;
}

.content-center__preview {
  max-height: 360px;
  margin-top: 14px;
  overflow: auto;
  padding: 14px;
  border-radius: 10px;
  background: #0f172a;
  color: #dbeafe;
  font-size: 12px;
  line-height: 1.6;
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
