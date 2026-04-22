import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminSessionGuard } from '../admin-auth/admin-session.guard';
import { SaveFortuneContentDto } from './dto/save-fortune-content.dto';
import { AdminContentService } from './admin-content.service';

@Controller('admin/fortune-contents')
@UseGuards(AdminSessionGuard)
export class AdminContentController {
  constructor(private readonly adminContentService: AdminContentService) {}

  @Get()
  listContents(
    @Query('contentType') contentType?: string,
    @Query('keyword') keyword?: string,
  ) {
    return this.adminContentService.listContents(contentType, keyword);
  }

  @Post()
  createContent(@Body() dto: SaveFortuneContentDto) {
    return this.adminContentService.createContent(dto);
  }

  @Put(':id')
  updateContent(@Param('id') id: string, @Body() dto: SaveFortuneContentDto) {
    return this.adminContentService.updateContent(id, dto);
  }

  @Delete(':id')
  deleteContent(@Param('id') id: string) {
    return this.adminContentService.deleteContent(id);
  }
}
