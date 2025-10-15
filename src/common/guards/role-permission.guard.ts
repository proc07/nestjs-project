import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { ROLE_PERMISSION_KEY } from '../decorators/role-permission.decorator';

@Injectable()
export class RolePermissionGuard implements CanActivate {
  // reflector 用于获取装饰器元数据
  constructor(private readonly reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const classPermission = this.reflector.get<string>(
      ROLE_PERMISSION_KEY,
      context.getClass(),
    );
    const handlerPermission = this.reflector.get<string>(
      ROLE_PERMISSION_KEY,
      context.getHandler(),
    );
    console.log('classPermission', classPermission);
    console.log('handlerPermission', handlerPermission);
    return true;
  }
}
