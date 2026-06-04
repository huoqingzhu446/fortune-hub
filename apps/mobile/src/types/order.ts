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
  paymentChannel: string | null;
  paymentProvider: string | null;
  paymentStatus: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface WechatPaymentParams {
  appId: string;
  timeStamp: string;
  nonceStr: string;
  packageValue: string;
  signType: 'RSA';
  paySign: string;
  prepayId: string;
}

export interface CreateOrderData {
  order: MembershipOrder;
  payHint: string;
  payMode: string;
  paymentParams: WechatPaymentParams | null;
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
