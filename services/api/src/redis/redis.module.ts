import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS } from './redis.constants';
import { RedisService } from './redis.service';

@Global()
@Module({
  providers: [
    {
      provide: REDIS,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        new Redis({
          host: configService.get<string>('REDIS_HOST', '127.0.0.1'),
          port: configService.get<number>('REDIS_PORT', 6379),
          lazyConnect: true,
          maxRetriesPerRequest: 1,
          enableReadyCheck: true,
          retryStrategy: (times) => Math.min(times * 100, 3000),
          reconnectOnError: (error) => {
            const message = error.message.toLowerCase();
            return message.includes('readonly') || message.includes('connection');
          },
        }),
    },
    RedisService,
  ],
  exports: [REDIS, RedisService],
})
export class RedisModule {}
