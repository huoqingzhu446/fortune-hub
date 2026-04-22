import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { CreateQuestionBankGroupDto } from './dto/create-question-bank-group.dto';
import { CreateQuestionBankTestDto } from './dto/create-question-bank-test.dto';
import { UpdateQuestionBankDto } from './dto/update-question-bank.dto';
import { QuestionBankService } from './question-bank.service';

@Controller('admin/question-bank')
export class QuestionBankController {
  constructor(private readonly questionBankService: QuestionBankService) {}

  @Get('tests')
  getTests(@Query('category') category?: string) {
    return this.questionBankService.getTests(category);
  }

  @Get('groups')
  getGroups(@Query('category') category?: string) {
    return this.questionBankService.getGroups(category);
  }

  @Post('groups')
  createGroup(@Body() dto: CreateQuestionBankGroupDto) {
    return this.questionBankService.createGroup(dto);
  }

  @Delete('groups/:category/:code')
  deleteGroup(
    @Param('category') category: string,
    @Param('code') code: string,
  ) {
    return this.questionBankService.deleteGroup(category, code);
  }

  @Get('tests/:category/:code')
  getTestDetail(
    @Param('category') category: string,
    @Param('code') code: string,
  ) {
    return this.questionBankService.getTestDetail(category, code);
  }

  @Post('tests')
  createTest(@Body() dto: CreateQuestionBankTestDto) {
    return this.questionBankService.createTest(dto);
  }

  @Put('tests/:category/:code')
  updateTest(
    @Param('category') category: string,
    @Param('code') code: string,
    @Body() dto: UpdateQuestionBankDto,
  ) {
    return this.questionBankService.updateTest(category, code, dto);
  }
}
