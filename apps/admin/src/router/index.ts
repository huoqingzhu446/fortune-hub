import { createRouter, createWebHistory } from 'vue-router';
import { getAdminToken } from '../services/admin-session';

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
    },
    {
      path: '/',
      component: () => import('../layouts/AdminLayout.vue'),
      children: [
        {
          path: '',
          name: 'dashboard',
          component: () => import('../views/DashboardView.vue'),
        },
        {
          path: 'question-bank',
          name: 'question-bank',
          component: () => import('../views/QuestionBankView.vue'),
        },
        {
          path: 'content-center',
          name: 'content-center',
          component: () => import('../views/ContentCenterView.vue'),
        },
        {
          path: 'commerce-center',
          name: 'commerce-center',
          component: () => import('../views/CommerceCenterView.vue'),
        },
      ],
    },
  ],
});

router.beforeEach((to) => {
  const token = getAdminToken();

  if (to.path === '/login') {
    if (token) {
      return '/';
    }
    return true;
  }

  if (!token) {
    return '/login';
  }

  return true;
});
