<template>
  <ProfileMetricDetailPage metric-key="explore_reports" />
</template>

<script setup lang="ts">
import ProfileMetricDetailPage from '../../../../components/ProfileMetricDetailPage.vue';
import { useWechatShare } from '../../../../composables/useWechatShare';

useWechatShare({
  title: '探索报告详情',
  path: '/pages/profile/data/explore-reports/index',
});
</script>
