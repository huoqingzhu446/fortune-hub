import {
  assertProductionConfig,
  collectProductionConfigIssues,
} from './production-config.validator';

function config(values: Record<string, string>) {
  return {
    get: jest.fn((key: string, fallback?: string) => values[key] ?? fallback),
  };
}

describe('production config validator', () => {
  it('skips validation outside production', () => {
    const issues = collectProductionConfigIssues(
      config({
        NODE_ENV: 'development',
        ADMIN_PASSWORD: 'fortune123',
        SMS_PROVIDER: 'mock',
      }),
    );

    expect(issues).toEqual([]);
  });

  it('reports unsafe production defaults', () => {
    const issues = collectProductionConfigIssues(
      config({
        NODE_ENV: 'production',
        ADMIN_USERNAME: 'admin',
        ADMIN_PASSWORD: 'fortune123',
        MYSQL_PASSWORD: 'fortune123',
        SMS_PROVIDER: 'mock',
        SMS_MOCK_CODE: '123456',
        DB_SYNCHRONIZE: 'true',
        PAYMENT_MODE: 'mock',
        PUBLIC_API_BASE_URL: 'http://localhost:3001/api/v1',
        FILE_SERVICE_BASE_URL: 'http://www.yuanlian.xin:3000/api',
      }),
    );

    expect(issues).toEqual(
      expect.arrayContaining([
        expect.stringContaining('管理员密码'),
        expect.stringContaining('数据库密码'),
        expect.stringContaining('DB_SYNCHRONIZE'),
        expect.stringContaining('SMS_PROVIDER=mock'),
        expect.stringContaining('PAYMENT_MODE=mock'),
        expect.stringContaining('PUBLIC_API_BASE_URL'),
        expect.stringContaining('FILE_SERVICE_BASE_URL'),
      ]),
    );
  });

  it('accepts safe production config with payment disabled', () => {
    expect(() =>
      assertProductionConfig(
        config({
          NODE_ENV: 'production',
          ADMIN_USERNAME: 'ops-admin',
          ADMIN_PASSWORD: 'StrongerAdminPassword-2026',
          MYSQL_PASSWORD: 'StrongMysqlPassword-2026',
          SMS_CODE_PEPPER: 'StrongSmsPepper-2026',
          PUBLIC_API_BASE_URL: 'https://fortune.example.com/api/v1',
          FILE_SERVICE_BASE_URL: 'https://fortune.example.com/api',
          CORS_ORIGIN: 'https://fortune.example.com',
          WECHAT_APP_ID: 'wx123',
          WECHAT_APP_SECRET: 'secret',
          PAYMENT_MODE: 'disabled',
          DB_SYNCHRONIZE: 'false',
          SMS_PROVIDER: 'aliyun',
          SMS_MOCK_ENABLED: 'false',
        }),
      ),
    ).not.toThrow();
  });

  it('requires full wechat pay config when payment mode is wechat', () => {
    const issues = collectProductionConfigIssues(
      config({
        NODE_ENV: 'production',
        ADMIN_USERNAME: 'ops-admin',
        ADMIN_PASSWORD: 'StrongerAdminPassword-2026',
        MYSQL_PASSWORD: 'StrongMysqlPassword-2026',
        SMS_CODE_PEPPER: 'StrongSmsPepper-2026',
        PUBLIC_API_BASE_URL: 'https://fortune.example.com/api/v1',
        FILE_SERVICE_BASE_URL: 'https://fortune.example.com/api',
        CORS_ORIGIN: 'https://fortune.example.com',
        WECHAT_APP_ID: 'wx123',
        WECHAT_APP_SECRET: 'secret',
        PAYMENT_MODE: 'wechat',
        DB_SYNCHRONIZE: 'false',
        SMS_PROVIDER: 'aliyun',
        SMS_MOCK_ENABLED: 'false',
        WECHAT_PAY_MCH_ID: '1900000109',
        WECHAT_PAY_API_V3_KEY: 'A1234567890123456789012345678901',
        WECHAT_PAY_SERIAL_NO: '7777777777777777777777777777777777',
      }),
    );

    expect(issues).toEqual(
      expect.arrayContaining([
        expect.stringContaining('WECHAT_PAY_NOTIFY_URL'),
        expect.stringContaining('WECHAT_PAY_PRIVATE_KEY'),
        expect.stringContaining('WECHAT_PAY_PLATFORM_CERT'),
      ]),
    );
  });
});
