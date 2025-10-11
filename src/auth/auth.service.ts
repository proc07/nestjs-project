import { ForbiddenException, HttpException, Injectable } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { User } from '../user/user.entity';
import { JwtService } from '@nestjs/jwt';
import argon2 from 'argon2';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private jwtService: JwtService,
  ) {}

  async signIn(username: string, password: string) {
    const user = await this.userService.findOneByUser(username);
    if (!user) {
      throw new ForbiddenException('用户不存在');
    }

    if (!(await argon2.verify(user.password, password))) {
      throw new ForbiddenException('密码错误');
    }

    return {
      token: await this.jwtService.signAsync({
        username: user.username,
        sub: user.id,
      }),
    };
  }

  async signUp(username: string, password: string) {
    // 检查用户名是否已存在
    const existingUser = await this.userService.findOneByUser(username);
    if (existingUser) {
      throw new HttpException('Username already exists', 400);
    }
    return this.userService.create({
      username,
      password,
      firstName: '',
      lastName: '',
    } as User);
  }
}
