import { Body, Controller, Get, Headers, Post } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { SubmitFeedbackDto } from './dto/submit-feedback.dto';
import { SettingsService } from './settings.service';

@Controller()
export class SettingsController {
  constructor(
    private readonly authService: AuthService,
    private readonly settingsService: SettingsService,
  ) {}

  @Get('settings')
  async getSettings(@Headers('authorization') authorization?: string) {
    const user = await this.authService.resolveUserFromAuthorization(authorization);
    return this.settingsService.getSettings(user);
  }

  @Post('feedback')
  async submitFeedback(
    @Body() dto: SubmitFeedbackDto,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.authService.resolveUserFromAuthorization(authorization);
    return this.settingsService.submitFeedback(user, dto);
  }

  @Get('feedback/my')
  async listMyFeedback(@Headers('authorization') authorization?: string) {
    const user = await this.authService.requireUserFromAuthorization(authorization);
    return this.settingsService.listMyFeedback(user);
  }
}
