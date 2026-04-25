import {
  BadGatewayException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomBytes } from 'node:crypto';
import { QueryFailedError, Repository } from 'typeorm';
import { UserEntity } from '../database/entities/user.entity';
import { RedisService } from '../redis/redis.service';
import { WechatLoginDto } from './dto/wechat-login.dto';

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
const SESSION_KEY_PREFIX = 'auth:session:';

interface WechatSessionResponse {
  openid?: string;
  unionid?: string;
  errcode?: number;
  errmsg?: string;
}

interface ResolvedWechatSession {
  openid: string;
  unionid: string | null;
  authMode: 'wechat' | 'mock';
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: WechatLoginDto) {
    const session = await this.resolveWechatSession(dto.code);
    const now = new Date();

    let user = await this.userRepository.findOne({
      where: { openid: session.openid },
    });

    if (!user) {
      user = this.userRepository.create({
        openid: session.openid,
        unionid: session.unionid ?? null,
        nickname: dto.nickname ?? null,
        avatarUrl: dto.avatarUrl ?? null,
        gender: 'unknown',
        vipStatus: 'inactive',
        lastLoginAt: now,
      });
    } else {
      user.unionid = session.unionid ?? user.unionid;
      user.nickname = dto.nickname ?? user.nickname;
      user.avatarUrl = dto.avatarUrl ?? user.avatarUrl;
      user.lastLoginAt = now;
    }

    const savedUser = await this.persistUser(user);
    const token = randomBytes(24).toString('hex');
    const sessionStored = await this.redisService.set(
      `${SESSION_KEY_PREFIX}${token}`,
      savedUser.id,
      SESSION_TTL_SECONDS,
    );

    if (!sessionStored) {
      throw new UnauthorizedException('登录会话创建失败，请稍后再试');
    }

    return {
      code: 0,
      message: 'ok',
      data: {
        token,
        expiresIn: SESSION_TTL_SECONDS,
        authMode: session.authMode,
        authProviderLabel:
          session.authMode === 'wechat' ? '正式微信授权登录' : '开发环境体验登录',
        user: this.serializeUser(savedUser),
        isProfileCompleted: Boolean(savedUser.birthday && savedUser.zodiac),
      },
      timestamp: new Date().toISOString(),
    };
  }

  async requireUserFromAuthorization(authorization?: string) {
    const token = this.extractBearerToken(authorization);
    const userId = await this.redisService.get(`${SESSION_KEY_PREFIX}${token}`);

    if (!userId) {
      throw new UnauthorizedException('登录状态已失效，请重新登录');
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在或登录状态无效');
    }

    return user;
  }

  async resolveUserFromAuthorization(authorization?: string) {
    if (!authorization) {
      return null;
    }

    try {
      return await this.requireUserFromAuthorization(authorization);
    } catch {
      return null;
    }
  }

  serializeUser(user: UserEntity) {
    const isVipActive =
      user.vipStatus === 'active' &&
      user.vipExpiredAt instanceof Date &&
      user.vipExpiredAt.getTime() > Date.now();

    return {
      id: user.id,
      openid: user.openid,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      birthday: user.birthday,
      birthTime: user.birthTime,
      gender: user.gender,
      zodiac: user.zodiac,
      baziSummary: user.baziSummary,
      fiveElements: user.fiveElements,
      preferences: user.preferencesJson,
      vipStatus: isVipActive ? 'active' : 'inactive',
      vipExpiredAt: isVipActive ? user.vipExpiredAt : null,
    };
  }

  private async persistUser(user: UserEntity) {
    try {
      return await this.userRepository.save(user);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string } | undefined)?.code === 'ER_DUP_ENTRY'
      ) {
        const existingUser = await this.userRepository.findOne({
          where: { openid: user.openid },
        });

        if (existingUser) {
          existingUser.unionid = user.unionid ?? existingUser.unionid;
          existingUser.lastLoginAt = user.lastLoginAt;
          return this.userRepository.save(existingUser);
        }
      }

      throw error;
    }
  }

  private extractBearerToken(authorization?: string) {
    if (!authorization) {
      throw new UnauthorizedException('缺少登录凭证');
    }

    const [scheme, token] = authorization.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('登录凭证格式错误');
    }

    return token;
  }

  private async resolveWechatSession(code: string): Promise<ResolvedWechatSession> {
    const appId = this.configService.get<string>('WECHAT_APP_ID');
    const appSecret = this.configService.get<string>('WECHAT_APP_SECRET');
    const allowMockLogin =
      this.configService.get<string>('WECHAT_LOGIN_ALLOW_MOCK', 'false') === 'true';
    const isDevCode = code.startsWith('dev-');

    if (appId && appSecret) {
      const url = new URL('https://api.weixin.qq.com/sns/jscode2session');
      url.searchParams.set('appid', appId);
      url.searchParams.set('secret', appSecret);
      url.searchParams.set('js_code', code);
      url.searchParams.set('grant_type', 'authorization_code');

      const response = await fetch(url);
      const payload = (await response.json()) as WechatSessionResponse;

      if (!response.ok || !payload.openid) {
        throw new BadGatewayException(
          payload.errmsg || '微信登录失败，请检查小程序配置与登录 code 是否有效',
        );
      }

      return {
        openid: payload.openid,
        unionid: payload.unionid ?? null,
        authMode: 'wechat',
      };
    }

    if (!isDevCode && !allowMockLogin) {
      throw new BadGatewayException(
        '当前环境未配置正式微信登录，请检查 WECHAT_APP_ID / WECHAT_APP_SECRET',
      );
    }

    return {
      openid: `mock_${createHash('sha256').update(code).digest('hex').slice(0, 24)}`,
      unionid: null,
      authMode: 'mock',
    };
  }
}
