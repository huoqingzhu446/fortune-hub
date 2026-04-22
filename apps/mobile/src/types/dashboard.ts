export interface DashboardHeadline {
  title: string;
  subtitle: string;
}

export interface DashboardLuckyMetric {
  label: string;
  value: string;
  hint: string;
}

export interface DashboardLuckySign {
  bizCode?: string;
  title: string;
  summary: string;
  tag: string;
}

export interface DashboardStat {
  label: string;
  value: string;
  hint: string;
}

export interface DashboardModule {
  id: string;
  title: string;
  description: string;
  route: string;
  badge: string;
}

export interface DashboardBottomTab {
  id: string;
  label: string;
  route: string;
  iconText: string;
  active: boolean;
}

export interface DashboardIntegrations {
  apiBaseUrl: string;
  fileServiceBaseUrl: string;
  redisStatus: string;
}

export interface DashboardUserSummary {
  profileCompleted: boolean;
  vipStatus: string;
}

export interface MobileDashboardPayload {
  headline: DashboardHeadline;
  todayLuckyScore: DashboardLuckyMetric;
  annualLuckyScore: DashboardLuckyMetric;
  todayLuckySign: DashboardLuckySign;
  todayFortuneSummary: string;
  featureEntries: DashboardModule[];
  bottomTabs: DashboardBottomTab[];
  stats: DashboardStat[];
  modules: DashboardModule[];
  integrations: DashboardIntegrations;
  userSummary: DashboardUserSummary;
}

export interface MobileDashboardResponse {
  code: number;
  message: string;
  data: MobileDashboardPayload;
  timestamp: string;
}
