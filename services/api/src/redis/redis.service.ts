import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS } from './redis.constants';

@Injectable()
export class RedisService {
  constructor(@Inject(REDIS) private readonly redis: Redis) {}

  private async ensureConnected() {
    if (this.redis.status === 'wait') {
      await this.redis.connect();
    }
  }

  async ping() {
    try {
      await this.ensureConnected();

      return await this.redis.ping();
    } catch {
      return 'DOWN';
    }
  }

  async get(key: string) {
    try {
      await this.ensureConnected();
      return await this.redis.get(key);
    } catch {
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number) {
    try {
      await this.ensureConnected();

      if (ttlSeconds) {
        await this.redis.set(key, value, 'EX', ttlSeconds);
        return true;
      }

      await this.redis.set(key, value);
      return true;
    } catch {
      return false;
    }
  }

  async del(key: string) {
    try {
      await this.ensureConnected();
      await this.redis.del(key);
      return true;
    } catch {
      return false;
    }
  }

  getStatus() {
    return this.redis.status;
  }
}
