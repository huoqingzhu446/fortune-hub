import { MembershipProductEntity } from '../database/entities/membership-product.entity';
import { OrderEntity } from '../database/entities/order.entity';
import { UserEntity } from '../database/entities/user.entity';
import { OrdersService } from './orders.service';

describe('OrdersService', () => {
  it('creates a membership order and activates membership on callback', async () => {
    let currentOrder: Record<string, unknown> | null = null;
    const orderRepo = {
      create: jest.fn((input) => input),
      save: jest.fn(async (input) => {
        currentOrder = {
          id: '1',
          createdAt: new Date('2026-04-25T00:00:00Z'),
          ...input,
        };
        return currentOrder;
      }),
      findOne: jest.fn(async () => currentOrder),
    };
    const userRepo = {
      findOne: jest.fn(async () => ({
        id: 'u1',
        openid: 'openid_123',
        vipStatus: 'inactive',
        vipExpiredAt: null,
      })),
      save: jest.fn(async (input) => ({
        ...input,
        vipStatus: 'active',
        vipExpiredAt: new Date('2026-05-25T00:00:00Z'),
      })),
    };
    const productRepo = {
      findOne: jest.fn(async () => ({
        code: 'vip-month',
        title: '月度会员',
        priceFen: 3900,
        durationDays: 30,
        status: 'published',
      })),
    };
    const membershipService = {
      getProductByCodeOrThrow: jest.fn(async () => ({
        code: 'vip-month',
        title: '月度会员',
        priceFen: 3900,
        durationDays: 30,
      })),
    };
    const entitlementsService = {};
    const configService = {
      get: jest.fn((key: string, fallback?: string) =>
        key === 'NODE_ENV' ? 'development' : fallback,
      ),
    };
    const dataSource = {
      transaction: jest.fn(
        async (handler: (manager: { getRepository: (entity: unknown) => unknown }) => unknown) =>
        handler({
          getRepository: (entity: unknown) => {
            if (entity === OrderEntity) {
              return orderRepo;
            }
            if (entity === MembershipProductEntity) {
              return productRepo;
            }
            if (entity === UserEntity) {
              return userRepo;
            }

            throw new Error(`Unexpected repository: ${String(entity)}`);
          },
        }),
      ),
    };
    const wechatPayService = {};
    const service = new OrdersService(
      orderRepo as never,
      dataSource as never,
      membershipService as never,
      entitlementsService as never,
      configService as never,
      wechatPayService as never,
    );
    const user = { id: 'u1' };

    const createResponse = await service.createOrder(user as never, {
      productCode: 'vip-month',
    });
    const order = createResponse.data.order;

    const callbackResponse = await service.handlePayCallback(order.orderNo, {
      status: 'paid',
      transactionNo: 'wx_tx_1',
    });

    expect(callbackResponse.data.order.status).toBe('paid');
    expect(callbackResponse.data.membership?.vipStatus).toBe('active');
    expect(userRepo.save).toHaveBeenCalled();
  });
});
