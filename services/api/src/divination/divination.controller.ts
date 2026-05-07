import { Controller, Get } from '@nestjs/common';
import { DivinationService } from './divination.service';

@Controller('divination')
export class DivinationController {
  constructor(private readonly divinationService: DivinationService) {}

  @Get('content')
  getContentCatalog() {
    return this.divinationService.getContentCatalog();
  }
}
