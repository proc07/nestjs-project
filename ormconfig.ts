import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

function toBoolean(value: string): boolean {
  return value === 'true';
}

export function getEnv(env: string): Record<string, string> | undefined {
  if (fs.existsSync(env)) {
    try {
      // 明确指定读取的是字符串
      const envContent = fs.readFileSync(env, 'utf8');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const parsedEnv = dotenv.parse(envContent) as Record<string, string>;
      return parsedEnv;
    } catch (error) {
      // 妥善处理错误
      console.error('Error loading or parsing .env file:', error);
      throw new Error(`Failed to load env file: ${(error as Error).message}`);
    }
  }
}

export function buildConnectionOptions() {
  const defaultConfig = getEnv('.env');
  const envConfig = getEnv(`.env.${process.env.NODE_ENV || 'development'}`);

  const config = { ...defaultConfig, ...envConfig };
  return {
    type: config['DB_TYPE'],
    host: config['DB_HOST'],
    port: config['DB_PORT'],
    username: config['DB_USERNAME'],
    password: config['DB_PASSWORD'],
    database: config['DB_DATABASE'],
    entities: [__dirname + '/**/*.entity{.ts,.js}'],
    synchronize: toBoolean(config['DB_SYNC']),
    autoLoadEntities: toBoolean(config['DB_AUTOLOAD']),
  } as TypeOrmModuleOptions;
}

export default new DataSource({
  ...buildConnectionOptions(),
} as DataSourceOptions);
