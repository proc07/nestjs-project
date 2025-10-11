import { UseInterceptors } from '@nestjs/common';
import { SerializeInterceptor } from '../interceptors/serialize.interceptor';

export interface ClassConstructor {
  new (...args: any[]): any;
}
// 定制 @Serialize 装饰器，序列化拦截器
export function Serialize(dto: ClassConstructor) {
  return UseInterceptors(new SerializeInterceptor(dto));
}
