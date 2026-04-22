<template>
  <div class="shell">
    <div class="shell__inner">
      <section class="overview-band">
        <div class="overview-band__copy">
          <div class="overview-band__eyebrow">fortune-hub / admin</div>
          <h1 class="overview-band__title">{{ dashboard.headline.title }}</h1>
          <p class="overview-band__text">{{ dashboard.headline.subtitle }}</p>
          <div class="overview-band__meta">
            <el-button type="primary" :loading="loading" @click="reload">
              刷新概览
            </el-button>
            <el-button plain @click="openFileService">打开文件服务</el-button>
          </div>
        </div>

        <el-image
          class="overview-band__image"
          :src="heroImage"
          fit="cover"
          alt="Fortune Hub"
        />
      </section>

      <section class="section-grid">
        <div class="stats-grid">
          <el-card
            v-for="item in dashboard.stats"
            :key="item.label"
            shadow="never"
          >
            <template #header>{{ item.label }}</template>
            <div style="font-size: 28px; font-weight: 700; color: #121926">
              {{ item.value }}
            </div>
            <div style="margin-top: 8px; color: #667085">{{ item.hint }}</div>
          </el-card>
        </div>

        <el-card class="module-table" shadow="never">
          <template #header>模块排布</template>
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
        </el-card>

        <el-card class="integration-grid" shadow="never">
          <template #header>基础设施接入</template>
          <div class="integration-item">
            <span class="integration-item__label">MySQL</span>
            <span class="integration-item__value">{{
              dashboard.integrations.mysqlStatus
            }}</span>
          </div>
          <div class="integration-item">
            <span class="integration-item__label">Redis</span>
            <span class="integration-item__value">{{
              dashboard.integrations.redisStatus
            }}</span>
          </div>
          <div class="integration-item">
            <span class="integration-item__label">文件服务</span>
            <span class="integration-item__value">{{
              dashboard.integrations.fileServiceBaseUrl
            }}</span>
          </div>
        </el-card>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { onMounted } from 'vue';
import heroImage from '../assets/hero.png';
import { useDashboardStore } from '../stores/dashboard';

const dashboardStore = useDashboardStore();
const { dashboard, loading } = storeToRefs(dashboardStore);

async function reload() {
  await dashboardStore.load();
}

function openFileService() {
  window.open(dashboard.value.integrations.fileServiceBaseUrl, '_blank');
}

onMounted(() => {
  void reload();
});
</script>
