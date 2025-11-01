import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { LogsModule } from './common/logger/logs.module';
import { RedisModule } from '@nestjs-modules/ioredis';
import { CacheModule } from '@nestjs/cache-manager';
import { PrismaModule } from './database/prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from './user/user.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { RoleModule } from './role/role.module';
import { PermissionModule } from './permission/permission.module';
import { PolicyModule } from './policy/policy.module';
import { SharedModule } from './modules/shared/shared.module';
import { MenuModule } from './modules/menu/menu.module';

const envFilePath = `.env.${process.env.NODE_ENV || 'development'}`;

@Module({
  imports: [
    PrismaModule,
    TypeOrmModule.forRootAsync({
      name: 'mysql',
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) =>
        ({
          type: configService.get('DB_TYPE'),
          host: configService.get('DB_HOST'),
          port: +configService.get('DB_PORT'),
          username: configService.get('DB_USERNAME'),
          password: configService.get('DB_PASSWORD'),
          database: configService.get('DB_DATABASE'),
          entities: [User],
          synchronize: true,
        }) as TypeOrmModuleOptions,
      inject: [ConfigService],
    }),
    // TypeOrmModule.forRootAsync({
    //   name: 'mysql2',
    //   imports: [ConfigModule],
    //   useFactory: (configService: ConfigService) =>
    //     ({
    //       type: configService.get('DB_TYPE'),
    //       host: configService.get('DB_HOST'),
    //       port: 3307,
    //       username: configService.get('DB_USERNAME'),
    //       password: configService.get('DB_PASSWORD'),
    //       database: configService.get('DB_DATABASE'),
    //       entities: [User],
    //       synchronize: true,
    //     }) as TypeOrmModuleOptions,
    //   inject: [ConfigService],
    // }),
    // MongooseModule.forRoot('mongodb://root:example@localhost:27017/nest'),

    // cache-manager 缓存模块(非持久化、作为你应用代码的一部分运行)
    CacheModule.register({
      isGlobal: true,
      ttl: 0,
    }),
    RedisModule.forRoot({
      type: 'single',
      url: 'redis://localhost:6379',
      options: {
        username: 'default',
        // password: '123456',
      },
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [envFilePath, '.env'],
    }),

    // 业务模块
    UserModule,
    LogsModule,
    AuthModule,
    RoleModule,
    PermissionModule,
    PolicyModule,
    SharedModule,
    MenuModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
