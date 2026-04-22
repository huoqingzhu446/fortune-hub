import { Body, Controller, Headers, Post } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { VerifyRewardDto } from './dto/verify-reward.dto';
import { AdsService } from './ads.service';

@Controller('ads')
export class AdsController {
  constructor(
    private readonly authService: AuthService,
    private readonly adsService: AdsService,
  ) {}

  @Post('reward/verify')
  async verifyReward(
    @Body() dto: VerifyRewardDto,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.authService.requireUserFromAuthorization(authorization);
    return this.adsService.verifyReward(user, dto);
  }
}
