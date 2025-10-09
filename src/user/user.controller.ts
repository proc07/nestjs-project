import {
  Controller,
  Get,
  Optional,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';

@Controller('user')
export class UserController {
  constructor(
    @Optional() private readonly userService: UserService,
    @Optional() private configService: ConfigService,
  ) {}

  @Get('/findUser')
  @UseGuards(AuthGuard('jwt'))
  findUser(@Query('id', ParseIntPipe) id: number) {
    return { id };
  }
}
