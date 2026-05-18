<template>
  <div class="deploy-page">
    <section class="deploy-hero">
      <div class="deploy-hero__copy">
        <div class="deploy-hero__eyebrow">fortune-hub / admin</div>
        <h2 class="deploy-hero__title">部署管理</h2>
      </div>
    </section>

    <!-- Status Card -->
    <section class="deploy-section">
      <el-card shadow="never">
        <template #header>
          <span>当前状态</span>
        </template>
        <div class="deploy-status">
          <div class="deploy-status__indicator">
            <span
              class="deploy-status__dot"
              :class="status?.deploying ? 'deploy-status__dot--deploying' : 'deploy-status__dot--idle'"
            />
            <span class="deploy-status__text">
              {{ status?.deploying ? '部署中' : '空闲' }}
            </span>
          </div>
          <el-button
            type="primary"
            :loading="triggering"
            :disabled="status?.deploying ?? false"
            @click="handleTrigger"
          >
            {{ status?.deploying ? '部署中...' : '一键部署' }}
          </el-button>
        </div>
      </el-card>
    </section>

    <!-- Last Deploy Info -->
    <section class="deploy-section">
      <el-card shadow="never">
        <template #header>
          <span>最近部署</span>
        </template>
        <div v-if="status?.lastDeploy" class="deploy-info">
          <div class="deploy-info__row">
            <span class="deploy-info__label">状态</span>
            <span class="deploy-info__value">
              <el-tag
                :type="status.lastDeploy.status === 'success' ? 'success' : 'danger'"
                size="small"
              >
                {{ status.lastDeploy.status === 'success' ? '成功' : '失败' }}
              </el-tag>
            </span>
          </div>
          <div class="deploy-info__row">
            <span class="deploy-info__label">触发时间</span>
            <span class="deploy-info__value">{{ formatDate(status.lastDeploy.startedAt) }}</span>
          </div>
          <div class="deploy-info__row">
            <span class="deploy-info__label">完成时间</span>
            <span class="deploy-info__value">{{ formatDate(status.lastDeploy.finishedAt) }}</span>
          </div>
          <div class="deploy-info__row">
            <span class="deploy-info__label">耗时</span>
            <span class="deploy-info__value">
              {{ status.lastDeploy.duration != null ? `${status.lastDeploy.duration}s` : '-' }}
            </span>
          </div>
          <div class="deploy-info__row">
            <span class="deploy-info__label">触发人</span>
            <span class="deploy-info__value">{{ status.lastDeploy.triggeredBy || '-' }}</span>
          </div>
          <div class="deploy-info__row">
            <span class="deploy-info__label">当前版本</span>
            <span class="deploy-info__value deploy-info__value--mono">
              {{ formatCommit(status.lastDeploy.commitHash) }}
            </span>
          </div>
        </div>
        <el-empty v-else description="暂无部署记录" :image-size="60" />
      </el-card>
    </section>

    <!-- Logs -->
    <section class="deploy-section">
      <el-card shadow="never">
        <template #header>
          <div class="deploy-logs-header">
            <span>部署日志</span>
            <el-button size="small" :loading="logsLoading" @click="fetchLogs">刷新日志</el-button>
          </div>
        </template>
        <div class="deploy-logs" ref="logsContainer">
          <pre class="deploy-logs__content">{{ logs || '暂无日志' }}</pre>
        </div>
      </el-card>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getDeployStatus, triggerDeploy, getDeployLogs, type DeployStatus } from '../api/deploy';

const status = ref<DeployStatus | null>(null);
const logs = ref('');
const triggering = ref(false);
const logsLoading = ref(false);
const logsContainer = ref<HTMLElement | null>(null);
let pollingTimer: ReturnType<typeof setInterval> | null = null;

async function fetchStatus() {
  try {
    status.value = await getDeployStatus();
  } catch {
    ElMessage.error('获取部署状态失败');
  }
}

async function fetchLogs() {
  logsLoading.value = true;
  try {
    const result = await getDeployLogs();
    logs.value = result.log;
    await nextTick();
    scrollToBottom();
  } catch {
    ElMessage.error('获取部署日志失败');
  } finally {
    logsLoading.value = false;
  }
}

function scrollToBottom() {
  if (logsContainer.value) {
    logsContainer.value.scrollTop = logsContainer.value.scrollHeight;
  }
}

function startPolling() {
  stopPolling();
  pollingTimer = setInterval(() => {
    fetchStatus();
    fetchLogs();
  }, 3000);
}

function stopPolling() {
  if (pollingTimer !== null) {
    clearInterval(pollingTimer);
    pollingTimer = null;
  }
}

watch(
  () => status.value?.deploying,
  (deploying) => {
    if (deploying) {
      startPolling();
    } else {
      stopPolling();
    }
  },
);

async function handleTrigger() {
  try {
    await ElMessageBox.confirm('确定要部署到生产环境吗？', '确认部署', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });
  } catch {
    return;
  }

  triggering.value = true;
  try {
    await triggerDeploy();
    ElMessage.success('部署已触发');
    await fetchStatus();
    await fetchLogs();
  } catch (error: unknown) {
    const axiosError = error as { response?: { status?: number; data?: { message?: string } } };
    if (axiosError.response?.status === 409) {
      ElMessage.warning('正在部署中，请稍后再试');
    } else if (axiosError.response?.status === 429) {
      ElMessage.warning('操作过于频繁，请稍后再试');
    } else {
      ElMessage.error(axiosError.response?.data?.message || '触发部署失败');
    }
  } finally {
    triggering.value = false;
  }
}

function formatDate(iso: string | null) {
  if (!iso) return '-';
  try {
    const d = new Date(iso);
    return d.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return iso;
  }
}

function formatCommit(hash: string | null) {
  if (!hash) return '-';
  return hash.slice(0, 7);
}

onMounted(async () => {
  await fetchStatus();
  await fetchLogs();
});

onUnmounted(() => {
  stopPolling();
});
</script>

<style scoped lang="scss">
.deploy-page {
  padding: 24px;
  max-width: 1400px;
}

.deploy-hero {
  margin-bottom: 24px;

  &__eyebrow {
    font-size: 13px;
    color: var(--el-text-color-secondary);
    text-transform: uppercase;
    letter-spacing: 2px;
  }

  &__title {
    font-size: 28px;
    font-weight: 700;
    margin: 4px 0 16px;
    color: var(--el-text-color-primary);
  }
}

.deploy-section {
  margin-bottom: 24px;
}

.deploy-status {
  display: flex;
  align-items: center;
  justify-content: space-between;

  &__indicator {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  &__dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    display: inline-block;

    &--idle {
      background-color: var(--el-color-success);
    }

    &--deploying {
      background-color: var(--el-color-warning);
      animation: pulse 1.5s infinite;
    }
  }

  &__text {
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
}

@keyframes pulse {
  0% {
    opacity: 1;
  }

  50% {
    opacity: 0.4;
  }

  100% {
    opacity: 1;
  }
}

.deploy-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px 32px;

  &__row {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__label {
    font-size: 13px;
    color: var(--el-text-color-secondary);
    min-width: 72px;
    flex-shrink: 0;
  }

  &__value {
    font-size: 14px;
    color: var(--el-text-color-primary);

    &--mono {
      font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
      background: var(--el-fill-color-light);
      padding: 2px 8px;
      border-radius: 4px;
    }
  }
}

.deploy-logs-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.deploy-logs {
  background: #1e1e1e;
  border-radius: 8px;
  padding: 16px;
  max-height: 420px;
  overflow-y: auto;

  &__content {
    margin: 0;
    font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
    font-size: 13px;
    line-height: 1.6;
    color: #d4d4d4;
    white-space: pre-wrap;
    word-break: break-all;
  }
}
</style>
