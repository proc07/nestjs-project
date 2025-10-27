import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { CaslAbilityService, IPolicy } from '../../policy/casl-ability.service';
import { ROLE_PERMISSION_KEY } from '../decorators/role-permission.decorator';
import { Reflector } from '@nestjs/core';
import { PermissionService } from 'src/permission/permission.service';
import { UserService } from 'src/user/user.service';
import { RoleService } from 'src/role/role.service';
import { User } from '@prisma/client';
import { SharedService } from 'src/modules/shared/shared.service';
import { plainToInstance } from 'class-transformer';
import { CreateUserDto } from 'src/user/dto/create-user.dto';

const mapSubjectToClass = (subject: string) => {
  switch (subject) {
    case 'user':
      return CreateUserDto;
    default:
      return subject;
  }
};

@Injectable()
export class PolicyGuard implements CanActivate {
  // reflector 用于获取装饰器元数据
  constructor(
    private readonly caslAbilityService: CaslAbilityService,
    private readonly reflector: Reflector,
    private permissionService: PermissionService,
    private userService: UserService,
    private roleService: RoleService,
    private sharedService: SharedService,
  ) {}
  // 通过 CaslAbilityService 获取用户已有权限的实例。
  // 通过 ability 实例上的 can cannot 来判断用户是否有权限。
  // 接口权限 -> policy 进行关联，读取数据库中的接口关联的 policy 与上面的 ability 之间进行逻辑判断，
  // 从而对数据库实现数据权限控制。
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
    // 1. Guard -> 装饰器 permission name
    const rights = `${cls}:${handler}`;

    const req = context.switchToHttp().getRequest<Request>();
    const { username } = (req as any).user as User;
    if (!username) {
      return false;
    }

    // 2. permission -> Policy 需要访问接口的数据权限
    const permission = await this.permissionService.findByName(rights);
    // 3. Policy -> subject 缩小 RolePolicay 的查询访问
    const subjects = permission?.PermissionPolicies?.map(
      (item) => item.policy.subject,
    );
    if (!permission?.PermissionPolicies) {
      return false;
    }
    console.log(
      'permission?.PermissionPolicies===',
      permission?.PermissionPolicies,
    );
    // console.log('policy.guard: subjects', subjects);
    // 4. username -> User -> Role -> Policy & subject 用户已分配接口权限
    const user = await this.userService.findUserOne(username);
    const roleIds = user?.Roles?.map((role) => role.roleId) || [];
    const rolePolicies = await this.roleService.findAllByIds(roleIds);
    // console.log('policy.guard: rolePolicies', rolePolicies);

    const rolePolicySubjects = rolePolicies?.reduce((prev, cur) => {
      const policySubjects = cur.RolePolicies?.filter((policy) => {
        return subjects?.includes(policy.policy.subject);
      });
      return [...prev, ...policySubjects];
    }, []);
    console.log('policy.guard: rolePolicySubjects', rolePolicySubjects);

    const polices: IPolicy[] = [
      ...rolePolicySubjects.map((item) => ({
        ...item.policy,
        // fix ts type error
        effect: item.policy.effect as 'can' | 'cannot',
        fields: item.policy.fields as string[] | string,
        conditions: item.policy.conditions as string | Record<string, any>,
        args: item.policy.args as string[] | string,
      })),
      // {
      //   type: 0,
      //   effect: 'can',
      //   action: 'read',
      //   subject: 'Article',
      //   fields: ['title', 'description', 'content'],
      //   conditions: {
      //     private: false,
      //   },
      // },
      // {
      //   type: 1,
      //   effect: 'can',
      //   action: 'read',
      //   subject: 'Article',
      //   conditions: {
      //     $nor: [{ private: true }, { authorId: 11 }],
      //   },
      // },
      // {
      //   type: 2,
      //   effect: 'can',
      //   action: 'read',
      //   subject: 'Article',
      //   conditions: `({ authorId }) => authorId === user.id`,
      //   args: ['user'],
      // },
    ];
    // @ts-ignore
    user.rolePolicies = rolePolicies;
    // @ts-ignore
    delete user.password;
    // @ts-ignore
    user.polices = polices;
    // @ts-ignore
    user.roleIds = roleIds;
    // @ts-ignore
    user.permissions = user?.Roles?.reduce((prev, cur) => {
      return [...prev, ...cur.role.RolePermissions];
    }, []);
    console.log('policy.guard: user', user);

    if (polices.length === 0) {
      // 接口不需要任何数据权限
      return true;
    }

    const abilities = this.caslAbilityService.buildAbility(polices, [
      user,
      req,
      // 可以拿到当前路由上的 handle 和 class 上的装饰器元数据
      this.reflector,
    ]);
    console.log('abilities:', abilities);

    // 假设一开始所有权限都通过。
    let allPermissionsGranted = true;
    const tempPermissionsPolicy = [...permission.PermissionPolicies];

    // 遍历每个权限策略（policy）提取 action、subject、fields。
    for (const Policy of tempPermissionsPolicy) {
      const { action, subject, fields } = Policy.policy;
      // 初始化当前策略的权限校验结果。
      let permissionsGranted = false;

      // 遍历所有（abilities）进行权限校验
      for (const ability of abilities) {
        // @ts-ignore 对每个 ability ，通过 sharedService.getSubject(subject, user) 获取当前 subject 对象。
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const data = await this.sharedService.getSubject(subject, user);
        // subjectObj 只返回数据，下面 can 函数中需要的是 model 的class（需要进行转换）
        const subjectClass = mapSubjectToClass(subject);
        const subjectObj =
          typeof subjectClass === 'string'
            ? subjectClass
            : plainToInstance(subjectClass, data);

        if (fields) {
          // 如果 fields 是非空数组，则判断数组中的每个字段是否都拥有权限（ every ）。
          if (Array.isArray(fields) && fields.length > 0) {
            permissionsGranted = fields.every((field: string) =>
              ability.can(action, subjectObj, field),
            );
          } else if (fields['data']) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            permissionsGranted = fields['data']?.every((field) =>
              ability.can(action, subjectObj, field),
            );
          }
        } else {
          // 如果没有 fields ，则直接判断是否拥有对 subject 的 action 权限。
          permissionsGranted = ability.can(action, subjectObj);
        }

        if (permissionsGranted) {
          break;
        }
      }

      if (permissionsGranted) {
        const index = tempPermissionsPolicy.indexOf(Policy);
        if (index > -1) {
          tempPermissionsPolicy.splice(index, 1);
        }
      }
    }

    if (tempPermissionsPolicy.length !== 0) {
      allPermissionsGranted = false;
    }

    return allPermissionsGranted;
  }
}
