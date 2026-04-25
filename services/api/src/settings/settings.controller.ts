import { Body, Controller, Delete, Get, Headers, Param, Post } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { SubmitFeedbackDto } from './dto/submit-feedback.dto';
import { UpdateConsentDto } from './dto/update-consent.dto';
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

  @Get('me/consents')
  async listConsents(@Headers('authorization') authorization?: string) {
    const user = await this.authService.requireUserFromAuthorization(authorization);
    return this.settingsService.listMyConsents(user);
  }

  @Post('me/consents')
  async agreeConsent(
    @Body() dto: UpdateConsentDto,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.authService.requireUserFromAuthorization(authorization);
    return this.settingsService.agreeConsent(user, dto);
  }

  @Delete('me/consents/:consentType')
  async revokeConsent(
    @Param('consentType') consentType: string,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.authService.requireUserFromAuthorization(authorization);
    return this.settingsService.revokeConsent(user, consentType);
  }

  @Post('me/consents/:consentType/revoke')
  async revokeConsentByPost(
    @Param('consentType') consentType: string,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.authService.requireUserFromAuthorization(authorization);
    return this.settingsService.revokeConsent(user, consentType);
  }
}
