import {
  BadRequestException,
  BadGatewayException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomBytes } from 'node:crypto';
import { QueryFailedError, Repository } from 'typeorm';
import { UserEntity } from '../database/entities/user.entity';
import { EntitlementsService } from '../entitlements/entitlements.service';
import { RedisService } from '../redis/redis.service';
import { BindPhoneDto } from './dto/bind-phone.dto';
import { PhoneCodeDto } from './dto/phone-code.dto';
import { PhoneLoginDto } from './dto/phone-login.dto';
import { WechatLoginDto } from './dto/wechat-login.dto';
import { SmsCodeService } from './sms-code.service';

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

type AuthMode = 'wechat' | 'mock' | 'phone';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
    private readonly entitlementsService: EntitlementsService,
    private readonly smsCodeService: SmsCodeService,
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
    user.lastLoginProvider = session.authMode;

    const savedUser = await this.persistUser(user);

    return this.buildLoginResponse(savedUser, session.authMode);
  }

  async sendPhoneCode(dto: PhoneCodeDto, clientIp?: string | null) {
    const phone = this.normalizePhone(dto.phone);
    const result = await this.smsCodeService.sendCode({
      phone,
      scene: dto.scene ?? 'login',
      clientIp,
    });

    return this.buildEnvelope({
      expiresIn: result.expiresIn,
      cooldownSeconds: result.cooldownSeconds,
    });
  }

  async loginWithPhone(dto: PhoneLoginDto) {
    const phone = this.normalizePhone(dto.phone);
    await this.smsCodeService.verifyCode({
      phone,
      scene: 'login',
      code: dto.code,
    });

    const now = new Date();
    let user = await this.userRepository.findOne({
      where: { phone },
    });

    if (!user) {
      user = this.userRepository.create({
        openid: null,
        unionid: null,
        phone,
        phoneVerifiedAt: now,
        nickname: dto.nickname ?? this.buildPhoneNickname(phone),
        avatarUrl: dto.avatarUrl ?? null,
        gender: 'unknown',
        vipStatus: 'inactive',
        lastLoginAt: now,
        lastLoginProvider: 'phone',
      });
    } else {
      user.phoneVerifiedAt = user.phoneVerifiedAt ?? now;
      user.nickname = dto.nickname ?? user.nickname;
      user.avatarUrl = dto.avatarUrl ?? user.avatarUrl;
      user.lastLoginAt = now;
      user.lastLoginProvider = 'phone';
    }

    const savedUser = await this.persistUser(user);
    return this.buildLoginResponse(savedUser, 'phone');
  }

  async bindPhone(user: UserEntity, dto: BindPhoneDto) {
    const phone = this.normalizePhone(dto.phone);
    await this.smsCodeService.verifyCode({
      phone,
      scene: 'bind',
      code: dto.code,
    });

    const existingUser = await this.userRepository.findOne({
      where: { phone },
    });
    if (existingUser && existingUser.id !== user.id) {
      throw new ConflictException('该手机号已绑定其他账号');
    }

    user.phone = phone;
    user.phoneVerifiedAt = new Date();
    let savedUser: UserEntity;
    try {
      savedUser = await this.userRepository.save(user);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string } | undefined)?.code ===
          'ER_DUP_ENTRY'
      ) {
        throw new ConflictException('该手机号已绑定其他账号');
      }

      throw error;
    }

    return this.buildEnvelope({
      user: this.serializeUser(savedUser),
      isProfileCompleted: this.isProfileCompleted(savedUser),
    });
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
    const isVipActive = this.entitlementsService.isMembershipActive(user);

    return {
      id: user.id,
      openid: user.openid,
      phoneMasked: this.maskPhone(user.phone),
      phoneVerifiedAt: user.phoneVerifiedAt?.toISOString() ?? null,
      lastLoginProvider: user.lastLoginProvider,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      birthday: user.birthday,
      birthTime: user.birthTime,
      birthPlace: this.resolveUserBirthPlace(user),
      gender: user.gender,
      zodiac: user.zodiac,
      baziSummary: user.baziSummary,
      fiveElements: user.fiveElements,
      preferences: user.preferencesJson,
      vipStatus: isVipActive ? 'active' : 'inactive',
      vipExpiredAt: isVipActive ? user.vipExpiredAt : null,
    };
  }

  isProfileCompleted(user: UserEntity | null | undefined) {
    return Boolean(
      user?.birthday &&
      user?.birthTime &&
      this.resolveUserBirthPlace(user) &&
      user?.zodiac &&
      user?.gender !== 'unknown',
    );
  }

  resolveUserBirthPlace(user: UserEntity | null | undefined) {
    const preferences = user?.preferencesJson ?? {};
    const candidates = [
      preferences.birthPlace,
      preferences.birthCity,
      preferences.city,
    ];

    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.trim()) {
        return candidate.trim();
      }
    }

    return null;
  }

  private async persistUser(user: UserEntity) {
    try {
      return await this.userRepository.save(user);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string } | undefined)?.code ===
          'ER_DUP_ENTRY'
      ) {
        const existingUser = user.openid
          ? await this.userRepository.findOne({
              where: { openid: user.openid },
            })
          : user.phone
            ? await this.userRepository.findOne({
                where: { phone: user.phone },
              })
            : null;

        if (existingUser) {
          existingUser.unionid = user.unionid ?? existingUser.unionid;
          existingUser.phone = user.phone ?? existingUser.phone;
          existingUser.phoneVerifiedAt =
            user.phoneVerifiedAt ?? existingUser.phoneVerifiedAt;
          existingUser.lastLoginAt = user.lastLoginAt;
          existingUser.lastLoginProvider =
            user.lastLoginProvider ?? existingUser.lastLoginProvider;
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

  private async buildLoginResponse(user: UserEntity, authMode: AuthMode) {
    const token = randomBytes(24).toString('hex');
    const sessionStored = await this.redisService.set(
      `${SESSION_KEY_PREFIX}${token}`,
      user.id,
      SESSION_TTL_SECONDS,
    );

    if (!sessionStored) {
      throw new UnauthorizedException('登录会话创建失败，请稍后再试');
    }

    return this.buildEnvelope({
      token,
      expiresIn: SESSION_TTL_SECONDS,
      authMode,
      authProviderLabel: this.resolveAuthProviderLabel(authMode),
      user: this.serializeUser(user),
      isProfileCompleted: this.isProfileCompleted(user),
    });
  }

  private buildEnvelope<TData>(data: TData) {
    return {
      code: 0,
      message: 'ok',
      data,
      timestamp: new Date().toISOString(),
    };
  }

  private resolveAuthProviderLabel(authMode: AuthMode) {
    if (authMode === 'wechat') {
      return '正式微信授权登录';
    }

    if (authMode === 'phone') {
      return '手机号验证码登录';
    }

    return '开发环境体验登录';
  }

  private normalizePhone(input: string) {
    const compact = input.replace(/[\s-]/g, '');
    const withoutCountryCode = compact.startsWith('+86')
      ? compact.slice(3)
      : compact.startsWith('86') && compact.length === 13
        ? compact.slice(2)
        : compact;

    if (!/^1[3-9]\d{9}$/.test(withoutCountryCode)) {
      throw new BadRequestException('请输入有效手机号');
    }

    return withoutCountryCode;
  }

  private maskPhone(phone?: string | null) {
    if (!phone) {
      return null;
    }

    return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
  }

  private buildPhoneNickname(phone: string) {
    return `用户${phone.slice(-4)}`;
  }

  private async resolveWechatSession(
    code: string,
  ): Promise<ResolvedWechatSession> {
    const appId = this.configService.get<string>('WECHAT_APP_ID');
    const appSecret = this.configService.get<string>('WECHAT_APP_SECRET');
    const allowMockLogin =
      this.configService.get<string>('WECHAT_LOGIN_ALLOW_MOCK', 'false') ===
      'true';
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
          payload.errmsg ||
            '微信登录失败，请检查小程序配置与登录 code 是否有效',
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
