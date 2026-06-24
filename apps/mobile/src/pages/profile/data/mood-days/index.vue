<template>
  <ProfileMetricDetailPage metric-key="mood_days" />
</template>

<script setup lang="ts">
import ProfileMetricDetailPage from '../../../../components/ProfileMetricDetailPage.vue';
import { useWechatShare } from '../../../../composables/useWechatShare';

useWechatShare({
  title: '情绪记录天数',
  path: '/pages/profile/data/mood-days/index',
});
</script>
