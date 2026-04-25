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
      gender: 'unknown',
      zodiac: null,
      baziSummary: null,
      fiveElements: null,
      preferencesJson: null,
      vipStatus: 'inactive',
      vipExpiredAt: null,
    };
    const userRepo = {
      findOne: jest.fn(async ({ where }) => (where.id === 'u1' ? savedUser : null)),
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
    const service = new AuthService(userRepo as never, redis as never, config as never);

    const loginResponse = await service.login({
      code: 'dev-login',
      nickname: '测试用户',
    });
    const user = await service.requireUserFromAuthorization(
      `Bearer ${loginResponse.data.token}`,
    );

    expect(loginResponse.data.authMode).toBe('mock');
    expect(user.id).toBe('u1');
  });

  it('rejects missing bearer token', async () => {
    const service = new AuthService({} as never, {} as never, {} as never);

    await expect(service.requireUserFromAuthorization()).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
