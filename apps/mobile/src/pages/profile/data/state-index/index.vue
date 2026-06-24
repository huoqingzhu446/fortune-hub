<template>
  <ProfileMetricDetailPage metric-key="state_index" />
</template>

<script setup lang="ts">
import ProfileMetricDetailPage from '../../../../components/ProfileMetricDetailPage.vue';
import { useWechatShare } from '../../../../composables/useWechatShare';

useWechatShare({
  title: '状态指数详情',
  path: '/pages/profile/data/state-index/index',
});
</script>
