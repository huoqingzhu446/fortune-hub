import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AuthService } from '../auth/auth.service';
import { SubmitFeedbackDto } from './dto/submit-feedback.dto';
import { UpdateConsentDto } from './dto/update-consent.dto';
import { SettingsService } from './settings.service';

const ALLOWED_FEEDBACK_ATTACHMENT_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'text/plain',
]);

const feedbackAttachmentUploadOptions = {
  storage: memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (
    _request: unknown,
    file: Express.Multer.File,
    callback: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    if (!ALLOWED_FEEDBACK_ATTACHMENT_MIME_TYPES.has(file.mimetype)) {
      callback(new BadRequestException('仅支持图片、PDF 或文本附件'), false);
      return;
    }

    callback(null, true);
  },
};

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

  @Post('feedback/attachments')
  @UseInterceptors(FileInterceptor('file', feedbackAttachmentUploadOptions))
  async uploadFeedbackAttachment(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Headers('authorization') authorization?: string,
  ) {
    if (!file) {
      throw new BadRequestException('请选择要上传的反馈附件');
    }

    const user = await this.authService.resolveUserFromAuthorization(authorization);
    return this.settingsService.uploadFeedbackAttachment(file, user);
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
