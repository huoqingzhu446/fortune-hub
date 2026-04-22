import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { RedisService } from '../redis/redis.service';

@Controller('health')
export class HealthController {
  constructor(
    private readonly dataSource: DataSource,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  async getHealth() {
    return {
      service: 'fortune-hub-api',
      mysql: this.dataSource.isInitialized ? 'UP' : 'DOWN',
      redis: await this.redisService.ping(),
      fileServiceBaseUrl: this.configService.get<string>(
        'FILE_SERVICE_BASE_URL',
        'http://8.152.214.57:3000/api',
      ),
      timestamp: new Date().toISOString(),
    };
  }
}
