import { Body, Controller, Get, Headers, Param, Post, Req, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from '../auth/auth.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderPayCallbackDto } from './dto/order-pay-callback.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly authService: AuthService,
    private readonly ordersService: OrdersService,
  ) {}

  @Post('create')
  async createOrder(
    @Body() dto: CreateOrderDto,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.authService.requireUserFromAuthorization(authorization);
    return this.ordersService.createOrder(user, dto);
  }

  @Post(':orderNo/pay-callback')
  handlePayCallback(
    @Param('orderNo') orderNo: string,
    @Body() dto: OrderPayCallbackDto,
  ) {
    return this.ordersService.handlePayCallback(orderNo, dto);
  }

  @Post('wechat/notify')
  handleWechatNotify(
    @Req() request: { rawBody?: Buffer; body?: unknown; headers: Record<string, string | string[] | undefined> },
    @Res() response: Response,
  ) {
    const rawBody = this.readRawBody(request);
    return this.ordersService
      .handleWechatNotification(rawBody, request.headers)
      .then((payload) => response.status(200).json(payload));
  }

  @Get(':orderNo')
  async getOrder(
    @Param('orderNo') orderNo: string,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.authService.requireUserFromAuthorization(authorization);
    return this.ordersService.confirmOrder(user, orderNo);
  }

  private readRawBody(request: { rawBody?: Buffer; body?: unknown }) {
    if (request.rawBody?.length) {
      return request.rawBody.toString('utf8');
    }

    if (typeof request.body === 'string') {
      return request.body;
    }

    return JSON.stringify(request.body ?? {});
  }
}
