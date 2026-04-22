<template>
  <div class="dashboard-page">
    <section class="dashboard-hero">
      <div class="dashboard-hero__copy">
        <div class="dashboard-hero__eyebrow">fortune-hub / admin</div>
        <h2 class="dashboard-hero__title">{{ dashboard.headline.title }}</h2>
        <p class="dashboard-hero__text">{{ dashboard.headline.subtitle }}</p>
        <div class="dashboard-hero__actions">
          <el-button type="primary" :loading="loading" @click="reload">
            刷新概览
          </el-button>
          <el-button plain @click="goQuestionBank">进入题库管理</el-button>
          <el-button plain @click="openFileService">打开文件服务</el-button>
        </div>
      </div>

      <el-image
        class="dashboard-hero__image"
        :src="heroImage"
        fit="cover"
        alt="Fortune Hub"
      />
    </section>

    <section class="dashboard-kpis">
      <div
        v-for="item in dashboard.stats"
        :key="item.label"
        class="dashboard-kpi"
      >
        <div class="dashboard-kpi__label">{{ item.label }}</div>
        <div class="dashboard-kpi__value">{{ item.value }}</div>
        <div class="dashboard-kpi__hint">{{ item.hint }}</div>
      </div>
    </section>

    <section class="dashboard-section">
      <div class="dashboard-section__header">
        <div>
          <div class="dashboard-section__eyebrow">module map</div>
          <h3 class="dashboard-section__title">模块排布</h3>
        </div>
      </div>

      <el-table :data="dashboard.modules" stripe>
        <el-table-column prop="title" label="模块" min-width="180" />
        <el-table-column prop="owner" label="归属" min-width="120" />
        <el-table-column prop="status" label="状态" min-width="120">
          <template #default="{ row }">
            <el-tag type="success" effect="light">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="summary" label="说明" min-width="320" />
      </el-table>
    </section>

    <section class="dashboard-section">
      <div class="dashboard-section__header">
        <div>
          <div class="dashboard-section__eyebrow">infra</div>
          <h3 class="dashboard-section__title">基础设施接入</h3>
        </div>
      </div>

      <div class="dashboard-integration-grid">
        <div class="dashboard-integration-item">
          <span class="dashboard-integration-item__label">MySQL</span>
          <span class="dashboard-integration-item__value">{{ dashboard.integrations.mysqlStatus }}</span>
        </div>
        <div class="dashboard-integration-item">
          <span class="dashboard-integration-item__label">Redis</span>
          <span class="dashboard-integration-item__value">{{ dashboard.integrations.redisStatus }}</span>
        </div>
        <div class="dashboard-integration-item">
          <span class="dashboard-integration-item__label">文件服务</span>
          <span class="dashboard-integration-item__value">{{ dashboard.integrations.fileServiceBaseUrl }}</span>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import heroImage from '../assets/hero.png';
import { useDashboardStore } from '../stores/dashboard';

const router = useRouter();
const dashboardStore = useDashboardStore();
const { dashboard, loading } = storeToRefs(dashboardStore);

async function reload() {
  await dashboardStore.load();
}

function goQuestionBank() {
  void router.push('/question-bank');
}

function openFileService() {
  window.open(dashboard.value.integrations.fileServiceBaseUrl, '_blank');
}

onMounted(() => {
  void reload();
});
</script>
