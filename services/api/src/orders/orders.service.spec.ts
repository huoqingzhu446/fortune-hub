import { OrdersService } from './orders.service';

describe('OrdersService', () => {
  it('creates a membership order and activates membership on callback', async () => {
    const orderRepo = {
      create: jest.fn((input) => input),
      save: jest.fn(async (input) => ({
        id: '1',
        createdAt: new Date('2026-04-25T00:00:00Z'),
        ...input,
      })),
      findOne: jest.fn(),
    };
    const membershipService = {
      getProductByCodeOrThrow: jest.fn(async () => ({
        code: 'vip-month',
        title: '月度会员',
        priceFen: 3900,
        durationDays: 30,
      })),
      activateMembership: jest.fn(async () => ({
        vipStatus: 'active',
        vipExpiredAt: new Date('2026-05-25T00:00:00Z'),
      })),
    };
    const service = new OrdersService(orderRepo as never, membershipService as never);
    const user = { id: 'u1' };

    const createResponse = await service.createOrder(user as never, {
      productCode: 'vip-month',
    });
    const order = createResponse.data.order;
    orderRepo.findOne.mockResolvedValue({
      ...order,
      id: '1',
      userId: 'u1',
      extraJson: { durationDays: 30 },
      createdAt: new Date(order.createdAt),
      status: 'pending',
    });

    const callbackResponse = await service.handlePayCallback(order.orderNo, {
      status: 'paid',
      transactionNo: 'wx_tx_1',
    });

    expect(callbackResponse.data.order.status).toBe('paid');
    expect(callbackResponse.data.membership?.vipStatus).toBe('active');
    expect(membershipService.activateMembership).toHaveBeenCalledWith('u1', expect.any(Object));
  });
});
