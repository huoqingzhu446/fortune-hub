import { Body, Controller, Get, Headers, Param, Post } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { SubmitAssessmentDto } from './dto/submit-assessment.dto';
import { AssessmentService } from './assessment.service';

@Controller('assessments/personality')
export class AssessmentController {
  constructor(
    private readonly assessmentService: AssessmentService,
    private readonly authService: AuthService,
  ) {}

  @Get('tests')
  getTests() {
    return this.assessmentService.getPersonalityTests();
  }

  @Get('tests/:code')
  getTestDetail(@Param('code') code: string) {
    return this.assessmentService.getPersonalityTestDetail(code);
  }

  @Post('tests/:code/submit')
  async submitTest(
    @Param('code') code: string,
    @Body() dto: SubmitAssessmentDto,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.authService.resolveUserFromAuthorization(authorization);
    return this.assessmentService.submitPersonalityTest(code, dto, user);
  }

  @Get('history')
  async getHistory(@Headers('authorization') authorization?: string) {
    const user = await this.authService.requireUserFromAuthorization(authorization);
    return this.assessmentService.getPersonalityHistory(user);
  }
}
