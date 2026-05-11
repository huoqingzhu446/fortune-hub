export interface DashboardHeadline {
  title: string;
  subtitle: string;
}

export interface DashboardLuckyMetric {
  label: string;
  value: string;
  hint: string;
}

export interface DashboardStateFactor {
  id: string;
  label: string;
  value: string;
  hint: string;
  tone: 'positive' | 'steady' | 'watch';
}

export interface DashboardStateOverview {
  title: string;
  summary: string;
  primarySuggestion: string;
  confidenceLabel: string;
  evidenceLabel: string;
  disclaimer: string;
  basisTags: string[];
  factors: DashboardStateFactor[];
}

export interface DashboardLuckySign {
  bizCode?: string;
  title: string;
  summary: string;
  tag: string;
  themeName?: string;
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

export interface DashboardQuickEntry {
  id: string;
  title: string;
  description: string;
  route: string;
  badge: string;
  icon?: DashboardHomeLayoutQuickTool['icon'];
  enabled?: boolean;
}

export interface DashboardJourneyEntry {
  id: string;
  title: string;
  description: string;
  completed: boolean;
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
  isLoggedIn: boolean;
  nickname: string | null;
  profileCompleted: boolean;
  vipStatus: string;
  primaryActionTitle: string;
  primaryActionRoute: string;
  secondaryActionTitle: string;
  secondaryActionRoute: string;
  welcomeNote: string;
}

export interface DashboardTodayAction {
  actionCode: string;
  badge: string;
  title: string;
  summary: string;
  primaryText: string;
  primaryRoute: string;
  secondaryText: string;
  secondaryRoute: string;
}

export interface DashboardHomeLayoutSection {
  id:
    | 'hero'
    | 'today_state'
    | 'today_action'
    | 'state_insights'
    | 'fortune_actions'
    | 'quick_tools';
  type: string;
  title: string;
  note: string;
  audience?: string[];
  enabled: boolean;
  order: number;
  maxItems?: number;
}

export interface DashboardHomeLayoutQuickTool {
  id: string;
  title: string;
  description: string;
  route: string;
  badge: string;
  icon: 'leaf' | 'journal' | 'orbit' | 'compass' | 'poster';
  enabled: boolean;
  order: number;
}

export interface DashboardHomeLayout {
  version: number;
  grayPercent: number;
  sections: DashboardHomeLayoutSection[];
  quickTools: DashboardHomeLayoutQuickTool[];
}

export interface MobileDashboardPayload {
  dailyThemeKey?: string;
  headline: DashboardHeadline;
  todayLuckyScore: DashboardLuckyMetric;
  annualLuckyScore: DashboardLuckyMetric;
  todayLuckySign: DashboardLuckySign;
  todayFortuneSummary: string;
  stateOverview: DashboardStateOverview;
  featureEntries: DashboardModule[];
  quickEntries: DashboardQuickEntry[];
  journeyEntries: DashboardJourneyEntry[];
  bottomTabs: DashboardBottomTab[];
  stats: DashboardStat[];
  modules: DashboardModule[];
  integrations: DashboardIntegrations;
  userSummary: DashboardUserSummary;
  todayAction: DashboardTodayAction;
  homeLayout: DashboardHomeLayout;
}

export interface MobileDashboardResponse {
  code: number;
  message: string;
  data: MobileDashboardPayload;
  timestamp: string;
}
