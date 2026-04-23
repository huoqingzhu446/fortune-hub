import { existsSync, readFileSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

const rootDir = process.cwd();
const apiDir = path.join(rootDir, 'services', 'api');
const envFiles = [
  path.join(apiDir, '.env'),
  path.join(apiDir, '.env.local'),
];

function parseEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return {};
  }

  const content = readFileSync(filePath, 'utf8');
  const env = {};

  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();

    if (!line || line.startsWith('#')) {
      continue;
    }

    const equalIndex = line.indexOf('=');
    if (equalIndex <= 0) {
      continue;
    }

    const key = line.slice(0, equalIndex).trim();
    const value = line.slice(equalIndex + 1).trim();

    if (!key) {
      continue;
    }

    env[key] = stripWrappingQuotes(value);
  }

  return env;
}

function stripWrappingQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function resolveDockerMysqlPort() {
  const result = spawnSync(
    'docker',
    [
      'inspect',
      'fortune-hub-mysql',
      '--format',
      '{{json .HostConfig.PortBindings}}',
    ],
    {
      cwd: rootDir,
      encoding: 'utf8',
    },
  );

  if (result.status !== 0 || !result.stdout.trim()) {
    return null;
  }

  try {
    const portBindings = JSON.parse(result.stdout.trim());
    const binding = portBindings?.['3306/tcp']?.[0];
    const hostPort = binding?.HostPort;

    return hostPort ? String(hostPort) : null;
  } catch {
    return null;
  }
}

const fileEnv = Object.assign({}, ...envFiles.map(parseEnvFile));
const childEnv = {
  ...process.env,
  ...fileEnv,
};

const dockerMysqlPort = resolveDockerMysqlPort();
const mysqlHost = childEnv.MYSQL_HOST || '127.0.0.1';
const isLocalMysqlHost = mysqlHost === '127.0.0.1' || mysqlHost === 'localhost';

if (isLocalMysqlHost && dockerMysqlPort) {
  childEnv.MYSQL_PORT = dockerMysqlPort;
}

const child = spawn(
  'pnpm',
  ['--filter', '@fortune-hub/api', 'start:dev'],
  {
    cwd: rootDir,
    env: childEnv,
    stdio: 'inherit',
    shell: false,
  },
);

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
