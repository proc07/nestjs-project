import { Inject, Injectable } from '@nestjs/common';
import { CreateRoleDto, PermissionType } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Role as RolePrisma } from '@prisma/client';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { CreatePolicyDto } from 'src/policy/dto/create-policy.dto';

@Injectable()
export class RoleService {
  constructor(
    //@Inject(PRISMA_DATABASE) private prismaClient: PrismaClient
    private readonly prisma: PrismaService,
  ) {}

  async create(createRoleDto: CreateRoleDto) {
    return await this.prisma.$transaction(async (prisma) => {
      const {
        permissions = [],
        policies = [],
        menus = [],
        ...restData
      } = createRoleDto;

      const rolePermissions = {
        create: permissions.map((permission) => ({
          permission: {
            // 先去查询是否存在该 name 权限，不存在则创建
            connectOrCreate: {
              where: {
                name: permission.name,
              },
              create: {
                ...permission,
              },
            },
          },
        })),
      };

      const roleMenus = {
        create: menus.map((menu) => ({
          Menu: {
            // 不需要创建，直接关联
            connect: menu?.id
              ? {
                  id: menu.id,
                }
              : {
                  name: menu.name,
                },
          },
        })),
      };

      const rolePolicies = {
        create: policies.map((policy: CreatePolicyDto & { encode: string }) => {
          let whereCond: { id: number } | { encode: string };

          if (policy.id) {
            whereCond = {
              id: policy.id,
            };
          } else {
            const encode = Buffer.from(JSON.stringify(policy)).toString(
              'base64',
            );
            whereCond = { encode };
            policy.encode = encode;
          }

          return {
            policy: {
              connectOrCreate: {
                where: whereCond,
                create: {
                  ...policy,
                },
              },
            },
          };
        }),
      };

      // role -> role_permissions -> permission 表
      return prisma.role
        .create({
          data: {
            ...restData,
            RolePermissions: rolePermissions,
            // warn: 不能将类型“{ create: { policy: { connectOrCreate: { where: Record<string, any>; create: { id?: number; type: null; effect: "can" | "cannot"; action: string; subject: string; fields?: FeildType; conditions?: FeildType; args?: FeildType; }; }; }; }[]; }”分配给类型“RolePolicyUncheckedCreateNestedManyWithoutRoleInput | RolePolicyCreateNestedManyWithoutRoleInput | undefined”。
            RolePolicies: rolePolicies,
            RoleMenus: roleMenus,
          },
        })
        .catch((err) => console.log('创建角色失败', err));
    });
  }

  async findAll(page: number, limit: number): Promise<RolePrisma[]> {
    return await this.prisma.role.findMany({
      skip: (page - 1) * limit, // 跳过的数量
      take: limit, // take 取跳过的数量
    });
  }

  async findOne(id: number): Promise<RolePrisma | null> {
    return await this.prisma.role.findUnique({
      where: {
        id,
      },
      // 关联查询角色关联的权限
      include: {
        RolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  async findAllByIds(ids: number[]) {
    return await this.prisma.role.findMany({
      where: {
        id: {
          // (批量查询已知 ID 的记录) in 是一个过滤条件操作符，用于匹配「字段值存在于指定数组中」的记录
          // 补充：反向操作 notIn
          in: ids,
        },
      },
      // 关联查询角色关联的权限
      include: {
        RolePermissions: {
          include: {
            permission: true,
          },
        },
        RolePolicies: {
          include: {
            policy: true,
          },
        },
      },
    });
  }

  async update(id: number, updateRoleDto: UpdateRoleDto): Promise<RolePrisma> {
    return await this.prisma.$transaction(async (prisma) => {
      const {
        menus = [],
        permissions = [],
        policies = [],
        ...restData
      } = updateRoleDto;
      const data: Record<string, any> = {};

      if (permissions.length) {
        data.RolePermissions = {
          deleteMany: {},
          create: permissions.map((permission) => ({
            permission: {
              // 先去查询是否存在该 name 权限，不存在则创建
              connectOrCreate: {
                where: {
                  name: permission.name,
                },
                create: {
                  ...permission,
                },
              },
            },
          })),
        };
      }

      if (menus.length) {
        data.RoleMenus = {
          deleteMany: {},
          create: menus.map((menu) => ({
            Menu: {
              // 不需要创建，直接关联
              connect: menu?.id
                ? {
                    id: menu.id,
                  }
                : {
                    name: menu.name,
                  },
            },
          })),
        };
      }

      if (policies.length) {
        const createArr: Record<string, any> = [];
        for (let i = 0; i < policies.length; i++) {
          const policy = policies[i];

          let whereCond: { id: number } | { encode: string };
          let policyData = policy;

          if (policy.id) {
            whereCond = {
              id: policy.id,
            };
            // @ts-ignore
            policyData = await this.prisma.policy.findUnique({
              where: {
                id: policy.id,
              },
            });
          } else {
            const encode = Buffer.from(JSON.stringify(policy)).toString(
              'base64',
            );
            whereCond = { encode };
            console.log('encode', encode);
            // @ts-ignore
            policy.encode = encode;
            // @ts-ignore
            policyData = policy;
          }

          createArr.push({
            policy: {
              connectOrCreate: {
                where: whereCond,
                create: {
                  ...policyData,
                },
              },
            },
          });
        }
        data.RolePolicies = {
          deleteMany: {},
          create: createArr,
        };
      }

      return await prisma.role
        .update({
          where: {
            id,
          },
          data: {
            ...restData,
            ...data,
          },
        })
        .catch((err) => {
          console.log(err);
          return err;
        });
    });
  }

  async remove(id: number): Promise<RolePrisma> {
    return this.prisma.$transaction(async (prisma) => {
      // 先删除角色关联的权限、策略、菜单
      await prisma.role.update({
        where: {
          id,
        },
        data: {
          RolePermissions: {
            deleteMany: {},
          },
          RolePolicies: {
            deleteMany: {},
          },
          RoleMenus: {
            deleteMany: {},
          },
        },
      });
      // 最后删除角色
      return await prisma.role.delete({
        where: {
          id,
        },
      });
    });
  }
}
