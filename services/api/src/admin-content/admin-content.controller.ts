import {
  Body,
  BadRequestException,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AdminSessionGuard } from '../admin-auth/admin-session.guard';
import { SaveConfigEntryDto } from './dto/save-config-entry.dto';
import { SaveFortuneContentDto } from './dto/save-fortune-content.dto';
import { SaveLuckyItemDto } from './dto/save-lucky-item.dto';
import { SaveReportTemplateDto } from './dto/save-report-template.dto';
import { UpdateResourceStatusDto } from './dto/update-resource-status.dto';
import { AdminContentService } from './admin-content.service';

const ALLOWED_AUDIO_MIME_TYPES = new Set([
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/ogg',
  'audio/aac',
  'audio/mp4',
  'audio/webm',
]);

const audioUploadOptions = {
  storage: memoryStorage(),
  limits: {
    fileSize: 30 * 1024 * 1024,
  },
  fileFilter: (
    _request: unknown,
    file: Express.Multer.File,
    callback: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    if (!ALLOWED_AUDIO_MIME_TYPES.has(file.mimetype)) {
      callback(new BadRequestException('仅支持 mp3 / wav / ogg / aac / webm 音频上传'), false);
      return;
    }

    callback(null, true);
  },
};

@Controller('admin/fortune-contents')
@UseGuards(AdminSessionGuard)
export class AdminContentController {
  constructor(private readonly adminContentService: AdminContentService) {}

  @Get()
  listContents(
    @Query('contentType') contentType?: string,
    @Query('keyword') keyword?: string,
    @Query('status') status?: string,
  ) {
    return this.adminContentService.listContents(contentType, keyword, status);
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

  @Post(':id/status')
  changeContentStatus(
    @Param('id') id: string,
    @Body() dto: UpdateResourceStatusDto,
  ) {
    return this.adminContentService.changeContentStatus(id, dto.status);
  }
}

@Controller('admin/lucky-items')
@UseGuards(AdminSessionGuard)
export class AdminLuckyItemsController {
  constructor(private readonly adminContentService: AdminContentService) {}

  @Get()
  listLuckyItems(
    @Query('keyword') keyword?: string,
    @Query('status') status?: string,
  ) {
    return this.adminContentService.listLuckyItems(keyword, status);
  }

  @Post()
  createLuckyItem(@Body() dto: SaveLuckyItemDto) {
    return this.adminContentService.createLuckyItem(dto);
  }

  @Put(':id')
  updateLuckyItem(@Param('id') id: string, @Body() dto: SaveLuckyItemDto) {
    return this.adminContentService.updateLuckyItem(id, dto);
  }

  @Delete(':id')
  deleteLuckyItem(@Param('id') id: string) {
    return this.adminContentService.deleteLuckyItem(id);
  }

  @Post(':id/status')
  changeLuckyItemStatus(
    @Param('id') id: string,
    @Body() dto: UpdateResourceStatusDto,
  ) {
    return this.adminContentService.changeLuckyItemStatus(id, dto.status);
  }
}

@Controller('admin/report-templates')
@UseGuards(AdminSessionGuard)
export class AdminReportTemplatesController {
  constructor(private readonly adminContentService: AdminContentService) {}

  @Get()
  listReportTemplates(
    @Query('templateType') templateType?: string,
    @Query('keyword') keyword?: string,
    @Query('status') status?: string,
  ) {
    return this.adminContentService.listReportTemplates(
      templateType,
      keyword,
      status,
    );
  }

  @Post()
  createReportTemplate(@Body() dto: SaveReportTemplateDto) {
    return this.adminContentService.createReportTemplate(dto);
  }

  @Put(':id')
  updateReportTemplate(
    @Param('id') id: string,
    @Body() dto: SaveReportTemplateDto,
  ) {
    return this.adminContentService.updateReportTemplate(id, dto);
  }

  @Delete(':id')
  deleteReportTemplate(@Param('id') id: string) {
    return this.adminContentService.deleteReportTemplate(id);
  }

  @Post(':id/status')
  changeReportTemplateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateResourceStatusDto,
  ) {
    return this.adminContentService.changeReportTemplateStatus(id, dto.status);
  }
}

@Controller('admin/configs')
@UseGuards(AdminSessionGuard)
export class AdminConfigsController {
  constructor(private readonly adminContentService: AdminContentService) {}

  @Get()
  listConfigs(
    @Query('namespace') namespace?: string,
    @Query('keyword') keyword?: string,
    @Query('status') status?: string,
  ) {
    return this.adminContentService.listConfigs(namespace, keyword, status);
  }

  @Post()
  createConfig(@Body() dto: SaveConfigEntryDto) {
    return this.adminContentService.createConfig({
      ...dto,
      valueType: dto.valueType ?? 'json',
    });
  }

  @Put(':id')
  updateConfig(@Param('id') id: string, @Body() dto: SaveConfigEntryDto) {
    return this.adminContentService.updateConfig(id, {
      ...dto,
      valueType: dto.valueType ?? 'json',
    });
  }

  @Delete(':id')
  deleteConfig(@Param('id') id: string) {
    return this.adminContentService.deleteConfig(id);
  }

  @Post(':id/status')
  changeConfigStatus(
    @Param('id') id: string,
    @Body() dto: UpdateResourceStatusDto,
  ) {
    return this.adminContentService.changeConfigStatus(id, dto.status);
  }
}

@Controller('admin/uploads')
@UseGuards(AdminSessionGuard)
export class AdminUploadsController {
  constructor(private readonly adminContentService: AdminContentService) {}

  @Post('audio')
  @UseInterceptors(FileInterceptor('file', audioUploadOptions))
  uploadAudio(
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    if (!file) {
      throw new BadRequestException('请先选择音频文件');
    }

    return this.adminContentService.uploadAudio(file);
  }
}
