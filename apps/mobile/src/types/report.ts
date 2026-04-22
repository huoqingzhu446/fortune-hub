import type { ApiEnvelope } from './auth';
import type { MembershipProduct } from './membership';

export interface SharePosterMeta {
  themeName: string;
  title: string;
  subtitle: string;
  accentText: string;
  footerText: string;
}

export interface ReportSection {
  title: string;
  summary: string;
  bullets: string[];
}

export interface LockedPreviewSection {
  title: string;
  summary: string;
}

export interface UnifiedReport {
  recordId: string;
  recordType: string;
  sourceCode: string | null;
  title: string;
  subtitle: string;
  summary: string;
  score: number | null;
  level: string | null;
  completedAt: string;
  sharePoster: SharePosterMeta;
  baseSections: ReportSection[];
  fullSections: ReportSection[];
  lockedPreviewSections: LockedPreviewSection[];
  access: {
    isFullReportUnlocked: boolean;
    persistedUnlocked: boolean;
    unlockType: string | null;
    hasVipAccess: boolean;
    canUnlockByAd: boolean;
    requiresLogin: boolean;
  };
  offers: {
    adSlotCode: string | null;
    adTitle: string | null;
    vipProducts: MembershipProduct[];
  };
}

export type ReportResponse = ApiEnvelope<{
  report: UnifiedReport;
}>;
