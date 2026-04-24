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
    title: string;
    value: string;
    meta: string;
    tone: 'mist' | 'blush' | 'mint' | 'gold';
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
