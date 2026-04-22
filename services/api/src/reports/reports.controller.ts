import { Controller, Get, Headers, Param } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(
    private readonly authService: AuthService,
    private readonly reportsService: ReportsService,
  ) {}

  @Get(':recordId')
  async getReport(
    @Param('recordId') recordId: string,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.authService.requireUserFromAuthorization(authorization);
    return this.reportsService.getReport(recordId, user);
  }
}
