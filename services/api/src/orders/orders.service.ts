import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'node:crypto';
import { Repository } from 'typeorm';
import { MembershipService } from '../membership/membership.service';
import { OrderEntity } from '../database/entities/order.entity';
import { UserEntity } from '../database/entities/user.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderPayCallbackDto } from './dto/order-pay-callback.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
    private readonly membershipService: MembershipService,
  ) {}

  async createOrder(user: UserEntity, dto: CreateOrderDto) {
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
        payHint: '当前为开发期模拟支付，前端可调用支付回调接口完成状态流转。',
      },
      timestamp: new Date().toISOString(),
    };
  }

  async handlePayCallback(orderNo: string, dto: OrderPayCallbackDto) {
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
      const product = await this.membershipService.getProductByCodeOrThrow(savedOrder.productCode);
      const user = await this.membershipService.activateMembership(savedOrder.userId, product);
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
}
