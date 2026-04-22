import { http } from './http';

export interface AdminProfile {
  username: string;
  displayName: string;
  roleCode: string;
  permissions: string[];
}

export interface AdminMenuItem {
  path: string;
  label: string;
  meta: string;
  permission: string;
}

interface AdminLoginResponse {
  code: number;
  message: string;
  data: {
    token: string;
    expiresIn: number;
    admin: AdminProfile;
  };
  timestamp: string;
}

interface AdminMeResponse {
  code: number;
  message: string;
  data: {
    admin: AdminProfile;
  };
  timestamp: string;
}

interface AdminMenusResponse {
  code: number;
  message: string;
  data: {
    menus: AdminMenuItem[];
  };
  timestamp: string;
}

export async function loginAdmin(username: string, password: string) {
  const { data } = await http.post<AdminLoginResponse>('/admin/auth/login', {
    username,
    password,
  });
  return data;
}

export async function fetchAdminMe() {
  const { data } = await http.get<AdminMeResponse>('/admin/me');
  return data;
}

export async function fetchAdminMenus() {
  const { data } = await http.get<AdminMenusResponse>('/admin/menus');
  return data;
}
