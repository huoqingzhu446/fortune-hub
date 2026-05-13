import {
  BadGatewayException,
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Credential, * as $Credential from '@alicloud/credentials';
import Dysmsapi20170525, * as $Dysmsapi20170525 from '@alicloud/dysmsapi20170525';
import * as $OpenApi from '@alicloud/openapi-client';
import * as $Util from '@alicloud/tea-util';
import { createHash, randomInt, timingSafeEqual } from 'node:crypto';
import { RedisService } from '../redis/redis.service';

export type PhoneCodeScene = 'login' | 'bind';

const CODE_TTL_SECONDS = 5 * 60;
const SEND_COOLDOWN_SECONDS = 60;
const MAX_DAILY_SENDS = 10;
const MAX_HOURLY_IP_SENDS = 30;
const MAX_VERIFY_ATTEMPTS = 5;

@Injectable()
export class SmsCodeService {
  private readonly logger = new Logger(SmsCodeService.name);
  private aliyunClient?: Dysmsapi20170525;

  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  async sendCode(input: {
    phone: string;
    scene: PhoneCodeScene;
    clientIp?: string | null;
  }) {
    await this.assertCanSend(input.phone, input.clientIp);
    const code = this.createCode();
    const provider = await this.deliverCode(input.phone, code);
    const codeStored = await this.redisService.set(
      this.codeKey(input.scene, input.phone),
      this.hashCode(input.scene, input.phone, code),
      CODE_TTL_SECONDS,
    );
    if (!codeStored) {
      throw new BadRequestException('验证码服务暂不可用，请稍后再试');
    }
    await this.redisService.set(
      this.cooldownKey(input.phone),
      '1',
      SEND_COOLDOWN_SECONDS,
    );
    await this.bumpCounter(
      this.dailyKey(input.phone),
      MAX_DAILY_SENDS,
      24 * 60 * 60,
      '今日验证码发送次数已达上限，请明天再试',
    );
    if (input.clientIp) {
      await this.bumpCounter(
        this.ipKey(input.clientIp),
        MAX_HOURLY_IP_SENDS,
        60 * 60,
        '验证码发送过于频繁，请稍后再试',
      );
    }

    return {
      expiresIn: CODE_TTL_SECONDS,
      cooldownSeconds: SEND_COOLDOWN_SECONDS,
      provider,
    };
  }

  async verifyCode(input: {
    phone: string;
    scene: PhoneCodeScene;
    code: string;
  }) {
    const attemptsKey = this.attemptsKey(input.scene, input.phone);
    const attempts = Number((await this.redisService.get(attemptsKey)) ?? '0');
    if (attempts >= MAX_VERIFY_ATTEMPTS) {
      throw new HttpException(
        '验证码错误次数过多，请重新获取',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const storedHash = await this.redisService.get(
      this.codeKey(input.scene, input.phone),
    );
    if (!storedHash) {
      throw new BadRequestException('验证码已过期，请重新获取');
    }

    const inputHash = this.hashCode(input.scene, input.phone, input.code);
    if (!this.safeEqual(storedHash, inputHash)) {
      await this.redisService.set(
        attemptsKey,
        String(attempts + 1),
        CODE_TTL_SECONDS,
      );
      throw new BadRequestException('验证码不正确');
    }

    await Promise.all([
      this.redisService.del(this.codeKey(input.scene, input.phone)),
      this.redisService.del(attemptsKey),
    ]);
  }

  private async assertCanSend(phone: string, clientIp?: string | null) {
    if (await this.redisService.get(this.cooldownKey(phone))) {
      throw new HttpException(
        '验证码发送过于频繁，请稍后再试',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const dailyCount = Number(
      (await this.redisService.get(this.dailyKey(phone))) ?? '0',
    );
    if (dailyCount >= MAX_DAILY_SENDS) {
      throw new HttpException(
        '今日验证码发送次数已达上限，请明天再试',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (!clientIp) {
      return;
    }

    const ipCount = Number(
      (await this.redisService.get(this.ipKey(clientIp))) ?? '0',
    );
    if (ipCount >= MAX_HOURLY_IP_SENDS) {
      throw new HttpException(
        '验证码发送过于频繁，请稍后再试',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private async bumpCounter(
    key: string,
    max: number,
    ttlSeconds: number,
    message: string,
  ) {
    const current = Number((await this.redisService.get(key)) ?? '0');
    if (current >= max) {
      throw new HttpException(message, HttpStatus.TOO_MANY_REQUESTS);
    }

    await this.redisService.set(key, String(current + 1), ttlSeconds);
  }

  private createCode() {
    if (this.isMockProvider()) {
      return this.getConfigValue('SMS_MOCK_CODE', '123456') || '123456';
    }

    return String(randomInt(100000, 999999));
  }

  private async deliverCode(phone: string, code: string) {
    if (this.isMockProvider()) {
      return 'mock';
    }

    const provider = this.getProvider();
    if (provider === 'webhook') {
      return this.deliverByWebhook(phone, code);
    }
    if (provider === 'aliyun') {
      return this.deliverByAliyun(phone, code);
    }

    throw new BadRequestException(
      provider
        ? `短信服务商 ${provider} 尚未接入，请先完成服务端配置`
        : '短信服务暂未配置',
    );
  }

  private isMockProvider() {
    const provider = this.getProvider();
    const mockEnabled =
      this.configService.get<string>('SMS_MOCK_ENABLED', '') === 'true';
    const isProduction =
      this.configService.get<string>('NODE_ENV', 'development') ===
      'production';

    if (isProduction) {
      return false;
    }

    return provider === 'mock' || mockEnabled || (!provider && !isProduction);
  }

  private async deliverByAliyun(phone: string, code: string) {
    const client = this.getAliyunClient();
    const codeParamName =
      this.getConfigValue('ALIYUN_SMS_TEMPLATE_PARAM_NAME', 'code') || 'code';
    const request = new $Dysmsapi20170525.SendSmsRequest({
      phoneNumbers: phone,
      signName: this.getRequiredConfig(
        'ALIYUN_SMS_SIGN_NAME',
        '阿里云短信签名未配置',
      ),
      templateCode: this.getRequiredConfig(
        'ALIYUN_SMS_TEMPLATE_CODE',
        '阿里云短信模板 Code 未配置',
      ),
      templateParam: JSON.stringify({ [codeParamName]: code }),
    });

    try {
      const response = await client.sendSmsWithOptions(
        request,
        new $Util.RuntimeOptions({}),
      );
      const responseCode = response.body?.code;
      if (responseCode !== 'OK') {
        this.logger.warn(
          `Aliyun SMS rejected request: code=${responseCode ?? 'unknown'}, requestId=${response.body?.requestId ?? 'unknown'}, message=${response.body?.message ?? 'unknown'}`,
        );
        throw new BadGatewayException('短信服务发送失败，请稍后再试');
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.warn(`Aliyun SMS failed: ${this.formatAliyunError(error)}`);
      throw new BadGatewayException('短信服务发送失败，请稍后再试');
    }

    return 'aliyun';
  }

  private getAliyunClient() {
    if (!this.aliyunClient) {
      const config = new $OpenApi.Config({
        credential: this.createAliyunCredential(),
      });
      config.endpoint =
        this.getConfigValue('ALIYUN_SMS_ENDPOINT', 'dysmsapi.aliyuncs.com') ||
        'dysmsapi.aliyuncs.com';
      this.aliyunClient = new Dysmsapi20170525(config);
    }

    return this.aliyunClient;
  }

  private createAliyunCredential() {
    const accessKeyId =
      this.getConfigValue('ALIYUN_ACCESS_KEY_ID') ||
      this.getConfigValue('ALIBABA_CLOUD_ACCESS_KEY_ID');
    const accessKeySecret =
      this.getConfigValue('ALIYUN_ACCESS_KEY_SECRET') ||
      this.getConfigValue('ALIBABA_CLOUD_ACCESS_KEY_SECRET');

    if (!accessKeyId && !accessKeySecret) {
      return new Credential();
    }
    if (!accessKeyId || !accessKeySecret) {
      throw new BadRequestException('阿里云短信 AccessKey 配置不完整');
    }

    return new Credential(
      new $Credential.Config({
        type: 'access_key',
        accessKeyId,
        accessKeySecret,
      }),
    );
  }

  private async deliverByWebhook(phone: string, code: string) {
    const endpoint = this.configService
      .get<string>('SMS_WEBHOOK_URL', '')
      .trim();
    if (!endpoint) {
      throw new BadRequestException('短信 Webhook 未配置');
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.buildWebhookAuthHeaders(),
      },
      body: JSON.stringify({
        phone,
        code,
        scene: 'fortune-hub-login',
      }),
    });

    if (!response.ok) {
      throw new BadGatewayException('短信服务发送失败，请稍后再试');
    }

    return 'webhook';
  }

  private buildWebhookAuthHeaders(): Record<string, string> {
    const token = this.configService
      .get<string>('SMS_WEBHOOK_TOKEN', '')
      .trim();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private getProvider() {
    return this.getConfigValue('SMS_PROVIDER').toLowerCase();
  }

  private getConfigValue(key: string, fallback = '') {
    return this.configService.get<string>(key, fallback)?.trim() ?? '';
  }

  private getRequiredConfig(key: string, message: string) {
    const value = this.getConfigValue(key);
    if (!value) {
      throw new BadRequestException(message);
    }

    return value;
  }

  private formatAliyunError(error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : this.getObjectStringValue(error, 'message') || 'unknown error';
    const recommendation =
      typeof error === 'object' && error
        ? this.getObjectStringValue(
            (error as { data?: unknown }).data,
            'Recommend',
          )
        : '';

    return recommendation ? `${message}; recommend=${recommendation}` : message;
  }

  private getObjectStringValue(source: unknown, key: string) {
    if (!source || typeof source !== 'object' || !(key in source)) {
      return '';
    }

    const value = (source as Record<string, unknown>)[key];
    return typeof value === 'string' ? value : '';
  }

  private hashCode(scene: PhoneCodeScene, phone: string, code: string) {
    const pepper = this.configService.get<string>(
      'SMS_CODE_PEPPER',
      'fortune-hub-phone-code',
    );

    return createHash('sha256')
      .update(`${scene}:${phone}:${code}:${pepper}`)
      .digest('hex');
  }

  private safeEqual(a: string, b: string) {
    const aBuffer = Buffer.from(a);
    const bBuffer = Buffer.from(b);

    return (
      aBuffer.length === bBuffer.length && timingSafeEqual(aBuffer, bBuffer)
    );
  }

  private codeKey(scene: PhoneCodeScene, phone: string) {
    return `auth:sms:code:${scene}:${phone}`;
  }

  private attemptsKey(scene: PhoneCodeScene, phone: string) {
    return `auth:sms:attempts:${scene}:${phone}`;
  }

  private cooldownKey(phone: string) {
    return `auth:sms:cooldown:${phone}`;
  }

  private dailyKey(phone: string) {
    return `auth:sms:daily:${phone}:${new Date().toISOString().slice(0, 10)}`;
  }

  private ipKey(clientIp: string) {
    return `auth:sms:ip:${createHash('sha256').update(clientIp).digest('hex').slice(0, 24)}`;
  }
}
