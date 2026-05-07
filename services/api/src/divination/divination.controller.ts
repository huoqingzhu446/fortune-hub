import { Body, Controller, Get, Headers, Post } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { SyncDivinationReviewDto } from './dto/sync-divination-review.dto';
import { DivinationService } from './divination.service';

@Controller('divination')
export class DivinationController {
  constructor(
    private readonly divinationService: DivinationService,
    private readonly authService: AuthService,
  ) {}

  @Get('content')
  getContentCatalog() {
    return this.divinationService.getContentCatalog();
  }

  @Get('reviews')
  async getReviews(@Headers('authorization') authorization?: string) {
    const user = await this.authService.requireUserFromAuthorization(authorization);
    return this.divinationService.listReviews(user);
  }

  @Post('reviews/sync')
  async syncReview(
    @Headers('authorization') authorization: string | undefined,
    @Body() dto: SyncDivinationReviewDto,
  ) {
    const user = await this.authService.requireUserFromAuthorization(authorization);
    return this.divinationService.syncReview(user, dto);
  }
}
