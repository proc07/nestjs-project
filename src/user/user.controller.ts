import {
  Controller,
  Get,
  HttpException,
  Optional,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { JwtGuard } from 'src/common/guards/jwt.guard';
import { Public } from 'src/common/decorators/public.decorator';

@Controller('user')
// @UseGuards(AuthGuard('jwt'), AdminGuard)  // 控制器守卫，对所有路由生效
@UseGuards(JwtGuard)
export class UserController {
  constructor(
    @Optional() private readonly userService: UserService,
    @Optional() private configService: ConfigService,
  ) {}

  @Get('/findUser')
  @UseGuards(AuthGuard('jwt'))
  // 管道类型：@Query('id', ParseIntPipe) 用于将查询参数 id 转换为整数类型。
  async findUser(@Query('id', ParseIntPipe) id: number) {
    const user = await this.userService.findOne(id);
    if (!user) {
      throw new HttpException('User not found', 404);
    }
    return user;
  }

  // 公共路由：@Public() 用于标记该路由为公共路由，无需进行 JWT 验证。
  @Public()
  @Get('/test')
  // 重要知识点：装饰器有执行顺序的，有多个时，从下往上执行的。如果使用 UseGuards 传入多个守卫，
  // 则每个守卫会按照传入的顺序依次执行。
  // 1. 认证守卫：AuthGuard('jwt') 用于验证用户的 JWT 令牌。
  // 2. 管理员守卫：AdminGuard 用于检查用户是否为管理员角色。
  // @UseGuards(AdminGuard)
  // @UseGuards(AuthGuard('jwt'))
  test() {
    return 'ok';
  }
}
