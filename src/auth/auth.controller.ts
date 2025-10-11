import {
  ClassSerializerInterceptor,
  Controller,
  HttpException,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import { Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInUserDto } from './dto/signin-user.dto';
import { CreateUserPipe } from './pipes/create-user.pipe';
import { SerializeInterceptor } from 'src/common/interceptors/serialize.interceptor';
import { PublicUserDto } from './dto/public-user.dto';
import { Serialize } from 'src/common/decorators/serialize.decorator';

@Controller('auth')
// @UseInterceptors(SerializeInterceptor)
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/signIn')
  // @UsePipes(CreateUserPipe) 控制器级别的管道，用于验证和转换请求体中的数据。
  signIn(@Body() signInDto: SignInUserDto) {
    return this.authService.signIn(signInDto.username, signInDto.password);
  }

  @Post('/signUp')
  @UseInterceptors(ClassSerializerInterceptor) // 用于序列化响应体中的数据。
  // 管道类型：@Body(CreateUserPipe) 用于验证和转换请求体中的数据。
  async signUp(@Body(CreateUserPipe) signUpDto: SignInUserDto) {
    if (!signUpDto.username || !signUpDto.password) {
      throw new HttpException('username and password are required', 400);
    }
    const user = await this.authService.signUp(
      signUpDto.username,
      signUpDto.password,
    );
    // 内置序列化拦截器定制响应数据结构
    return user;
    // return new PublicUserDto({ ...user });
  }

  // 第2种写法
  @Post('/signUp2')
  @Serialize(PublicUserDto) // 定制序列化拦截器，返回过滤后的响应数据
  async signUp2(@Body(CreateUserPipe) signUpDto: SignInUserDto) {
    if (!signUpDto.username || !signUpDto.password) {
      throw new HttpException('username and password are required', 400);
    }
    const user = await this.authService.signUp(
      signUpDto.username,
      signUpDto.password,
    );
    return user;
  }
}
