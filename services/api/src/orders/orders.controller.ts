import { Body, Controller, Headers, Param, Post } from '@nestjs/common';
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
}
