<template>
  <div class="admin-shell">
    <aside class="admin-sidebar">
      <div class="admin-sidebar__brand">
        <div class="admin-sidebar__eyebrow">fortune-hub</div>
        <div class="admin-sidebar__title">运营控制台</div>
        <div class="admin-sidebar__caption">Question bank / content / flow</div>
      </div>

      <nav class="admin-nav">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="admin-nav__item"
          :class="{ 'admin-nav__item--active': route.path === item.to }"
        >
          <span class="admin-nav__label">{{ item.label }}</span>
          <span class="admin-nav__meta">{{ item.meta }}</span>
        </RouterLink>
      </nav>
    </aside>

    <main class="admin-main">
      <header class="admin-topbar">
        <div>
          <div class="admin-topbar__eyebrow">workspace</div>
          <h1 class="admin-topbar__title">{{ currentPage.title }}</h1>
          <p class="admin-topbar__text">{{ currentPage.subtitle }}</p>
        </div>
      </header>

      <section class="admin-content">
        <RouterView />
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink, RouterView, useRoute } from 'vue-router';

const route = useRoute();

const navItems = [
  {
    to: '/',
    label: '总览',
    meta: 'Dashboard',
  },
  {
    to: '/question-bank',
    label: '题库管理',
    meta: 'Question Bank',
  },
];

const currentPage = computed(() => {
  if (route.path === '/question-bank') {
    return {
      title: '题库管理',
      subtitle: '第一版支持浏览、编辑并保存性格测评与情绪自检题目。',
    };
  }

  return {
    title: '控制台总览',
    subtitle: '先看整体运行状态，再继续推进题库、内容和结果模板运营化。',
  };
});
</script>
