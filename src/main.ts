import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AllExceptionFilter } from './common/filters/all-exception.filter';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');
  // 替换后的日志实例将接管整个应用的日志输出
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  // all exception filter 来统一处理
  app.useGlobalFilters(new AllExceptionFilter(app.get(HttpAdapterHost)));

  app.enableCors();

  app.useGlobalPipes(
    new ValidationPipe({
      // 自动将请求中的数据类型转换为 DTO（数据传输对象）中声明的类型。例如，字符串 "123" 会自动转换为数字 123 ，布尔字符串 "true" 会变成 true 。
      transform: true,
      // 只允许 DTO 中定义的属性通过验证，其他未定义的属性会被自动剔除。这样可以防止前端传递多余或非法字段。
      whitelist: true,
      // 如果请求体中包含 DTO 未定义的属性，则直接抛出异常（400 错误），而不是仅仅剔除这些属性。这样可以更严格地控制输入数据，提升安全性。
      // forbidNonWhitelisted: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap().catch((err) => console.log(err));
