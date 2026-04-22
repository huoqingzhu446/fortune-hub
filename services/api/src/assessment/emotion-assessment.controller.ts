import { Body, Controller, Get, Headers, Param, Post } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { SubmitAssessmentDto } from './dto/submit-assessment.dto';
import { EmotionAssessmentService } from './emotion-assessment.service';

@Controller('assessments/emotion')
export class EmotionAssessmentController {
  constructor(
    private readonly emotionAssessmentService: EmotionAssessmentService,
    private readonly authService: AuthService,
  ) {}

  @Get('tests')
  getTests() {
    return this.emotionAssessmentService.getEmotionTests();
  }

  @Get('tests/:code')
  getTestDetail(@Param('code') code: string) {
    return this.emotionAssessmentService.getEmotionTestDetail(code);
  }

  @Post('tests/:code/submit')
  async submitTest(
    @Param('code') code: string,
    @Body() dto: SubmitAssessmentDto,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.authService.resolveUserFromAuthorization(authorization);
    return this.emotionAssessmentService.submitEmotionTest(code, dto, user);
  }

  @Get('history')
  async getHistory(@Headers('authorization') authorization?: string) {
    const user = await this.authService.requireUserFromAuthorization(authorization);
    return this.emotionAssessmentService.getEmotionHistory(user);
  }
}
