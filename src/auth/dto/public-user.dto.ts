import { Exclude, Expose } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';
import { SignInUserDto } from './signin-user.dto';

// 可以 extends 继承其他 dto 类
export class PublicUserDto extends SignInUserDto {
  // @IsString()
  // @IsNotEmpty()
  // id: number;

  @Expose()
  declare username: string;

  @Exclude()
  declare password: string;

  constructor(partial: Partial<PublicUserDto>) {
    super(); // 如果有继承其他 dto

    Object.assign(this, partial);
  }
}
