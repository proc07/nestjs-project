import { Injectable } from '@nestjs/common';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { CreatePolicyDto } from 'src/policy/dto/create-policy.dto';

@Injectable()
export class PermissionService {
  constructor(private prisma: PrismaService) {}

  async create(createPermissionDto: CreatePermissionDto) {
    return await this.prisma.$transaction(async (prisma) => {
      const { policies = [], ...restData } = createPermissionDto;

      const permissionPolicy = {
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
                create: { ...policy },
              },
            },
          };
        }),
      };

      return prisma.permission.create({
        data: {
          ...restData,
          PermissionPolicies: permissionPolicy,
        },
      });
    });
  }

  findAll() {
    return `This action returns all permission`;
  }

  findOne(id: number) {
    return this.prisma.permission.findUnique({
      where: { id },
    });
  }

  findByName(name: string) {
    return this.prisma.permission.findUnique({
      where: { name },
      include: {
        PermissionPolicies: {
          include: {
            policy: true,
          },
        },
      },
    });
  }

  async update(id: number, updatePermissionDto: UpdatePermissionDto) {
    return await this.prisma.$transaction(async (prisma) => {
      const { policies = [], ...restData } = updatePermissionDto;

      const updatePermission = await prisma.permission.update({
        where: {
          id,
        },
        data: {
          ...restData,
          PermissionPolicies: {
            // 先删除旧的
            deleteMany: {},
            // 再去创建新的
            create: policies.map(
              (policy: CreatePolicyDto & { encode: string }) => {
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
                      create: { ...policy },
                    },
                  },
                };
              },
            ),
          },
        },
        // 返回的数据包含关联的 PermissionPolicies 表的数据
        include: {
          PermissionPolicies: {
            include: {
              policy: true,
            },
          },
        },
      });

      return updatePermission;
    });
  }

  remove(id: number) {
    return `This action removes a #${id} permission`;
  }
}
