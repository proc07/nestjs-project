import { Controller, HttpException } from '@nestjs/common';
import { Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInUserDto } from './dto/signin-user.dto';
import { CreateUserPipe } from './pipes/create-user.pipe';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/signIn')
  signIn(@Body() signInDto: SignInUserDto) {
    return this.authService.signIn(signInDto.username, signInDto.password);
  }

  @Post('/signUp')
  signUp(@Body(CreateUserPipe) signUpDto: SignInUserDto) {
    if (!signUpDto.username || !signUpDto.password) {
      throw new HttpException('username and password are required', 400);
    }
    return this.authService.signUp(signUpDto.username, signUpDto.password);
  }
}
