import { Expose, plainToInstance, Transform, Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, IsArray } from 'class-validator';
import { CreatePermissionDto } from 'src/permission/dto/create-permission.dto';

export interface PermissionType {
  id?: number;
  name: string;
  action: string;
  description?: string;
}

abstract class Permission {
  abstract type: string;
}
class StringPermission extends Permission {
  type = 'string';
  value: string;
}
class DetailedPermission extends Permission {
  type = 'detailed';
  name: string;
  value: PermissionType;
}

export class CreateRoleDto {
  @Expose()
  @IsNotEmpty()
  @IsString()
  name: string;

  @Expose()
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  // permissions 转换为 dto
  // 第1种方式： https://github.com/typestack/class-transformer?tab=readme-ov-file#providing-more-than-one-type-option
  @Type(() => Permission, {
    discriminator: {
      property: 'type',
      subTypes: [
        { value: StringPermission, name: 'string' },
        { value: DetailedPermission, name: 'detailed' },
      ],
    },
  })
  // 第2种方式
  // @Type(() => CreatePermissionDto)
  @Transform(({ value }) => {
    console.log('🚀  create-role:permissions', value);
    return value.map((item) => {
      if (typeof item === 'string') {
        // 当传递为 string -> split -> {name, action}对象数组
        const [name, action] = item.split(':');
        return plainToInstance(CreatePermissionDto, {
          name: `${name}:${action}`,
          action,
        });
      } else {
        // permissions 如果支持传入2种类型：1. string[] 2.object[]
        return plainToInstance(CreatePermissionDto, item);
      }
    });
  })
  // 当传递为 object[] -> 直接转换为 dto
  permissions: PermissionType[] | string[];
}
