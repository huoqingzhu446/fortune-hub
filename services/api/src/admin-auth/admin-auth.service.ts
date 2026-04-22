import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'node:crypto';
import { RedisService } from '../redis/redis.service';
import { ADMIN_MENU_ITEMS } from './admin-auth.constants';

const ADMIN_SESSION_PREFIX = 'admin:session:';
const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 12;

export interface AdminProfile {
  username: string;
  displayName: string;
  roleCode: string;
  permissions: string[];
}

@Injectable()
export class AdminAuthService {
  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  async login(username: string, password: string) {
    const configured = this.getConfiguredAdmin();

    if (username !== configured.username || password !== configured.password) {
      throw new UnauthorizedException('管理员账号或密码错误');
    }

    const token = randomBytes(24).toString('hex');
    const saved = await this.redisService.set(
      `${ADMIN_SESSION_PREFIX}${token}`,
      configured.username,
      ADMIN_SESSION_TTL_SECONDS,
    );

    if (!saved) {
      throw new UnauthorizedException('管理员会话创建失败，请稍后再试');
    }

    return {
      code: 0,
      message: 'ok',
      data: {
        token,
        expiresIn: ADMIN_SESSION_TTL_SECONDS,
        admin: this.serializeAdmin(configured.username),
      },
      timestamp: new Date().toISOString(),
    };
  }

  async requireAdminFromAuthorization(authorization?: string) {
    const token = this.extractBearerToken(authorization);
    const username = await this.redisService.get(`${ADMIN_SESSION_PREFIX}${token}`);

    if (!username) {
      throw new UnauthorizedException('管理员登录已失效，请重新登录');
    }

    const configured = this.getConfiguredAdmin();
    if (username !== configured.username) {
      throw new UnauthorizedException('管理员身份无效');
    }

    return this.serializeAdmin(username);
  }

  getMenus(admin: AdminProfile) {
    return ADMIN_MENU_ITEMS.filter((item) => admin.permissions.includes(item.permission));
  }

  serializeAdmin(username: string): AdminProfile {
    const configured = this.getConfiguredAdmin();
    return {
      username,
      displayName: configured.displayName,
      roleCode: 'super-admin',
      permissions: [
        'dashboard:view',
        'question-bank:manage',
        'content:manage',
        'commerce:manage',
      ],
    };
  }

  private getConfiguredAdmin() {
    return {
      username: this.configService.get<string>('ADMIN_USERNAME', 'admin'),
      password: this.configService.get<string>('ADMIN_PASSWORD', 'fortune123'),
      displayName: this.configService.get<string>('ADMIN_DISPLAY_NAME', 'Fortune Hub 管理员'),
    };
  }

  private extractBearerToken(authorization?: string) {
    if (!authorization) {
      throw new UnauthorizedException('缺少管理员登录凭证');
    }

    const [scheme, token] = authorization.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('管理员登录凭证格式错误');
    }

    return token;
  }
}
