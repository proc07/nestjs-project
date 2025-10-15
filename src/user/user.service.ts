import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import argon2 from 'argon2';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { User as UserPrisma } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';

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

  async create(user: User): Promise<User> {
    const { password, ...rest } = user;
    return this.userRepository.create({
      ...rest,
      password: await argon2.hash(password),
    });
  }

  findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  findOne(id: number): Promise<User | null> {
    return this.userRepository.findOneBy({ id });
  }

  findOneByUser(username: string, password?: string): Promise<User | null> {
    return this.userRepository.findOneBy({ username, password });
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
}
