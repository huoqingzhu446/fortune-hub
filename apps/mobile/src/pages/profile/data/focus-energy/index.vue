<template>
  <ProfileMetricDetailPage metric-key="focus_energy" />
</template>

<script setup lang="ts">
import ProfileMetricDetailPage from '../../../../components/ProfileMetricDetailPage.vue';
import { useWechatShare } from '../../../../composables/useWechatShare';

useWechatShare({
  title: '专注能量详情',
  path: '/pages/profile/data/focus-energy/index',
});
</script>
