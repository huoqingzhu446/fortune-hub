import { defineStore } from 'pinia';
import {
  fetchAdminMe,
  fetchAdminMenus,
  loginAdmin,
  type AdminMenuItem,
  type AdminProfile,
} from '../api/admin-auth';
import {
  clearAdminToken,
  getAdminToken,
  setAdminToken,
} from '../services/admin-session';

export const useAdminSessionStore = defineStore('admin-session', {
  state: () => ({
    token: getAdminToken(),
    admin: null as AdminProfile | null,
    menus: [] as AdminMenuItem[],
    loading: false,
    loaded: false,
  }),
  actions: {
    hydrate() {
      this.token = getAdminToken();
    },
    async login(username: string, password: string) {
      this.loading = true;
      try {
        const response = await loginAdmin(username, password);
        this.token = response.data.token;
        this.admin = response.data.admin;
        setAdminToken(response.data.token);
        await this.loadBootstrap();
      } finally {
        this.loading = false;
      }
    },
    async loadBootstrap() {
      if (!this.token) {
        this.admin = null;
        this.menus = [];
        this.loaded = false;
        return;
      }

      const [meResponse, menuResponse] = await Promise.all([
        fetchAdminMe(),
        fetchAdminMenus(),
      ]);

      this.admin = meResponse.data.admin;
      this.menus = menuResponse.data.menus;
      this.loaded = true;
    },
    logout() {
      clearAdminToken();
      this.token = '';
      this.admin = null;
      this.menus = [];
      this.loaded = false;
    },
  },
});
