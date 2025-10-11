import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { map, Observable } from 'rxjs';

@Injectable()
export class SerializeInterceptor implements NestInterceptor {
  constructor(private dto: any) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    console.log('pre -> interceptors');
    return next.handle().pipe(
      map((data) => {
        console.log('post -> interceptors', this.dto);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        return plainToInstance(this.dto, data, {
          // 所有经过拦截器的接口都需要配置下面2个 class 类属性
          // @Expose 需要暴露的属性
          // @Exclude 不需要暴露的属性
          excludeExtraneousValues: true,
          // 进行隐式的类型转换
          enableImplicitConversion: true,
        });
      }),
    );
  }
}
