export interface AdminMenuItem {
  path: string;
  label: string;
  meta: string;
  permission: string;
}

export const ADMIN_MENU_ITEMS: AdminMenuItem[] = [
  {
    path: '/',
    label: '总览',
    meta: 'Dashboard',
    permission: 'dashboard:view',
  },
  {
    path: '/question-bank',
    label: '题库管理',
    meta: 'Question Bank',
    permission: 'question-bank:manage',
  },
  {
    path: '/content-center',
    label: '内容中心',
    meta: 'Content Center',
    permission: 'content:manage',
  },
  {
    path: '/commerce-center',
    label: '商业化',
    meta: 'Growth & Commerce',
    permission: 'commerce:manage',
  },
  {
    path: '/operations',
    label: '运营中心',
    meta: 'Operations',
    permission: 'operations:view',
  },
] as const;
