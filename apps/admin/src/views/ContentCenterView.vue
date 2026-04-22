<template>
  <div class="content-center">
    <section class="content-center__toolbar">
      <el-select v-model="filters.contentType" clearable placeholder="按内容类型筛选">
        <el-option
          v-for="item in contentTypeOptions"
          :key="item"
          :label="item"
          :value="item"
        />
      </el-select>
      <el-input v-model="filters.keyword" clearable placeholder="搜索标题 / bizCode / 类型" />
      <el-button type="primary" :loading="loading" @click="loadContents">刷新</el-button>
      <el-button plain @click="openCreateDialog">新增内容</el-button>
    </section>

    <el-card shadow="never">
      <el-table :data="items" stripe v-loading="loading">
        <el-table-column prop="contentType" label="类型" min-width="120" />
        <el-table-column prop="bizCode" label="bizCode" min-width="160" />
        <el-table-column prop="title" label="标题" min-width="200" />
        <el-table-column prop="status" label="状态" min-width="100" />
        <el-table-column prop="publishDate" label="发布日期" min-width="120" />
        <el-table-column prop="updatedAt" label="更新时间" min-width="180" />
        <el-table-column label="操作" min-width="180" fixed="right">
          <template #default="{ row }">
            <el-button text type="primary" @click="openEditDialog(row)">编辑</el-button>
            <el-button text type="danger" @click="removeItem(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="editingId ? '编辑内容' : '新增内容'"
      width="760px"
      destroy-on-close
    >
      <el-form label-position="top">
        <div class="content-center__grid">
          <el-form-item label="内容类型">
            <el-input v-model="form.contentType" placeholder="例如 lucky_sign / zodiac_daily" />
          </el-form-item>
          <el-form-item label="bizCode">
            <el-input v-model="form.bizCode" placeholder="例如 sign-breeze-open" />
          </el-form-item>
          <el-form-item label="发布日期">
            <el-input v-model="form.publishDate" placeholder="YYYY-MM-DD，可留空" />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="form.status">
              <el-option label="published" value="published" />
              <el-option label="draft" value="draft" />
            </el-select>
          </el-form-item>
        </div>

        <el-form-item label="标题">
          <el-input v-model="form.title" />
        </el-form-item>

        <el-form-item label="摘要">
          <el-input v-model="form.summary" type="textarea" :rows="2" />
        </el-form-item>

        <el-form-item label="内容 JSON">
          <el-input v-model="form.contentJsonText" type="textarea" :rows="14" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveItem">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  createFortuneContent,
  deleteFortuneContent,
  fetchFortuneContents,
  updateFortuneContent,
  type FortuneContentItem,
} from '../api/content-center';

const contentTypeOptions = [
  'lucky_sign',
  'lucky_item',
  'zodiac_daily',
  'zodiac_weekly',
  'zodiac_yearly',
  'zodiac_knowledge',
  'zodiac_compatibility',
];

const loading = ref(false);
const saving = ref(false);
const dialogVisible = ref(false);
const editingId = ref('');
const items = ref<FortuneContentItem[]>([]);
const filters = reactive({
  contentType: '',
  keyword: '',
});
const form = reactive({
  contentType: 'lucky_sign',
  bizCode: '',
  publishDate: '',
  title: '',
  summary: '',
  status: 'published' as 'draft' | 'published',
  contentJsonText: '{\n  "tag": "今日吉签"\n}',
});

async function loadContents() {
  try {
    loading.value = true;
    const response = await fetchFortuneContents({
      contentType: filters.contentType || undefined,
      keyword: filters.keyword || undefined,
    });
    items.value = response.data.items;
  } catch (error) {
    console.warn('load fortune contents failed', error);
    ElMessage.error('内容列表加载失败');
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  editingId.value = '';
  form.contentType = 'lucky_sign';
  form.bizCode = '';
  form.publishDate = '';
  form.title = '';
  form.summary = '';
  form.status = 'published';
  form.contentJsonText = '{\n  "tag": "今日吉签"\n}';
}

function openCreateDialog() {
  resetForm();
  dialogVisible.value = true;
}

function openEditDialog(item: FortuneContentItem) {
  editingId.value = item.id;
  form.contentType = item.contentType;
  form.bizCode = item.bizCode;
  form.publishDate = item.publishDate || '';
  form.title = item.title;
  form.summary = item.summary || '';
  form.status = item.status;
  form.contentJsonText = JSON.stringify(item.contentJson, null, 2);
  dialogVisible.value = true;
}

async function saveItem() {
  let contentJson: Record<string, unknown>;

  try {
    contentJson = JSON.parse(form.contentJsonText) as Record<string, unknown>;
  } catch {
    ElMessage.error('内容 JSON 不是合法格式');
    return;
  }

  const payload = {
    contentType: form.contentType.trim(),
    bizCode: form.bizCode.trim(),
    publishDate: form.publishDate.trim() || null,
    title: form.title.trim(),
    summary: form.summary.trim(),
    status: form.status,
    contentJson,
  };

  try {
    saving.value = true;
    if (editingId.value) {
      await updateFortuneContent(editingId.value, payload);
    } else {
      await createFortuneContent(payload);
    }
    ElMessage.success('内容已保存');
    dialogVisible.value = false;
    await loadContents();
  } catch (error) {
    console.warn('save fortune content failed', error);
    ElMessage.error('内容保存失败');
  } finally {
    saving.value = false;
  }
}

async function removeItem(item: FortuneContentItem) {
  try {
    await ElMessageBox.confirm(`确认删除 ${item.title} 吗？`, '删除内容', {
      type: 'warning',
    });
    await deleteFortuneContent(item.id);
    ElMessage.success('内容已删除');
    await loadContents();
  } catch (error) {
    if (error !== 'cancel') {
      console.warn('delete fortune content failed', error);
    }
  }
}

onMounted(() => {
  void loadContents();
});
</script>

<style scoped lang="scss">
.content-center {
  display: grid;
  gap: 20px;
}

.content-center__toolbar,
.content-center__grid {
  display: grid;
  gap: 14px;
}

.content-center__toolbar {
  grid-template-columns: 180px minmax(0, 1fr) auto auto;
}

.content-center__grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

@media (max-width: 960px) {
  .content-center__toolbar,
  .content-center__grid {
    grid-template-columns: 1fr;
  }
}
</style>
