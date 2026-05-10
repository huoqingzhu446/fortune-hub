<template>
  <div class="dashboard-page">
    <section class="dashboard-hero">
      <div class="dashboard-hero__copy">
        <div class="dashboard-hero__eyebrow">fortune-hub / admin</div>
        <h2 class="dashboard-hero__title">控制台</h2>
        <div class="dashboard-hero__actions">
          <el-button type="primary" :loading="loading" @click="reload">刷新数据</el-button>
        </div>
      </div>
    </section>

    <!-- KPI Cards -->
    <section class="dashboard-kpis">
      <div class="dashboard-kpi">
        <div class="dashboard-kpi__label">用户总数</div>
        <div class="dashboard-kpi__value">{{ dashboard.totals.users }}</div>
        <div class="dashboard-kpi__sub">
          今日新增 <strong>+{{ dashboard.today.newUsers }}</strong>
          &nbsp;|&nbsp; VIP <strong>{{ dashboard.totals.vipUsers }}</strong>
        </div>
      </div>
      <div class="dashboard-kpi">
        <div class="dashboard-kpi__label">订单总数</div>
        <div class="dashboard-kpi__value">{{ dashboard.totals.orders }}</div>
        <div class="dashboard-kpi__sub">
          今日新增 <strong>+{{ dashboard.today.newOrders }}</strong>
          &nbsp;|&nbsp; 已支付 <strong>{{ dashboard.revenue.paidOrderCount }}</strong>
        </div>
      </div>
      <div class="dashboard-kpi">
        <div class="dashboard-kpi__label">总营收</div>
        <div class="dashboard-kpi__value">¥{{ dashboard.revenue.totalYuan }}</div>
        <div class="dashboard-kpi__sub">
          本月 <strong>¥{{ dashboard.revenue.thisMonthYuan }}</strong>
        </div>
      </div>
      <div class="dashboard-kpi">
        <div class="dashboard-kpi__label">待处理反馈</div>
        <div class="dashboard-kpi__value">{{ dashboard.totals.openFeedback }}</div>
        <div class="dashboard-kpi__sub">
          分享记录 <strong>{{ dashboard.totals.shareRecords }}</strong>
        </div>
      </div>
    </section>

    <!-- Charts -->
    <section class="dashboard-charts">
      <el-card shadow="never" class="dashboard-chart-card">
        <template #header>
          <span>用户增长趋势（近7日）</span>
        </template>
        <v-chart
          v-if="userGrowthOption"
          :option="userGrowthOption"
          style="height: 300px"
          autoresize
        />
        <el-empty v-else description="暂无数据" />
      </el-card>

      <el-card shadow="never" class="dashboard-chart-card">
        <template #header>
          <span>订单趋势（近7日）</span>
        </template>
        <v-chart
          v-if="orderTrendOption"
          :option="orderTrendOption"
          style="height: 300px"
          autoresize
        />
        <el-empty v-else description="暂无数据" />
      </el-card>
    </section>

    <!-- Revenue Summary -->
    <section class="dashboard-section">
      <el-card shadow="never">
        <template #header>
          <span>营收概览</span>
        </template>
        <div class="revenue-grid">
          <div class="revenue-item">
            <span class="revenue-item__label">总营收</span>
            <span class="revenue-item__value">¥{{ dashboard.revenue.totalYuan }}</span>
          </div>
          <div class="revenue-item">
            <span class="revenue-item__label">本月营收</span>
            <span class="revenue-item__value">¥{{ dashboard.revenue.thisMonthYuan }}</span>
          </div>
          <div class="revenue-item">
            <span class="revenue-item__label">已支付订单</span>
            <span class="revenue-item__value">{{ dashboard.revenue.paidOrderCount }}</span>
          </div>
          <div class="revenue-item">
            <span class="revenue-item__label">转化率</span>
            <span class="revenue-item__value">
              {{ dashboard.totals.orders > 0
                ? ((dashboard.revenue.paidOrderCount / dashboard.totals.orders) * 100).toFixed(1)
                : '0' }}%
            </span>
          </div>
        </div>
      </el-card>
    </section>

    <!-- Recent Orders -->
    <section class="dashboard-section">
      <el-card shadow="never">
        <template #header>
          <span>最近订单</span>
        </template>
        <el-table :data="dashboard.recentOrders" stripe v-loading="loading" empty-text="暂无订单">
          <el-table-column prop="orderNo" label="订单号" min-width="220" />
          <el-table-column prop="amountYuan" label="金额" width="120">
            <template #default="{ row }">¥{{ row.amountYuan }}</template>
          </el-table-column>
          <el-table-column prop="createdAt" label="时间" min-width="180">
            <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
          </el-table-column>
        </el-table>
      </el-card>
    </section>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed, onMounted } from 'vue';
import VChart from 'vue-echarts';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { LineChart, BarChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
} from 'echarts/components';
import { useDashboardStore } from '../stores/dashboard';

use([CanvasRenderer, LineChart, BarChart, TitleComponent, TooltipComponent, GridComponent, LegendComponent]);

const dashboardStore = useDashboardStore();
const { dashboard, loading } = storeToRefs(dashboardStore);

onMounted(() => {
  dashboardStore.load();
});

function reload() {
  dashboardStore.load();
}

const userGrowthOption = computed(() => {
  const data = dashboard.value.charts.userGrowth;
  if (!data.length) return null;
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: data.map((d) => d.date) },
    yAxis: { type: 'value', minInterval: 1 },
    series: [
      {
        name: '新增用户',
        type: 'line',
        data: data.map((d) => d.count),
        smooth: true,
        areaStyle: { opacity: 0.15 },
      },
    ],
  };
});

const orderTrendOption = computed(() => {
  const data = dashboard.value.charts.orderTrend;
  if (!data.length) return null;
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: data.map((d) => d.date) },
    yAxis: { type: 'value', minInterval: 1 },
    series: [
      {
        name: '订单',
        type: 'bar',
        data: data.map((d) => d.count),
        itemStyle: { borderRadius: [4, 4, 0, 0] },
      },
    ],
  };
});

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}
</script>

<style scoped lang="scss">
.dashboard-page {
  padding: 24px;
  max-width: 1400px;
}

.dashboard-hero {
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
  &__actions {
    display: flex;
    gap: 12px;
  }
}

.dashboard-kpis {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.dashboard-kpi {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  padding: 20px 24px;
  &__label {
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }
  &__value {
    font-size: 36px;
    font-weight: 700;
    margin: 8px 0;
    color: var(--el-text-color-primary);
  }
  &__sub {
    font-size: 12px;
    color: var(--el-text-color-placeholder);
  }
}

.dashboard-charts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
}

.dashboard-chart-card {
  :deep(.el-card__body) {
    padding: 16px;
  }
}

.dashboard-section {
  margin-bottom: 24px;
}

.revenue-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

.revenue-item {
  text-align: center;
  &__label {
    display: block;
    font-size: 13px;
    color: var(--el-text-color-secondary);
    margin-bottom: 8px;
  }
  &__value {
    font-size: 24px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
}
</style>
