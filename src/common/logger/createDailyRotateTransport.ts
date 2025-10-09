import DailyRotateFile from 'winston-daily-rotate-file';
import * as winston from 'winston';
import { utilities } from 'nest-winston';

/**
 * 控制台日志传输器
 * 用于将日志输出到控制台
 * @level info - 日志级别为info
 * @format 结合了时间戳和nest格式化输出
 */
export const consoleTransport = new winston.transports.Console({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    // 在控制台添加 ms 函数运行时间
    winston.format.ms(),
    utilities.format.nestLike('Winston'),
  ),
});

/**
 * 创建每日旋转日志传输器
 * 用于将日志输出到文件，文件按日期进行旋转
 * @param level 日志级别，例如 'info', 'warn', 'error' 等
 * @param filename 日志文件名，例如 'application', 'error' 等
 * @returns 配置好的 DailyRotateFile 实例
 */
export function createDailyRotateTransport(level: string, filename: string) {
  return new DailyRotateFile({
    datePattern: 'YYYY-MM-DD-HH',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    level,
    filename: `logs/${filename}-%DATE%.log`,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.simple(),
    ),
  });
}
