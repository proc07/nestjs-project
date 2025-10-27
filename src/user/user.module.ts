import { Global, Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { PrismaModule } from 'src/database/prisma/prisma.module';
import { RoleModule } from 'src/role/role.module';
import { PermissionModule } from 'src/permission/permission.module';
import { PolicyModule } from 'src/policy/policy.module';

@Global()
@Module({
  controllers: [UserController],
  providers: [UserService],
  imports: [
    // 把这个实体（Entity）交给（NestJS），会为它创建一个仓库（Repository），
    // 并把它放进这个模块的‘工具箱’里。这样，这个模块里的任何服务都可以从‘工具箱’里拿出来用。
    TypeOrmModule.forFeature([User], 'mysql'),
    // TypeOrmModule.forFeature([User], 'mysql2'),

    PrismaModule,
    RoleModule,
    PolicyModule,
    PermissionModule,
  ],
  exports: [UserService],
})
export class UserModule {}
