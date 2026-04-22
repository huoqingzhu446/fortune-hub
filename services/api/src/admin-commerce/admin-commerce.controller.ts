import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { AdminSessionGuard } from '../admin-auth/admin-session.guard';
import { SaveAdConfigDto } from './dto/save-ad-config.dto';
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

  @Get('ad-configs')
  getAdConfigs() {
    return this.adminCommerceService.getAdConfigs();
  }

  @Put('ad-configs/:id')
  updateAdConfig(@Param('id') id: string, @Body() dto: SaveAdConfigDto) {
    return this.adminCommerceService.updateAdConfig(id, dto);
  }
}
