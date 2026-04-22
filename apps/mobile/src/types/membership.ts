import type { ApiEnvelope } from './auth';

export interface MembershipProduct {
  code: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  priceFen: number;
  priceLabel: string;
  durationDays: number;
  benefits: string[];
}

export interface MembershipStatusData {
  vipStatus: string;
  vipExpiredAt: string | null;
  isVipActive: boolean;
  rights: string[];
  products: MembershipProduct[];
}

export type MembershipStatusResponse = ApiEnvelope<MembershipStatusData>;
