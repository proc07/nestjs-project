import { Inject, Injectable } from '@nestjs/common';
import { CreateRoleDto, PermissionType } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Role as RolePrisma } from '@prisma/client';
import { PrismaService } from 'src/database/prisma/prisma.service';

@Injectable()
export class RoleService {
  constructor(
    //@Inject(PRISMA_DATABASE) private prismaClient: PrismaClient
    private readonly prisma: PrismaService,
  ) {}

  async create(createRoleDto: CreateRoleDto) {
    return await this.prisma.$transaction(async (prisma) => {
      const { permissions, ...restData } = createRoleDto;
      // role -> role_permissions -> permission 表
      return prisma.role.create({
        data: {
          ...restData,
          RolePermissions: {
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
          },
        },
      });
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
      },
    });
  }

  async update(id: number, updateRoleDto: UpdateRoleDto): Promise<RolePrisma> {
    return await this.prisma.role.update({
      where: {
        id,
      },
      data: updateRoleDto,
    });
  }

  async remove(id: number): Promise<RolePrisma> {
    return await this.prisma.role.delete({
      where: {
        id,
      },
    });
  }
}
