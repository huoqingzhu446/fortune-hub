import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'node:crypto';
import { Repository } from 'typeorm';
import { MembershipService } from '../membership/membership.service';
import { OrderEntity } from '../database/entities/order.entity';
import { UserEntity } from '../database/entities/user.entity';
import { EntitlementsService } from '../entitlements/entitlements.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderPayCallbackDto } from './dto/order-pay-callback.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
    private readonly membershipService: MembershipService,
    private readonly entitlementsService: EntitlementsService,
    private readonly configService: ConfigService,
  ) {}

  async createOrder(user: UserEntity, dto: CreateOrderDto) {
    const paymentMode = this.resolvePaymentMode();
    if (paymentMode === 'disabled') {
      throw new BadRequestException('会员支付暂未开放，请稍后再试');
    }
    if (paymentMode === 'wechat') {
      throw new BadRequestException('微信支付尚未接入，请先完成正式支付配置');
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
        extraJson: {
          durationDays: product.durationDays,
        },
      }),
    );

    return {
      code: 0,
      message: 'ok',
      data: {
        order: this.serializeOrder(order),
        payMode: paymentMode,
        payHint: '当前为开发环境模拟支付，仅用于本地联调。',
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
        },
        timestamp: new Date().toISOString(),
      };
    }

    const nextStatus = dto.status ?? 'paid';
    order.status = nextStatus;
    order.transactionNo = dto.transactionNo ?? order.transactionNo ?? `mock_${order.orderNo}`;
    order.paidAt = nextStatus === 'paid' ? new Date() : null;

    const savedOrder = await this.orderRepository.save(order);

    let membership = null;

    if (savedOrder.status === 'paid') {
      const product = await this.membershipService.getProductByCodeOrThrow(
        savedOrder.productCode,
      );
      const user = await this.entitlementsService.grantMembershipFromProduct(
        savedOrder.userId,
        product,
      );
      membership = {
        vipStatus: user.vipStatus,
        vipExpiredAt: user.vipExpiredAt?.toISOString() ?? null,
      };
    }

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
}
