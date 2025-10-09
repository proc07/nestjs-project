import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import requestIp from 'request-ip';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger();

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}
  catch(exception: unknown, host: ArgumentsHost) {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const msg: unknown =
      exception instanceof Error
        ? exception['response']
        : 'Internal Server Error';

    const responseBody = {
      headers: request.headers,
      query: request.query,
      body: request.body as Record<string, unknown>,
      params: request.params,
      timestamp: new Date().toISOString(),
      // 还可以加入一些用户信息
      // IP信息
      ip: requestIp.getClientIp(request),
      exceptioin: exception instanceof Error ? exception.name : 'Unknown Error',
      error: msg,
    };

    this.logger.error('[toimc]', responseBody);
    //  使用适配器发送响应，兼容 Express 和 Fastify
    httpAdapter.reply(response, responseBody, httpStatus);
  }
}
