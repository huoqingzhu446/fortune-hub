import { Body, Controller, Get, Headers, Param, Post } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { GeneratePosterDto } from './dto/generate-poster.dto';
import { PostersService } from './posters.service';

@Controller('posters')
export class PostersController {
  constructor(
    private readonly postersService: PostersService,
    private readonly authService: AuthService,
  ) {}

  @Post('generate')
  async generatePoster(
    @Body() dto: GeneratePosterDto,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.authService.resolveUserFromAuthorization(authorization);
    return this.postersService.generatePoster(dto, user);
  }

  @Get(':posterId')
  async getPoster(
    @Param('posterId') posterId: string,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.authService.resolveUserFromAuthorization(authorization);
    return this.postersService.getPoster(posterId, user);
  }
}
