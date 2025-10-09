import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';

@Module({
  controllers: [UserController],
  providers: [UserService],
  imports: [
    // 把这个实体（Entity）交给（NestJS），会为它创建一个仓库（Repository），
    // 并把它放进这个模块的‘工具箱’里。这样，这个模块里的任何服务都可以从‘工具箱’里拿出来用。
    TypeOrmModule.forFeature([User], 'mysql'),
    // TypeOrmModule.forFeature([User], 'mysql2'),
  ],
  exports: [UserService],
})
export class UserModule {}
