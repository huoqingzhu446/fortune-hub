import { Body, Controller, Get, Headers, Param, Post, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
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

  @Post('jobs')
  async createPosterJob(
    @Body() dto: GeneratePosterDto,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.authService.resolveUserFromAuthorization(authorization);
    return this.postersService.createPosterJob(dto, user);
  }

  @Get('jobs/:jobId')
  async getPosterJob(
    @Param('jobId') jobId: string,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.authService.resolveUserFromAuthorization(authorization);
    return this.postersService.getPosterJob(jobId, user);
  }

  @Get('mini-program-code')
  async getMiniProgramCode(
    @Query('sourceType') sourceType: string | undefined,
    @Query('sourceCode') sourceCode: string | undefined,
    @Query('recordId') recordId: string | undefined,
    @Res() response: Response,
  ) {
    const image = await this.postersService.getMiniProgramCode({
      sourceType,
      sourceCode,
      recordId,
    });

    response.setHeader('Content-Type', image.mimeType);
    response.setHeader('Cache-Control', 'public, max-age=21600');
    response.send(image.buffer);
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
