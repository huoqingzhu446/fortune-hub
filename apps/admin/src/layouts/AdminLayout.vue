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
        <div class="admin-topbar__actions">
          <div class="admin-topbar__meta">
            {{ adminSessionStore.admin?.displayName || '管理员' }}
          </div>
          <el-button plain @click="logout">退出登录</el-button>
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
import { useRouter } from 'vue-router';
import { onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { useAdminSessionStore } from '../stores/admin-session';

const route = useRoute();
const router = useRouter();
const adminSessionStore = useAdminSessionStore();

const navItems = computed(() =>
  adminSessionStore.menus.length
    ? adminSessionStore.menus.map((item) => ({
        to: item.path,
        label: item.label,
        meta: item.meta,
      }))
    : [
        {
          to: '/',
          label: '总览',
          meta: 'Dashboard',
        },
      ],
);

const currentPage = computed(() => {
  if (route.path === '/question-bank') {
    return {
      title: '题库管理',
      subtitle: '第一版支持浏览、编辑并保存性格测评与情绪自检题目。',
    };
  }

  if (route.path === '/content-center') {
    return {
      title: '内容中心',
      subtitle: '幸运签、幸运物和部分星座内容已经可以通过后台 JSON 配置维护。',
    };
  }

  if (route.path === '/commerce-center') {
    return {
      title: '商业化配置',
      subtitle: '管理会员商品、激励广告位和完整版解锁的基础配置。',
    };
  }

  return {
    title: '控制台总览',
    subtitle: '先看整体运行状态，再继续推进题库、内容和结果模板运营化。',
  };
});

async function logout() {
  adminSessionStore.logout();
  ElMessage.success('已退出登录');
  await router.replace('/login');
}

onMounted(() => {
  adminSessionStore.hydrate();
  if (!adminSessionStore.loaded && adminSessionStore.token) {
    void adminSessionStore.loadBootstrap().catch((error) => {
      console.warn('load admin bootstrap failed', error);
    });
  }
});
</script>
