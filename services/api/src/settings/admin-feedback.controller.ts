import { Body, Controller, Get, Param, Put, Query, UseGuards } from '@nestjs/common';
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
    @Query('limit') limit?: string,
  ) {
    return this.settingsService.listFeedback({
      status,
      keyword,
      category,
      limit: Number(limit) || undefined,
    });
  }

  @Put(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateFeedbackStatusDto,
  ) {
    return this.settingsService.updateFeedbackStatus(id, dto);
  }
}
