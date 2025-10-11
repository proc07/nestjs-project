import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
// 自定义装饰器，用于标记路由为公共路由
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
