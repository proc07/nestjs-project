import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { UserService } from 'src/user/user.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly userService: UserService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1.获取请求对象
    const request = context.switchToHttp().getRequest<Request>();
    // 2.获取用户信息
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const user = (request as any).user;
    if (user) {
      console.log('AdminGuard', user);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
      const userInfo = await this.userService.findOne(user.id);
      console.log(userInfo);

      // 3.判断用户是否为管理员
      // if (user?.role !== 'admin') {
      //   return false;
      // }
    }

    return true;
  }
}
