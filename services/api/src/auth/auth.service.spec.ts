import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  it('creates a mock login session and resolves bearer token', async () => {
    const savedUser = {
      id: 'u1',
      openid: 'mock_openid',
      unionid: null,
      nickname: '测试用户',
      avatarUrl: null,
      birthday: null,
      birthTime: null,
      birthPlace: null,
      phone: null,
      phoneVerifiedAt: null,
      gender: 'unknown',
      zodiac: null,
      baziSummary: null,
      fiveElements: null,
      preferencesJson: null,
      vipStatus: 'inactive',
      vipExpiredAt: null,
      lastLoginProvider: null,
    };
    const userRepo = {
      findOne: jest.fn(async ({ where }) =>
        where.id === 'u1' ? savedUser : null,
      ),
      create: jest.fn((input) => ({ ...savedUser, ...input })),
      save: jest.fn(async (input) => ({ ...savedUser, ...input, id: 'u1' })),
    };
    const redis = {
      set: jest.fn(async () => true),
      get: jest.fn(async () => 'u1'),
    };
    const config = {
      get: jest.fn((_key: string, fallback?: string) => fallback),
    };
    const entitlements = {
      isMembershipActive: jest.fn(() => false),
    };
    const smsCodes = {
      sendCode: jest.fn(),
      verifyCode: jest.fn(),
    };
    const service = new AuthService(
      userRepo as never,
      redis as never,
      config as never,
      entitlements as never,
      smsCodes as never,
    );

    const loginResponse = await service.login({
      code: 'dev-login',
      platform: 'mp-weixin',
      nickname: '测试用户',
    });
    const user = await service.requireUserFromAuthorization(
      `Bearer ${loginResponse.data.token}`,
    );

    expect(loginResponse.data.authMode).toBe('mock');
    expect(user.id).toBe('u1');
  });

  it('rejects missing bearer token', async () => {
    const service = new AuthService(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );

    await expect(service.requireUserFromAuthorization()).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('uses preference birth place when resolving profile completion', () => {
    const service = new AuthService(
      {} as never,
      {} as never,
      {} as never,
      { isMembershipActive: jest.fn(() => false) } as never,
      {} as never,
    );
    const user = {
      id: 'u1',
      openid: 'mock_openid',
      unionid: null,
      phone: null,
      phoneVerifiedAt: null,
      nickname: '测试用户',
      avatarUrl: null,
      birthday: '1990-01-01',
      birthTime: '08:30',
      gender: 'female',
      zodiac: '摩羯座',
      baziSummary: null,
      fiveElements: null,
      preferencesJson: {
        birthPlace: '杭州',
      },
      vipStatus: 'inactive',
      vipExpiredAt: null,
      lastLoginProvider: 'mock',
    };

    expect(service.serializeUser(user as never).birthPlace).toBe('杭州');
    expect(service.isProfileCompleted(user as never)).toBe(true);
    expect(
      service.isProfileCompleted({
        ...user,
        preferencesJson: {},
      } as never),
    ).toBe(false);
  });

  it('logs in with a verified phone code and masks phone in profile', async () => {
    const savedUser = {
      id: 'u2',
      openid: null,
      unionid: null,
      phone: '13800138000',
      phoneVerifiedAt: new Date('2026-05-09T00:00:00.000Z'),
      nickname: '用户8000',
      avatarUrl: null,
      birthday: null,
      birthTime: null,
      gender: 'unknown',
      zodiac: null,
      baziSummary: null,
      fiveElements: null,
      preferencesJson: null,
      vipStatus: 'inactive',
      vipExpiredAt: null,
      lastLoginProvider: 'phone',
    };
    const userRepo = {
      findOne: jest.fn(async ({ where }) =>
        where.phone === '13800138000' ? null : null,
      ),
      create: jest.fn((input) => ({ ...savedUser, ...input })),
      save: jest.fn(async (input) => ({ ...savedUser, ...input, id: 'u2' })),
    };
    const redis = {
      set: jest.fn(async () => true),
      get: jest.fn(async () => 'u2'),
    };
    const config = {
      get: jest.fn((_key: string, fallback?: string) => fallback),
    };
    const entitlements = {
      isMembershipActive: jest.fn(() => false),
    };
    const smsCodes = {
      sendCode: jest.fn(),
      verifyCode: jest.fn(),
    };
    const service = new AuthService(
      userRepo as never,
      redis as never,
      config as never,
      entitlements as never,
      smsCodes as never,
    );

    const loginResponse = await service.loginWithPhone({
      phone: '+86 13800138000',
      code: '123456',
    });

    expect(smsCodes.verifyCode).toHaveBeenCalledWith({
      phone: '13800138000',
      scene: 'login',
      code: '123456',
    });
    expect(loginResponse.data.authMode).toBe('phone');
    expect(loginResponse.data.user.phoneMasked).toBe('138****8000');
    expect(loginResponse.data.user.openid).toBeNull();
  });
});
