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

export interface ReportStatusIndex {
  label: string;
  value: number;
  maxValue: number;
  levelLabel: string;
  rawLabel: string;
  formula: string;
  sourceLabel: string;
  updatedAt: string;
  notes: string[];
}

export interface ReportStateDimension {
  key: string;
  label: string;
  value: number;
  maxValue: number;
  percent: number;
  tone: 'positive' | 'steady' | 'watch';
  summary: string;
  evidence: string;
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
  statusIndex: ReportStatusIndex;
  stateDimensions: ReportStateDimension[];
  sharePoster: SharePosterMeta;
  baseSections: ReportSection[];
  fullSections: ReportSection[];
  lockedPreviewSections: LockedPreviewSection[];
  access: {
    isFullReportUnlocked: boolean;
    persistedUnlocked: boolean;
    unlockType: string | null;
    hasVipAccess: boolean;
    requiresLogin: boolean;
  };
  offers: {
    vipProducts: MembershipProduct[];
  };
}

export type ReportResponse = ApiEnvelope<{
  report: UnifiedReport;
}>;
