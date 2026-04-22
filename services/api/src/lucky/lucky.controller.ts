import { Controller, Get, Headers, Param } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { LuckyService } from './lucky.service';

@Controller('lucky')
export class LuckyController {
  constructor(
    private readonly luckyService: LuckyService,
    private readonly authService: AuthService,
  ) {}

  @Get('today')
  async getToday(@Headers('authorization') authorization?: string) {
    const user = await this.authService.resolveUserFromAuthorization(authorization);
    return this.luckyService.getToday(user);
  }

  @Get('signs/:bizCode')
  async getSignDetail(
    @Param('bizCode') bizCode: string,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.authService.resolveUserFromAuthorization(authorization);
    return this.luckyService.getSignDetail(bizCode, user);
  }
}
