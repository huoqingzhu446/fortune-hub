import type { ApiEnvelope } from './auth';

export interface MembershipOrder {
  orderNo: string;
  productCode: string;
  productTitle: string;
  amountFen: number;
  amountLabel: string;
  orderType: string;
  status: string;
  transactionNo: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface CreateOrderData {
  order: MembershipOrder;
  payHint: string;
}

export interface PayOrderData {
  order: MembershipOrder;
  membership: {
    vipStatus: string;
    vipExpiredAt: string | null;
  } | null;
}

export type CreateOrderResponse = ApiEnvelope<CreateOrderData>;
export type PayOrderResponse = ApiEnvelope<PayOrderData>;
