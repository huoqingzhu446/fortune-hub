import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminSessionGuard } from '../admin-auth/admin-session.guard';
import { FortuneService } from './fortune.service';

@Controller('dashboard')
export class FortuneController {
  constructor(private readonly fortuneService: FortuneService) {}

  @Get('mobile')
  getMobileDashboard() {
    return this.fortuneService.getMobileDashboard();
  }

  @Get('admin')
  @UseGuards(AdminSessionGuard)
  getAdminDashboard() {
    return this.fortuneService.getAdminDashboard();
  }
}
