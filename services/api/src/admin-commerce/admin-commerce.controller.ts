import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { AdminSessionGuard } from '../admin-auth/admin-session.guard';
import { SaveMembershipProductDto } from './dto/save-membership-product.dto';
import { AdminCommerceService } from './admin-commerce.service';

@Controller('admin')
@UseGuards(AdminSessionGuard)
export class AdminCommerceController {
  constructor(private readonly adminCommerceService: AdminCommerceService) {}

  @Get('membership-products')
  getMembershipProducts() {
    return this.adminCommerceService.getMembershipProducts();
  }

  @Post('membership-products')
  createMembershipProduct(@Body() dto: SaveMembershipProductDto) {
    return this.adminCommerceService.createMembershipProduct(dto);
  }

  @Put('membership-products/:code')
  updateMembershipProduct(
    @Param('code') code: string,
    @Body() dto: SaveMembershipProductDto,
  ) {
    return this.adminCommerceService.updateMembershipProduct(code, dto);
  }

  @Delete('membership-products/:code')
  deleteMembershipProduct(@Param('code') code: string) {
    return this.adminCommerceService.deleteMembershipProduct(code);
  }

  @Post('membership-products/:code/status')
  updateMembershipProductStatus(
    @Param('code') code: string,
    @Body('status') status: string,
  ) {
    return this.adminCommerceService.updateMembershipProductStatus(code, status);
  }

  @Get('orders')
  getOrders(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('status') status?: string,
  ) {
    return this.adminCommerceService.getOrders({
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 20,
      status: status || undefined,
    });
  }

  @Get('orders/stats')
  getOrderStats() {
    return this.adminCommerceService.getOrderStats();
  }
}
