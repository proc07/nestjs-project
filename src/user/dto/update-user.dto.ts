import { PartialType } from '@nestjs/mapped-types';
import { IsArray, IsInt, IsString, ValidateIf } from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { CreateRoleDto } from 'src/role/dto/create-role.dto';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @Expose()
  @IsInt()
  @ValidateIf((object) => !object.username)
  id?: number;

  @Expose()
  @IsString()
  @ValidateIf((object) => !object.id)
  username?: string;

  @Expose()
  @IsArray()
  // 作用：将 roles 转换为 CreateRoleDto 类型
  @Type(() => CreateRoleDto)
  roles?: any[];
}
