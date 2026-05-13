import { Logger } from '@nestjs/common';

type ConfigReader = {
  get<T = string>(key: string, defaultValue?: T): T | undefined;
};

const WEAK_SECRET_VALUES = new Set([
  'admin',
  'password',
  '123456',
  'fortune123',
  'root123456',
  'change-this-password',
  'change-this-root-password',
  'change-this-mysql-password',
  'change-this-mysql-root-password',
  'change-this-admin-password',
  'change-this-pepper',
  'change-this-sms-pepper',
  'fortune-hub-phone-code',
]);

const logger = new Logger('ProductionConfig');

export function assertProductionConfig(config: ConfigReader) {
  const issues = collectProductionConfigIssues(config);

  if (issues.length) {
    throw new Error(
      [
        'Production configuration is incomplete or unsafe:',
        ...issues.map((issue) => `- ${issue}`),
      ].join('\n'),
    );
  }
}

export function collectProductionConfigIssues(config: ConfigReader) {
  if (!isProduction(config)) {
    return [];
  }

  const issues: string[] = [];
  const paymentMode = readConfig(config, 'PAYMENT_MODE', 'disabled');

  requireValue(config, issues, 'ADMIN_USERNAME', '管理员账号 ADMIN_USERNAME 未配置');
  requireStrongValue(config, issues, 'ADMIN_PASSWORD', '管理员密码 ADMIN_PASSWORD 未配置或使用弱默认值');
  requireStrongValue(config, issues, 'MYSQL_PASSWORD', '数据库密码 MYSQL_PASSWORD 未配置或使用弱默认值');
  requireStrongValue(config, issues, 'SMS_CODE_PEPPER', '短信验证码 pepper 未配置或使用弱默认值');
  requireHttpsUrl(config, issues, 'PUBLIC_API_BASE_URL', 'PUBLIC_API_BASE_URL 必须是正式 HTTPS 地址');
  requireHttpsUrl(config, issues, 'FILE_SERVICE_BASE_URL', 'FILE_SERVICE_BASE_URL 必须是正式 HTTPS 地址');
  requireHttpsOrigins(config, issues, 'CORS_ORIGIN', 'CORS_ORIGIN 必须配置为正式 HTTPS 来源');
  requireValue(config, issues, 'WECHAT_APP_ID', 'WECHAT_APP_ID 未配置，正式微信登录和小程序码不可用');
  requireValue(config, issues, 'WECHAT_APP_SECRET', 'WECHAT_APP_SECRET 未配置，正式微信登录和小程序码不可用');

  if (readConfig(config, 'DB_SYNCHRONIZE', 'false') === 'true') {
    issues.push('生产环境禁止启用 DB_SYNCHRONIZE=true，请使用 migration 发布结构变更');
  }

  if (readConfig(config, 'WECHAT_LOGIN_ALLOW_MOCK', 'false') === 'true') {
    issues.push('生产环境禁止启用 WECHAT_LOGIN_ALLOW_MOCK=true');
  }

  if (readConfig(config, 'SMS_PROVIDER') === 'mock') {
    issues.push('生产环境禁止配置 SMS_PROVIDER=mock');
  }

  if (readConfig(config, 'SMS_MOCK_ENABLED', 'false') === 'true') {
    issues.push('生产环境禁止配置 SMS_MOCK_ENABLED=true');
  }

  if (readConfig(config, 'SMS_MOCK_CODE') === '123456') {
    issues.push('生产环境禁止使用默认 SMS_MOCK_CODE=123456');
  }

  if (paymentMode === 'mock') {
    issues.push('生产环境禁止配置 PAYMENT_MODE=mock');
  }

  if (!['disabled', 'wechat'].includes(paymentMode)) {
    issues.push('PAYMENT_MODE 只能为 disabled 或 wechat，生产环境不能使用 mock');
  }

  if (paymentMode === 'wechat') {
    requireValue(config, issues, 'WECHAT_PAY_MCH_ID', '微信支付商户号 WECHAT_PAY_MCH_ID 未配置');
    requireStrongValue(config, issues, 'WECHAT_PAY_API_V3_KEY', '微信支付 API v3 key 未配置或过弱');
    requireValue(config, issues, 'WECHAT_PAY_SERIAL_NO', '微信支付商户证书序列号 WECHAT_PAY_SERIAL_NO 未配置');
    requireValue(
      config,
      issues,
      'WECHAT_PAY_NOTIFY_URL',
      '微信支付回调地址 WECHAT_PAY_NOTIFY_URL 未配置',
    );

    if (
      !readConfig(config, 'WECHAT_PAY_PRIVATE_KEY') &&
      !readConfig(config, 'WECHAT_PAY_PRIVATE_KEY_PATH')
    ) {
      issues.push('微信支付商户私钥 WECHAT_PAY_PRIVATE_KEY 或 WECHAT_PAY_PRIVATE_KEY_PATH 至少配置一个');
    }
  }

  return issues;
}

export function warnIfUnsafeDevelopmentConfig(config: ConfigReader) {
  if (isProduction(config)) {
    return;
  }

  if (readConfig(config, 'DB_SYNCHRONIZE', 'false') === 'true') {
    logger.warn('DB_SYNCHRONIZE=true is enabled. Use only for local throwaway databases.');
  }
}

function isProduction(config: ConfigReader) {
  return readConfig(config, 'NODE_ENV', 'development') === 'production';
}

function requireValue(
  config: ConfigReader,
  issues: string[],
  key: string,
  message: string,
) {
  if (!readConfig(config, key)) {
    issues.push(message);
  }
}

function requireStrongValue(
  config: ConfigReader,
  issues: string[],
  key: string,
  message: string,
) {
  const value = readConfig(config, key);

  if (!value || WEAK_SECRET_VALUES.has(value.toLowerCase())) {
    issues.push(message);
  }
}

function requireHttpsUrl(
  config: ConfigReader,
  issues: string[],
  key: string,
  message: string,
) {
  const value = readConfig(config, key);

  if (!value) {
    issues.push(message);
    return;
  }

  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || isLocalhost(url.hostname)) {
      issues.push(message);
    }
  } catch {
    issues.push(message);
  }
}

function requireHttpsOrigins(
  config: ConfigReader,
  issues: string[],
  key: string,
  message: string,
) {
  const value = readConfig(config, key);
  const origins = value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (!origins.length) {
    issues.push(message);
    return;
  }

  for (const origin of origins) {
    try {
      const url = new URL(origin);
      if (url.protocol !== 'https:' || isLocalhost(url.hostname)) {
        issues.push(message);
        return;
      }
    } catch {
      issues.push(message);
      return;
    }
  }
}

function isLocalhost(hostname: string) {
  const normalized = hostname.toLowerCase();
  return normalized === 'localhost' || normalized === '127.0.0.1' || normalized === '::1';
}

function readConfig(config: ConfigReader, key: string, fallback = '') {
  const value = config.get<string>(key, fallback);

  if (typeof value === 'string') {
    return value.trim();
  }

  if (value == null) {
    return '';
  }

  return String(value).trim();
}
