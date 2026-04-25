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
        <el-table :data="feedback" stripe v-loading="loading">
          <el-table-column prop="category" label="分类" width="110" />
          <el-table-column prop="message" label="内容" min-width="300" />
          <el-table-column prop="contact" label="联系方式" min-width="140" />
          <el-table-column prop="status" label="状态" width="120" />
          <el-table-column prop="adminReply" label="回复" min-width="220" />
          <el-table-column label="操作" width="220">
            <template #default="{ row }">
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
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  fetchAdminAdUnlocks,
  fetchAdminAuditLogs,
  fetchAdminFeedback,
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
const zhipuStatus = ref<ZhipuImageStatus | null>(null);
const zhipuPreview = ref('');
const zhipuTesting = ref(false);

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
      fetchAdminFeedback(),
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

async function markFeedbackResolved(id: string) {
  await updateAdminFeedbackStatus(id, {
    status: 'resolved',
    adminNote: '后台已标记处理',
  });
  ElMessage.success('已标记处理');
  await loadAll();
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
  await loadAll();
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

onMounted(() => {
  void loadAll();
});
</script>

<style scoped>
.drawer-title {
  margin: 20px 0 10px;
  font-size: 15px;
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
