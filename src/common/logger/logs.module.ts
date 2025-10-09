import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import {
  consoleTransport,
  createDailyRotateTransport,
} from './createDailyRotateTransport';

@Module({
  imports: [
    WinstonModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const logOn = configService.get<string>('LOG_ON') === 'true';

        return {
          transports: [
            consoleTransport,
            ...(logOn
              ? [
                  createDailyRotateTransport('info', 'application'),
                  createDailyRotateTransport('warn', 'error'),
                ]
              : []),
          ],
        };
      },
    }),
  ],
})
export class LogsModule {}
