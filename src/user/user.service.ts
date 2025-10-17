import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import argon2 from 'argon2';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { User as UserPrisma, Role, Permission } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

// 默认 user 角色ID
const DEFAULT_ROLE_ID = 1;

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User, 'mysql')
    private readonly userRepository: Repository<User>,
    // @InjectRepository(User, 'mysql2')
    // private readonly userRepository2: Repository<User>,
    private prismaService: PrismaService,
  ) {}

  // typeorm

  // findAll2(): Promise<User[]> {
  //   return this.userRepository2.find();
  // }

  // async create(user: User): Promise<User> {
  //   const { password, ...rest } = user;
  //   return this.userRepository.create({
  //     ...rest,
  //     password: await argon2.hash(password),
  //   });
  // }
  async create(user: User) {
    const { password, ...rest } = user;
    console.log('🚀 create -> user', await argon2.hash(password));
  }

  findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  findOne(id: number): Promise<User | null> {
    return this.userRepository.findOneBy({ id });
  }

  // typeorm
  // findOneByUser(username: string, password?: string): Promise<User | null> {
  //   return this.userRepository.findOneBy({ username, password });
  // }
  // prisma
  async findOneByUser(username: string) {
    return await this.prismaService.user.findUnique({
      where: {
        username,
      },
    });
  }

  async remove(id: number): Promise<void> {
    await this.userRepository.delete(id);
  }

  // -----------------  prsima -------------------------
  async createUser(user: CreateUserDto): Promise<UserPrisma> {
    const { password, roleIds, ...rest } = user;
    const userData = {
      ...rest,
      password: await argon2.hash(password),
    };
    console.log('🚀 create -> data', userData);

    // $transaction 事务操作，确保数据库操作的原子性
    return await this.prismaService.$transaction(async (prisma) => {
      const userRoleIds = roleIds || [DEFAULT_ROLE_ID];
      const validRoleIds: number[] = [];

      for (const roleId of userRoleIds) {
        const role = await prisma.role.findUnique({
          where: {
            id: roleId,
          },
        });
        // 验证角色是否存在
        if (role) {
          validRoleIds.push(roleId);
        }
      }
      // 如果用户没有指定角色，默认分配普通用户角色
      if (validRoleIds.length === 0) {
        validRoleIds.push(DEFAULT_ROLE_ID);
      }

      // 创建用户并关联角色
      return await prisma.user.create({
        data: {
          ...userData,
          Roles: {
            create: validRoleIds.map((roleId) => ({ roleId })),
          },
        },
      });
    });
  }

  async findUserAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<UserPrisma[]> {
    return await this.prismaService.user.findMany({
      take: limit,
      skip: (page - 1) * limit,
    });
  }

  async findUserOne(username: string) {
    return await this.prismaService.user.findUnique({
      where: {
        username,
      },
      include: {
        Roles: {
          include: {
            role: {
              include: {
                // true 表示包含 RolePermissions 关联的角色权限
                RolePermissions: true,
              },
            },
          },
        },
      },
    });
  }

  async updateUser(user: UpdateUserDto): Promise<UserPrisma> {
    return await this.prismaService.$transaction(async (prisma) => {
      const { id, username = '', roles = [], ...rest } = user;

      const updateData: Partial<UserPrisma> = { ...rest };

      if (rest.password) {
        updateData.password = await argon2.hash(rest.password);
      }

      const roleIds: number[] = [];

      // 为什么没有把更新 role 和 user 放在一起处理，而是分开？
      // 因为在更新用户角色时，需要先删除用户之前的角色关联，再创建新的角色关联。
      // 如果放在一起处理，可能会导致角色关联被错误删除或创建，从而影响用户的角色权限。

      // 角色 权限的更新，放置在前
      await Promise.all(
        roles.map(async (role: Role & { permissions: Permission[] }) => {
          // 每次更新都需要把 id 记录下来
          roleIds.push(role.id);

          const { permissions = [], ...restRole } = role;
          await prisma.role.update({
            where: {
              id: role.id,
            },
            data: {
              ...restRole,
              RolePermissions: {
                deleteMany: {}, // Delete previous data
                create: permissions.map((permission) => ({
                  permission: {
                    connectOrCreate: {
                      where: {
                        name: permission.name,
                      },
                      create: {
                        name: permission.name,
                        action: permission.action,
                      },
                    },
                  },
                })),
              },
            },
          });
        }),
      );

      // 用户 角色的更新
      const whereCond = id ? { id } : { username };
      const updatedUser = await prisma.user.update({
        where: whereCond,
        data: {
          ...updateData,
          Roles: {
            deleteMany: {}, // Delete previous data
            // 为什么不需要要 userId，因为在 UserRole 模型中，userId 是联合主键的一部分，
            create: roleIds.map((roleId) => ({ roleId })),
          },
        },
        // 更新后，会把 Roles 数据展示出来
        include: {
          Roles: true,
        },
      });

      return updatedUser;
    });
  }

  findUserOneByUser(username: string, password?: string): Promise<User | null> {
    return this.userRepository.findOneBy({ username, password });
  }

  async removeUser(id: number): Promise<void> {
    await this.userRepository.delete(id);
  }
}
