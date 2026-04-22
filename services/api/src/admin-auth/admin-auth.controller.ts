import { Body, Controller, Get, Headers, Post, UseGuards } from '@nestjs/common';
import { AdminLoginDto } from './dto/admin-login.dto';
import { AdminAuthService } from './admin-auth.service';
import { AdminSessionGuard } from './admin-session.guard';

@Controller('admin')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @Post('auth/login')
  login(@Body() dto: AdminLoginDto) {
    return this.adminAuthService.login(dto.username, dto.password);
  }

  @Get('me')
  @UseGuards(AdminSessionGuard)
  async getMe(@Headers('authorization') authorization?: string) {
    const admin = await this.adminAuthService.requireAdminFromAuthorization(authorization);

    return {
      code: 0,
      message: 'ok',
      data: {
        admin,
      },
      timestamp: new Date().toISOString(),
    };
  }

  @Get('menus')
  @UseGuards(AdminSessionGuard)
  async getMenus(@Headers('authorization') authorization?: string) {
    const admin = await this.adminAuthService.requireAdminFromAuthorization(authorization);

    return {
      code: 0,
      message: 'ok',
      data: {
        menus: this.adminAuthService.getMenus(admin),
      },
      timestamp: new Date().toISOString(),
    };
  }
}
