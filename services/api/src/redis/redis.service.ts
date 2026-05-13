import { Inject, Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS } from './redis.constants';

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);
  private connectionPromise: Promise<void> | null = null;

  constructor(@Inject(REDIS) private readonly redis: Redis) {}

  private async ensureConnected() {
    if (this.redis.status === 'ready') {
      return;
    }

    if (['wait', 'close', 'end'].includes(this.redis.status)) {
      await this.connectOnce();
      return;
    }

    await this.waitUntilReady();
  }

  private async connectOnce() {
    this.connectionPromise ??= this.redis.connect().then(() => undefined).finally(() => {
      this.connectionPromise = null;
    });

    await this.connectionPromise;
  }

  private async waitUntilReady(timeoutMs = 3000) {
    if (this.redis.status === 'ready') {
      return;
    }

    await new Promise<void>((resolve, reject) => {
      const cleanup = () => {
        clearTimeout(timer);
        this.redis.off('ready', onReady);
        this.redis.off('error', onError);
        this.redis.off('end', onEnd);
      };
      const onReady = () => {
        cleanup();
        resolve();
      };
      const onError = (error: Error) => {
        cleanup();
        reject(error);
      };
      const onEnd = () => {
        cleanup();
        reject(new Error('Redis connection ended'));
      };
      const timer = setTimeout(() => {
        cleanup();
        reject(new Error('Redis connection timeout'));
      }, timeoutMs);

      this.redis.once('ready', onReady);
      this.redis.once('error', onError);
      this.redis.once('end', onEnd);
    });
  }

  async ping() {
    try {
      await this.ensureConnected();

      return await this.redis.ping();
    } catch (error) {
      this.logger.warn(`Redis ping failed: ${this.formatError(error)}`);
      return 'DOWN';
    }
  }

  async get(key: string) {
    try {
      await this.ensureConnected();
      return await this.redis.get(key);
    } catch (error) {
      this.logger.warn(`Redis get failed for ${key}: ${this.formatError(error)}`);
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
    } catch (error) {
      this.logger.warn(`Redis set failed for ${key}: ${this.formatError(error)}`);
      return false;
    }
  }

  async del(key: string) {
    try {
      await this.ensureConnected();
      await this.redis.del(key);
      return true;
    } catch (error) {
      this.logger.warn(`Redis del failed for ${key}: ${this.formatError(error)}`);
      return false;
    }
  }

  getStatus() {
    return this.redis.status;
  }

  private formatError(error: unknown) {
    return error instanceof Error ? error.message : String(error);
  }
}
