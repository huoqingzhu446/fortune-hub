import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
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

}
