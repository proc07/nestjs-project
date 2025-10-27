import {
  Controller,
  Get,
  Inject,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { CACHE_MANAGER, CacheInterceptor } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from './database/prisma/prisma.service';
import { User as UserPrisma } from '@prisma/client';
import { UserService } from './user/user.service';

import { User as UserTypeOrm } from './user/user.entity';
import { PolicyGuard } from './common/guards/policy.guard';

@Controller()
// 将 CacheInterceptor 应用于整个 Controller 的所有路由
@UseInterceptors(CacheInterceptor)
export class AppController {
  constructor(
    @InjectRedis() private readonly redis: Redis,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private prisma: PrismaService,
    private userService: UserService,
  ) {}

  // @Get('/prisma/users')
  async users(): Promise<UserPrisma[]> {
    return await this.prisma.user.findMany({});
  }

  @Get('/typeorm/users')
  async usersAll(): Promise<UserTypeOrm[] | null> {
    return await this.userService.findAll();
  }

  @Get()
  async getHello(): Promise<{ redisData: string }> {
    await this.redis.set('key--2', 'Redis data!');
    const redisData = await this.redis.get('key');
    return { redisData: redisData || 'No data' };
  }

  @Get('/config')
  async getConfig(): Promise<object> {
    // CacheInterceptor 会根据路由路径自动缓存数据，不会再重复执行函数
    console.log('Fetching from cache...');
    await this.cacheManager.set('config', { a: 1, b: 2, c: '333' });
    const cacheData = await this.cacheManager.get('config');
    return cacheData as object;
  }

  @UseGuards(PolicyGuard)
  @Get('/test')
  test() {
    return 'test';
  }
}
