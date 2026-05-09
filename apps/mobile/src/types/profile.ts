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
  membershipCard: {
    title: string;
    summary: string;
    buttonText: string;
    route: string;
  };
  dataCards: Array<{
    key: 'fortune_index' | 'mood_days' | 'explore_reports' | 'lucky_energy';
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
