import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLE_PERMISSION_KEY } from '../decorators/role-permission.decorator';
import { UserService } from 'src/user/user.service';
import { User } from '@prisma/client';
import { RoleService } from 'src/role/role.service';

@Injectable()
export class RolePermissionGuard implements CanActivate {
  // reflector 用于获取装饰器元数据
  constructor(
    private readonly reflector: Reflector,
    private readonly userService: UserService,
    private readonly roleService: RoleService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const classPermission = this.reflector.get<string[]>(
      ROLE_PERMISSION_KEY,
      context.getClass(),
    );
    const handlerPermission = this.reflector.get<string[]>(
      ROLE_PERMISSION_KEY,
      context.getHandler(),
    );

    const cls = Array.isArray(classPermission)
      ? classPermission.join('')
      : classPermission;
    const handler = Array.isArray(handlerPermission)
      ? handlerPermission.join('')
      : handlerPermission;

    const rights = `${cls}:${handler}`;
    console.log('role-permission.guard: rights', rights);

    // this.userService
    const req = context.switchToHttp().getRequest<Request>();
    const { username } = (req as any).user as User;

    const user = await this.userService.findUserOne(username);
    console.log('role-permission.guard: user', user);
    if (!user) {
      return false;
    }
    const rolesData = await this.roleService.findAllByIds(
      user.Roles.map((role) => role.roleId),
    );
    console.log('role-permission.guard: role', rolesData);

    const rolePermissions = rolesData
      .map((role) => role.RolePermissions.map((r) => r.permission.name))
      .flat();
    console.log('role-permission.guard: permission', rolePermissions);
    return rolePermissions.includes(rights);
  }
}
