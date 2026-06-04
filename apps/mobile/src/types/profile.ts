import type { ApiEnvelope, UserProfile } from './auth';
import type { UnifiedRecordItem } from './records';

export interface ProfilePageData {
  isLoggedIn: boolean;
  user: UserProfile | null;
  isProfileCompleted: boolean;
  hero: {
    displayName: string;
    vipLabel: string;
    signature: string;
    sessionHint: string;
  };
  dataCards: Array<{
    key: 'state_index' | 'mood_days' | 'explore_reports' | 'focus_energy';
    title: string;
    value: string;
    meta: string;
    tone: 'mist' | 'blush' | 'mint' | 'gold';
    route: string;
  }>;
  tools: Array<{
    title: string;
    description: string;
    icon: string;
    route: string;
  }>;
  services: Array<{
    title: string;
    description: string;
    icon: string;
    route: string;
  }>;
  recentHistory: UnifiedRecordItem[];
}

export type ProfilePageResponse = ApiEnvelope<ProfilePageData>;
