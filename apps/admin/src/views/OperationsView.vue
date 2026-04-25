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
          <el-table-column label="操作" width="150">
            <template #default="{ row }">
              <el-button text type="primary" @click="markFeedbackResolved(row.id)">标记已处理</el-button>
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
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import {
  fetchAdminAdUnlocks,
  fetchAdminAuditLogs,
  fetchAdminFeedback,
  fetchAdminNotificationLogs,
  fetchAdminOrders,
  fetchAdminUsers,
  updateAdminFeedbackStatus,
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
    ] = await Promise.all([
      fetchAdminUsers(),
      fetchAdminOrders(),
      fetchAdminFeedback(),
      fetchAdminAdUnlocks(),
      fetchAdminNotificationLogs(),
      fetchAdminAuditLogs(),
    ]);

    users.value = userResponse.data.items;
    orders.value = orderResponse.data.items;
    feedback.value = feedbackResponse.data.items;
    adUnlocks.value = adUnlockResponse.data.items;
    notificationLogs.value = notificationResponse.data.items;
    auditLogs.value = auditResponse.data.items;
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

onMounted(() => {
  void loadAll();
});
</script>
