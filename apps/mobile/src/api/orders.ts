import { http } from '../services/request';
import type { CreateOrderResponse, PayOrderResponse } from '../types/order';

export function createMembershipOrder(productCode: string) {
  return http.post<CreateOrderResponse, { productCode: string }>('/orders/create', {
    productCode,
  });
}

export function simulateMembershipPay(orderNo: string) {
  return http.post<PayOrderResponse, { status: 'paid' }>(
    `/orders/${orderNo}/pay-callback`,
    {
      status: 'paid',
    },
  );
}
