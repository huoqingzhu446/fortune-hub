import { Body, Controller, Get, Param, Put, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import type { AdminProfile } from '../admin-auth/admin-auth.service';
import { AdminSessionGuard } from '../admin-auth/admin-session.guard';
import { UpdateFeedbackStatusDto } from './dto/update-feedback-status.dto';
import { SettingsService } from './settings.service';

@Controller('admin/feedback')
@UseGuards(AdminSessionGuard)
export class AdminFeedbackController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  listFeedback(
    @Query('status') status?: string,
    @Query('keyword') keyword?: string,
    @Query('category') category?: string,
    @Query('priority') priority?: string,
    @Query('slaStatus') slaStatus?: string,
    @Query('limit') limit?: string,
  ) {
    return this.settingsService.listFeedback({
      status,
      keyword,
      category,
      priority,
      slaStatus,
      limit: Number(limit) || undefined,
    });
  }

  @Get(':id')
  getDetail(@Param('id') id: string) {
    return this.settingsService.getFeedbackDetail(id);
  }

  @Put(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateFeedbackStatusDto,
    @Req() request: Request & { admin?: AdminProfile },
  ) {
    return this.settingsService.updateFeedbackStatus(id, {
      ...dto,
      actorId: request.admin?.username ?? null,
    });
  }
}
