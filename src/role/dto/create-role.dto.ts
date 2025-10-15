import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, IsArray } from 'class-validator';
import { CreatePermissionDto } from 'src/permission/dto/create-permission.dto';

interface PermissionType {
  id?: number;
  name: string;
  action: string;
  description?: string;
}

export class CreateRoleDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  // permissions 转换为 dto
  @Type(() => CreatePermissionDto)
  permissions: PermissionType[];
}
