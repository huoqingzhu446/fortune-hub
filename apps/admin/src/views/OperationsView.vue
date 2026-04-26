<template>
  <div class="operations-page">
    <section class="operations-page__header">
      <div>
        <div class="operations-page__eyebrow">operations</div>
        <h2 class="operations-page__title">运营中心</h2>
      </div>
      <el-button type="primary" :loading="loading" @click="loadAll">刷新</el-button>
    </section>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="用户" name="users">
        <el-table :data="users" stripe v-loading="loading">
          <el-table-column prop="id" label="ID" width="90" />
          <el-table-column prop="nickname" label="昵称" min-width="140" />
          <el-table-column prop="zodiac" label="星座" min-width="100" />
          <el-table-column prop="vipStatus" label="会员" min-width="100" />
          <el-table-column prop="lastLoginAt" label="最近登录" min-width="180" />
          <el-table-column label="操作" width="180">
            <template #default="{ row }">
              <el-button text type="primary" @click="openUserDetail(row.id)">详情</el-button>
              <el-button text type="primary" @click="toggleVip(row)">切换会员</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="订单" name="orders">
        <el-table :data="orders" stripe v-loading="loading">
          <el-table-column prop="orderNo" label="订单号" min-width="210" />
          <el-table-column prop="productTitle" label="商品" min-width="160" />
          <el-table-column prop="amountLabel" label="金额" min-width="100" />
          <el-table-column prop="status" label="状态" min-width="100" />
          <el-table-column prop="createdAt" label="创建时间" min-width="180" />
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="反馈" name="feedback">
        <div class="feedback-toolbar">
          <el-input
            v-model="feedbackFilters.keyword"
            clearable
            placeholder="搜索内容 / 联系方式"
            @keyup.enter="loadFeedback"
          />
          <el-select v-model="feedbackFilters.status" placeholder="状态" @change="loadFeedback">
            <el-option label="全部状态" value="all" />
            <el-option label="待处理" value="open" />
            <el-option label="处理中" value="processing" />
            <el-option label="已处理" value="resolved" />
            <el-option label="已关闭" value="closed" />
          </el-select>
          <el-select v-model="feedbackFilters.category" placeholder="分类" @change="loadFeedback">
            <el-option label="全部分类" value="all" />
            <el-option label="功能建议" value="feature" />
            <el-option label="问题反馈" value="bug" />
            <el-option label="内容纠错" value="content" />
            <el-option label="其他" value="general" />
          </el-select>
          <el-select v-model="feedbackFilters.priority" placeholder="优先级" @change="loadFeedback">
            <el-option label="全部优先级" value="all" />
            <el-option label="紧急" value="urgent" />
            <el-option label="高" value="high" />
            <el-option label="普通" value="normal" />
            <el-option label="低" value="low" />
          </el-select>
          <el-select v-model="feedbackFilters.slaStatus" placeholder="SLA" @change="loadFeedback">
            <el-option label="全部 SLA" value="all" />
            <el-option label="已超时" value="overdue" />
            <el-option label="临近超时" value="risk" />
            <el-option label="正常" value="ok" />
            <el-option label="已完成" value="done" />
          </el-select>
          <el-button :loading="loading" @click="loadFeedback">筛选</el-button>
        </div>
        <el-table :data="feedback" stripe v-loading="loading">
          <el-table-column prop="category" label="分类" width="110" />
          <el-table-column prop="message" label="内容" min-width="280" show-overflow-tooltip />
          <el-table-column prop="contact" label="联系方式" min-width="140" />
          <el-table-column label="状态" width="110">
            <template #default="{ row }">
              <el-tag :type="feedbackStatusTagType(row.status)" effect="plain">
                {{ formatFeedbackStatus(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="优先级" width="100">
            <template #default="{ row }">
              <el-tag :type="feedbackPriorityTagType(row.priority)" effect="plain">
                {{ formatFeedbackPriority(row.priority) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="SLA" width="120">
            <template #default="{ row }">
              <el-tag :type="feedbackSlaTagType(row.slaStatus)" effect="dark">
                {{ formatFeedbackSla(row.slaStatus) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="到期" min-width="150">
            <template #default="{ row }">{{ formatDateTime(row.slaDueAt) }}</template>
          </el-table-column>
          <el-table-column prop="adminReply" label="回复" min-width="200" show-overflow-tooltip />
          <el-table-column label="操作" width="260" fixed="right">
            <template #default="{ row }">
              <el-button text type="primary" @click="openFeedbackDetail(row.id)">详情</el-button>
              <el-button text type="primary" @click="markFeedbackResolved(row.id)">标记已处理</el-button>
              <el-button text type="primary" @click="replyFeedback(row.id)">回复</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="广告解锁" name="adUnlocks">
        <el-table :data="adUnlocks" stripe v-loading="loading">
          <el-table-column prop="userId" label="用户" width="100" />
          <el-table-column prop="recordType" label="类型" width="120" />
          <el-table-column prop="resultTitle" label="报告" min-width="220" />
          <el-table-column prop="unlockedAt" label="解锁时间" min-width="180" />
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="通知" name="notifications">
        <el-table :data="notificationLogs" stripe v-loading="loading">
          <el-table-column prop="scene" label="场景" width="150" />
          <el-table-column prop="status" label="状态" width="100" />
          <el-table-column prop="retryCount" label="重试" width="80" />
          <el-table-column prop="errorMessage" label="错误" min-width="220" />
          <el-table-column prop="createdAt" label="创建时间" min-width="180" />
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="审计" name="audit">
        <el-table :data="auditLogs" stripe v-loading="loading">
          <el-table-column prop="actorType" label="操作者" width="100" />
          <el-table-column prop="action" label="动作" min-width="140" />
          <el-table-column prop="resourceType" label="资源" min-width="140" />
          <el-table-column prop="resourceId" label="资源 ID" min-width="120" />
          <el-table-column prop="createdAt" label="时间" min-width="180" />
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="集成诊断" name="integrations">
        <el-card shadow="never">
          <template #header>
            <div class="integration-head">
              <span>智谱生图</span>
              <el-button size="small" :loading="zhipuTesting" @click="runZhipuTest">测试生成</el-button>
            </div>
          </template>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="密钥">{{ zhipuStatus?.configured ? '已配置' : '未配置' }}</el-descriptions-item>
            <el-descriptions-item label="模型环境变量">{{ zhipuStatus?.modelEnv }}</el-descriptions-item>
            <el-descriptions-item label="生成超时变量">{{ zhipuStatus?.timeoutEnv }}</el-descriptions-item>
          </el-descriptions>
          <el-image v-if="zhipuPreview" class="zhipu-preview" :src="zhipuPreview" fit="cover" />
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <el-drawer v-model="userDrawerVisible" title="用户详情" size="520px">
      <template v-if="userDetail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="昵称">{{ userDetail.user.nickname || '-' }}</el-descriptions-item>
          <el-descriptions-item label="会员">{{ userDetail.user.vipStatus }}</el-descriptions-item>
          <el-descriptions-item label="到期">{{ userDetail.user.vipExpiredAt || '-' }}</el-descriptions-item>
          <el-descriptions-item label="OpenID">{{ userDetail.user.openid }}</el-descriptions-item>
        </el-descriptions>
        <h3 class="drawer-title">最近订单</h3>
        <el-table :data="userDetail.orders" size="small">
          <el-table-column prop="orderNo" label="订单号" min-width="180" />
          <el-table-column prop="status" label="状态" width="90" />
        </el-table>
        <h3 class="drawer-title">最近记录</h3>
        <el-table :data="userDetail.records" size="small">
          <el-table-column prop="resultTitle" label="标题" min-width="180" />
          <el-table-column prop="unlockType" label="解锁" width="90" />
        </el-table>
      </template>
    </el-drawer>

    <el-drawer v-model="feedbackDrawerVisible" title="反馈详情" size="620px">
      <template v-if="feedbackDetail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="反馈 ID">{{ feedbackDetail.id }}</el-descriptions-item>
          <el-descriptions-item label="用户 ID">{{ feedbackDetail.userId || '-' }}</el-descriptions-item>
          <el-descriptions-item label="分类">{{ feedbackDetail.category }}</el-descriptions-item>
          <el-descriptions-item label="来源">{{ feedbackDetail.source }}</el-descriptions-item>
          <el-descriptions-item label="联系方式">{{ feedbackDetail.contact || '-' }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDateTime(feedbackDetail.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="SLA">
            <el-tag :type="feedbackSlaTagType(feedbackDetail.slaStatus)" effect="dark">
              {{ formatFeedbackSla(feedbackDetail.slaStatus) }}
            </el-tag>
            <span class="sla-due">到期：{{ formatDateTime(feedbackDetail.slaDueAt) }}</span>
          </el-descriptions-item>
        </el-descriptions>

        <h3 class="drawer-title">反馈内容</h3>
        <p class="feedback-message">{{ feedbackDetail.message }}</p>

        <h3 class="drawer-title">附件</h3>
        <div v-if="feedbackDetail.attachments.length" class="attachment-links">
          <el-link
            v-for="attachment in feedbackDetail.attachments"
            :key="attachment.url"
            type="primary"
            :href="attachment.url"
            target="_blank"
          >
            {{ attachment.originalName || attachment.fileName }}
          </el-link>
        </div>
        <el-empty v-else description="暂无附件" :image-size="72" />

        <h3 class="drawer-title">处理</h3>
        <el-form label-position="top" class="feedback-form">
          <el-form-item label="状态">
            <el-select v-model="feedbackForm.status">
              <el-option label="待处理" value="open" />
              <el-option label="处理中" value="processing" />
              <el-option label="已处理" value="resolved" />
              <el-option label="已关闭" value="closed" />
            </el-select>
          </el-form-item>
          <el-form-item label="优先级">
            <el-select v-model="feedbackForm.priority">
              <el-option label="紧急" value="urgent" />
              <el-option label="高" value="high" />
              <el-option label="普通" value="normal" />
              <el-option label="低" value="low" />
            </el-select>
          </el-form-item>
          <el-form-item label="处理人">
            <el-input v-model="feedbackForm.assignee" placeholder="例如：客服 A" />
          </el-form-item>
          <el-form-item label="用户可见回复">
            <el-input
              v-model="feedbackForm.adminReply"
              type="textarea"
              :rows="4"
              placeholder="回复后会向已授权订阅消息的用户发送反馈处理通知"
            />
          </el-form-item>
          <el-form-item label="内部备注">
            <el-input v-model="feedbackForm.adminNote" type="textarea" :rows="3" />
          </el-form-item>
          <el-button type="primary" :loading="feedbackSaving" @click="saveFeedbackDetail">
            保存处理
          </el-button>
        </el-form>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  fetchAdminAdUnlocks,
  fetchAdminAuditLogs,
  fetchAdminFeedback,
  fetchAdminFeedbackDetail,
  fetchAdminNotificationLogs,
  fetchAdminOrders,
  fetchAdminUserDetail,
  fetchAdminUsers,
  fetchZhipuImageStatus,
  testZhipuImage,
  updateAdminUserMembership,
  updateAdminFeedbackStatus,
  type AdminUserDetailData,
  type ZhipuImageStatus,
  type AdminAdUnlockItem,
  type AdminAuditLogItem,
  type AdminFeedbackItem,
  type AdminNotificationLogItem,
  type AdminOrderItem,
  type AdminUserItem,
} from '../api/operations';

const activeTab = ref('users');
const loading = ref(false);
const users = ref<AdminUserItem[]>([]);
const orders = ref<AdminOrderItem[]>([]);
const feedback = ref<AdminFeedbackItem[]>([]);
const adUnlocks = ref<AdminAdUnlockItem[]>([]);
const notificationLogs = ref<AdminNotificationLogItem[]>([]);
const auditLogs = ref<AdminAuditLogItem[]>([]);
const userDrawerVisible = ref(false);
const userDetail = ref<AdminUserDetailData | null>(null);
const feedbackDrawerVisible = ref(false);
const feedbackDetail = ref<AdminFeedbackItem | null>(null);
const feedbackSaving = ref(false);
const feedbackFilters = reactive({
  keyword: '',
  status: 'all',
  category: 'all',
  priority: 'all',
  slaStatus: 'all',
});
const feedbackForm = reactive({
  status: 'open',
  priority: 'normal',
  assignee: '',
  adminReply: '',
  adminNote: '',
});
const zhipuStatus = ref<ZhipuImageStatus | null>(null);
const zhipuPreview = ref('');
const zhipuTesting = ref(false);

function buildFeedbackFilterParams() {
  return {
    keyword: feedbackFilters.keyword.trim() || undefined,
    status: feedbackFilters.status,
    category: feedbackFilters.category,
    priority: feedbackFilters.priority,
    slaStatus: feedbackFilters.slaStatus,
  };
}

async function loadAll() {
  try {
    loading.value = true;
    const [
      userResponse,
      orderResponse,
      feedbackResponse,
      adUnlockResponse,
      notificationResponse,
      auditResponse,
      zhipuStatusResponse,
    ] = await Promise.all([
      fetchAdminUsers(),
      fetchAdminOrders(),
      fetchAdminFeedback(buildFeedbackFilterParams()),
      fetchAdminAdUnlocks(),
      fetchAdminNotificationLogs(),
      fetchAdminAuditLogs(),
      fetchZhipuImageStatus(),
    ]);

    users.value = userResponse.data.items;
    orders.value = orderResponse.data.items;
    feedback.value = feedbackResponse.data.items;
    adUnlocks.value = adUnlockResponse.data.items;
    notificationLogs.value = notificationResponse.data.items;
    auditLogs.value = auditResponse.data.items;
    zhipuStatus.value = zhipuStatusResponse.data;
  } catch (error) {
    console.warn('load operations failed', error);
    ElMessage.error('运营数据加载失败');
  } finally {
    loading.value = false;
  }
}

async function loadFeedback() {
  try {
    loading.value = true;
    const response = await fetchAdminFeedback(buildFeedbackFilterParams());
    feedback.value = response.data.items;
  } catch (error) {
    console.warn('load feedback failed', error);
    ElMessage.error('反馈数据加载失败');
  } finally {
    loading.value = false;
  }
}

async function markFeedbackResolved(id: string) {
  await updateAdminFeedbackStatus(id, {
    status: 'resolved',
    adminNote: '后台已标记处理',
  });
  ElMessage.success('已标记处理');
  await loadFeedback();
}

async function replyFeedback(id: string) {
  const { value } = await ElMessageBox.prompt('输入给用户看的回复内容', '回复反馈', {
    inputType: 'textarea',
    inputPlaceholder: '例如：问题已定位，预计下个版本修复。',
  });
  await updateAdminFeedbackStatus(id, {
    status: 'processing',
    adminReply: value,
    adminNote: '已回复用户',
  });
  ElMessage.success('已回复反馈');
  await loadFeedback();
}

async function openFeedbackDetail(id: string) {
  const response = await fetchAdminFeedbackDetail(id);
  feedbackDetail.value = response.data.item;
  fillFeedbackForm(response.data.item);
  feedbackDrawerVisible.value = true;
}

function fillFeedbackForm(item: AdminFeedbackItem) {
  feedbackForm.status = item.status || 'open';
  feedbackForm.priority = item.priority || 'normal';
  feedbackForm.assignee = item.assignee || '';
  feedbackForm.adminReply = item.adminReply || '';
  feedbackForm.adminNote = item.adminNote || '';
}

async function saveFeedbackDetail() {
  if (!feedbackDetail.value) {
    return;
  }

  try {
    feedbackSaving.value = true;
    const response = await updateAdminFeedbackStatus(feedbackDetail.value.id, {
      status: feedbackForm.status,
      priority: feedbackForm.priority,
      assignee: feedbackForm.assignee.trim() || undefined,
      adminReply: feedbackForm.adminReply.trim() || undefined,
      adminNote: feedbackForm.adminNote.trim() || undefined,
    });
    feedbackDetail.value = response.data.item;
    fillFeedbackForm(response.data.item);
    ElMessage.success('反馈处理已保存');
    await loadFeedback();
  } catch (error) {
    console.warn('save feedback failed', error);
    ElMessage.error('反馈处理保存失败');
  } finally {
    feedbackSaving.value = false;
  }
}

async function openUserDetail(id: string) {
  const response = await fetchAdminUserDetail(id);
  userDetail.value = response.data;
  userDrawerVisible.value = true;
}

async function toggleVip(row: AdminUserItem) {
  const nextStatus = row.vipStatus === 'active' ? 'inactive' : 'active';
  const expireAt =
    nextStatus === 'active'
      ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      : null;
  await updateAdminUserMembership(row.id, {
    vipStatus: nextStatus,
    vipExpiredAt: expireAt,
  });
  ElMessage.success('会员状态已更新');
  await loadAll();
}

async function runZhipuTest() {
  try {
    zhipuTesting.value = true;
    const response = await testZhipuImage();
    zhipuPreview.value = response.data.item.imageDataUrl;
    ElMessage.success('智谱生图测试成功');
  } catch (error) {
    console.warn('zhipu image test failed', error);
    ElMessage.error('智谱生图测试失败，请检查 API Key / 模型 / 超时配置');
  } finally {
    zhipuTesting.value = false;
  }
}

function formatDateTime(value: string | null) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('zh-CN', {
    hour12: false,
  });
}

function formatFeedbackStatus(status: string) {
  const labels: Record<string, string> = {
    open: '待处理',
    processing: '处理中',
    resolved: '已处理',
    closed: '已关闭',
  };
  return labels[status] || status;
}

function feedbackStatusTagType(status: string) {
  const types: Record<string, string> = {
    open: 'warning',
    processing: 'primary',
    resolved: 'success',
    closed: 'info',
  };
  return types[status] || 'info';
}

function formatFeedbackPriority(priority: string) {
  const labels: Record<string, string> = {
    urgent: '紧急',
    high: '高',
    normal: '普通',
    low: '低',
  };
  return labels[priority] || priority;
}

function feedbackPriorityTagType(priority: string) {
  const types: Record<string, string> = {
    urgent: 'danger',
    high: 'warning',
    normal: 'info',
    low: 'info',
  };
  return types[priority] || 'info';
}

function formatFeedbackSla(status: string) {
  const labels: Record<string, string> = {
    overdue: '已超时',
    risk: '临近',
    ok: '正常',
    done: '完成',
    unset: '未设置',
  };
  return labels[status] || status;
}

function feedbackSlaTagType(status: string) {
  const types: Record<string, string> = {
    overdue: 'danger',
    risk: 'warning',
    ok: 'success',
    done: 'info',
    unset: 'info',
  };
  return types[status] || 'info';
}

onMounted(() => {
  void loadAll();
});
</script>

<style scoped>
.drawer-title {
  margin: 20px 0 10px;
  font-size: 15px;
}

.feedback-toolbar {
  display: grid;
  grid-template-columns: minmax(220px, 1.4fr) repeat(4, minmax(120px, 0.8fr)) auto;
  gap: 10px;
  margin-bottom: 14px;
  align-items: center;
}

.feedback-message {
  margin: 0;
  padding: 12px;
  border-radius: 8px;
  line-height: 1.7;
  white-space: pre-wrap;
  background: #f6f8fb;
}

.attachment-links {
  display: grid;
  gap: 8px;
}

.feedback-form {
  display: grid;
  gap: 4px;
}

.sla-due {
  margin-left: 10px;
  color: #667085;
}

.integration-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.zhipu-preview {
  width: 220px;
  height: 220px;
  margin-top: 16px;
  border-radius: 8px;
}
</style>
