import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'node:crypto';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { MembershipProductEntity } from '../database/entities/membership-product.entity';
import { MembershipService } from '../membership/membership.service';
import { OrderEntity } from '../database/entities/order.entity';
import { UserEntity } from '../database/entities/user.entity';
import { EntitlementsService } from '../entitlements/entitlements.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderPayCallbackDto } from './dto/order-pay-callback.dto';
import {
  WechatMiniProgramPaymentParams,
  WechatPayService,
  WechatPayTransaction,
} from './wechat-pay.service';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
    private readonly dataSource: DataSource,
    private readonly membershipService: MembershipService,
    private readonly entitlementsService: EntitlementsService,
    private readonly configService: ConfigService,
    private readonly wechatPayService: WechatPayService,
  ) {}

  async createOrder(user: UserEntity, dto: CreateOrderDto) {
    const paymentMode = this.resolvePaymentMode();
    if (paymentMode === 'disabled') {
      throw new BadRequestException('会员支付暂未开放，请稍后再试');
    }
    if (paymentMode === 'wechat' && !user.openid) {
      throw new BadRequestException('请先使用微信登录后再购买会员');
    }

    const product = await this.membershipService.getProductByCodeOrThrow(dto.productCode);
    const order = await this.orderRepository.save(
      this.orderRepository.create({
        userId: user.id,
        orderNo: this.generateOrderNo(),
        productCode: product.code,
        productTitle: product.title,
        amountFen: product.priceFen,
        orderType: 'membership',
        status: 'pending',
        paymentChannel: paymentMode === 'wechat' ? 'mini_program' : 'mock',
        paymentProvider: paymentMode === 'wechat' ? 'wechat_pay' : 'mock',
        paymentStatus: 'pending',
        extraJson: {
          durationDays: product.durationDays,
        },
      }),
    );

    let paymentParams: WechatMiniProgramPaymentParams | null = null;
    let payHint = '当前为开发环境模拟支付，仅用于本地联调。';

    if (paymentMode === 'wechat') {
      paymentParams = await this.wechatPayService.createMiniProgramPayment({
        orderNo: order.orderNo,
        description: product.title,
        amountFen: product.priceFen,
        openid: user.openid!,
        attach: product.code,
      });
      payHint = '请完成微信支付，支付结果将以服务端回调确认为准。';
    }

    return {
      code: 0,
      message: 'ok',
      data: {
        order: this.serializeOrder(order),
        payMode: paymentMode,
        payHint,
        paymentParams,
      },
      timestamp: new Date().toISOString(),
    };
  }

  async handlePayCallback(orderNo: string, dto: OrderPayCallbackDto) {
    if (this.resolvePaymentMode() !== 'mock') {
      throw new BadRequestException('当前环境不允许模拟支付回调');
    }

    const order = await this.orderRepository.findOne({
      where: { orderNo },
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    if (order.status === 'paid') {
      return {
        code: 0,
        message: 'ok',
        data: {
          order: this.serializeOrder(order),
          membership: null,
        },
        timestamp: new Date().toISOString(),
      };
    }

    const nextStatus = dto.status ?? 'paid';
    order.status = nextStatus;
    order.transactionNo = dto.transactionNo ?? order.transactionNo ?? `mock_${order.orderNo}`;
    order.paymentStatus = nextStatus;
    order.paidAt = nextStatus === 'paid' ? new Date() : null;

    const { order: savedOrder, membership } = await this.persistOrderResult(
      order,
      nextStatus === 'paid',
    );
    return {
      code: 0,
      message: 'ok',
      data: {
        order: this.serializeOrder(savedOrder),
        membership,
      },
      timestamp: new Date().toISOString(),
    };
  }

  async handleWechatNotification(
    rawBody: string,
    headers: Record<string, string | string[] | undefined>,
  ) {
    const transaction = this.wechatPayService.parseNotification(rawBody, headers);
    await this.applyWechatTransaction(transaction);

    return {
      code: 'SUCCESS',
      message: '成功',
    };
  }

  async confirmOrder(user: UserEntity, orderNo: string) {
    const order = await this.orderRepository.findOne({
      where: { orderNo, userId: user.id },
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    if (order.status !== 'paid' && this.resolvePaymentMode() === 'wechat') {
      const transaction = await this.wechatPayService.queryTransactionByOrderNo(orderNo);
      await this.applyWechatTransaction(transaction);
    }

    const refreshedOrder = await this.orderRepository.findOne({
      where: { orderNo, userId: user.id },
    });

    if (!refreshedOrder) {
      throw new NotFoundException('订单不存在');
    }

    const membershipUser =
      refreshedOrder.status === 'paid'
        ? await this.findUserByOrder(refreshedOrder)
        : null;

    return {
      code: 0,
      message: 'ok',
      data: {
        order: this.serializeOrder(refreshedOrder),
        membership: membershipUser
          ? {
              vipStatus: membershipUser.vipStatus,
              vipExpiredAt: membershipUser.vipExpiredAt?.toISOString() ?? null,
            }
          : null,
      },
      timestamp: new Date().toISOString(),
    };
  }

  private async applyWechatTransaction(transaction: WechatPayTransaction) {
    const order = await this.orderRepository.findOne({
      where: { orderNo: transaction.orderNo },
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    if (transaction.payerOpenid) {
      const user = await this.findUserByOrder(order);
      if (user.openid && user.openid !== transaction.payerOpenid) {
        throw new BadGatewayException('微信支付用户与订单归属不一致');
      }
    }

    if (
      transaction.amountFen !== null &&
      Number.isFinite(transaction.amountFen) &&
      transaction.amountFen !== order.amountFen
    ) {
      throw new BadGatewayException('微信支付金额与订单金额不一致');
    }

    order.paymentChannel = 'mini_program';
    order.paymentProvider = 'wechat_pay';
    order.transactionNo = transaction.transactionNo ?? order.transactionNo;
    order.paymentNotifyId = transaction.notifyId ?? order.paymentNotifyId;
    order.paymentStatus = this.mapWechatTradeState(transaction.tradeState);

    if (this.isPaidTradeState(transaction.tradeState)) {
      order.status = 'paid';
      order.paidAt = transaction.successTime ?? order.paidAt ?? new Date();
    } else if (this.isFailedTradeState(transaction.tradeState)) {
      order.status = 'failed';
      order.paidAt = null;
    } else {
      order.status = 'pending';
    }

    await this.persistOrderResult(order, order.status === 'paid');
    return order;
  }

  private async persistOrderResult(order: OrderEntity, shouldGrantMembership: boolean) {
    return this.dataSource.transaction(async (manager) => {
      const orderRepository = manager.getRepository(OrderEntity);
      const lockedOrder = await orderRepository.findOne({
        where: { orderNo: order.orderNo },
        lock: { mode: 'pessimistic_write' },
      });

      if (!lockedOrder) {
        throw new NotFoundException('订单不存在');
      }

      lockedOrder.status = order.status;
      lockedOrder.transactionNo = order.transactionNo;
      lockedOrder.paymentChannel = order.paymentChannel;
      lockedOrder.paymentProvider = order.paymentProvider;
      lockedOrder.paymentStatus = order.paymentStatus;
      lockedOrder.paymentNotifyId = order.paymentNotifyId;
      lockedOrder.paidAt = order.paidAt;
      lockedOrder.extraJson = order.extraJson;

      let savedOrder = await orderRepository.save(lockedOrder);
      let membership = null;

      if (shouldGrantMembership && savedOrder.status === 'paid') {
        const extra = savedOrder.extraJson ?? {};
        const isMembershipGranted = Boolean(extra.membershipGrantedAt);

        if (!isMembershipGranted) {
          const product = await this.findPublishedProduct(manager, savedOrder.productCode);
          const user = await this.grantMembershipWithManager(
            manager,
            savedOrder.userId,
            product,
          );
          savedOrder.extraJson = {
            ...extra,
            membershipGrantedAt: new Date().toISOString(),
          };
          savedOrder = await orderRepository.save(savedOrder);
          membership = {
            vipStatus: user.vipStatus,
            vipExpiredAt: user.vipExpiredAt?.toISOString() ?? null,
          };
        } else {
          const user = await manager.getRepository(UserEntity).findOne({
            where: { id: savedOrder.userId },
          });
          membership = user
            ? {
                vipStatus: user.vipStatus,
                vipExpiredAt: user.vipExpiredAt?.toISOString() ?? null,
              }
            : null;
        }
      }

      return {
        order: savedOrder,
        membership,
      };
    });
  }

  private async findUserByOrder(order: OrderEntity) {
    const user = await this.entitlementsService.findUserById(order.userId);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return user;
  }

  private async findPublishedProduct(manager: EntityManager, productCode: string) {
    const product = await manager.getRepository(MembershipProductEntity).findOne({
      where: {
        code: productCode,
        status: 'published',
      },
    });

    if (!product) {
      throw new NotFoundException('会员商品不存在');
    }

    return product;
  }

  private async grantMembershipWithManager(
    manager: EntityManager,
    userId: string,
    product: Pick<MembershipProductEntity, 'durationDays'>,
  ) {
    const userRepository = manager.getRepository(UserEntity);
    const user = await userRepository.findOne({
      where: { id: userId },
      lock: { mode: 'pessimistic_write' },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const now = Date.now();
    const baseTime =
      user.vipExpiredAt && user.vipExpiredAt.getTime() > now
        ? user.vipExpiredAt.getTime()
        : now;
    user.vipStatus = 'active';
    user.vipExpiredAt = new Date(
      baseTime + product.durationDays * 24 * 60 * 60 * 1000,
    );

    return userRepository.save(user);
  }

  private serializeOrder(order: OrderEntity) {
    return {
      orderNo: order.orderNo,
      productCode: order.productCode,
      productTitle: order.productTitle,
      amountFen: order.amountFen,
      amountLabel: `¥${(order.amountFen / 100).toFixed(2)}`,
      orderType: order.orderType,
      status: order.status,
      transactionNo: order.transactionNo,
      paymentChannel: order.paymentChannel,
      paymentProvider: order.paymentProvider,
      paymentStatus: order.paymentStatus,
      paidAt: order.paidAt?.toISOString() ?? null,
      createdAt: order.createdAt.toISOString(),
    };
  }

  private generateOrderNo() {
    return `FH${Date.now()}${randomBytes(4).toString('hex')}`.toUpperCase();
  }

  private resolvePaymentMode() {
    const configuredMode = this.configService
      .get<string>(
        'PAYMENT_MODE',
        this.configService.get<string>('NODE_ENV') === 'production' ? 'disabled' : 'mock',
      )
      .trim()
      .toLowerCase();
    const mockEnabled =
      this.configService.get<string>('PAYMENT_MOCK_ENABLED', 'false') === 'true';
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';

    if (!isProduction && (configuredMode === 'mock' || mockEnabled)) {
      return 'mock';
    }

    if (configuredMode === 'wechat') {
      return 'wechat';
    }

    return 'disabled';
  }

  private isPaidTradeState(tradeState: string) {
    return tradeState === 'SUCCESS';
  }

  private isFailedTradeState(tradeState: string) {
    return ['CLOSED', 'REVOKED', 'PAYERROR'].includes(tradeState);
  }

  private mapWechatTradeState(tradeState: string) {
    if (this.isPaidTradeState(tradeState)) {
      return 'paid';
    }

    if (this.isFailedTradeState(tradeState)) {
      return 'failed';
    }

    if (tradeState === 'NOTPAY' || tradeState === 'USERPAYING') {
      return 'pending';
    }

    this.logger.warn(`Unhandled WeChat trade state: ${tradeState}`);
    return 'pending';
  }
}
