import { Controller, Get } from '@nestjs/common';
import { FortuneService } from './fortune.service';

@Controller('dashboard')
export class FortuneController {
  constructor(private readonly fortuneService: FortuneService) {}

  @Get('mobile')
  getMobileDashboard() {
    return this.fortuneService.getMobileDashboard();
  }

  @Get('admin')
  getAdminDashboard() {
    return this.fortuneService.getAdminDashboard();
  }
}
