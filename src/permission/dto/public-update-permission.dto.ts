import { PartialType } from '@nestjs/mapped-types';
import { CreatePolicyDto } from 'src/policy/dto/create-policy.dto';
import { CreatePermissionDto } from './create-permission.dto';
import { Expose, Transform, Type } from 'class-transformer';

export class PublicUpdatePermissionDto extends PartialType(
  CreatePermissionDto,
) {
  @Type(() => CreatePolicyDto)
  @Expose({ name: 'PermissionPolicies' })
  @Transform(({ obj }) => {
    console.log(obj, 'Transform---------');
    return obj.PermissionPolicies?.map((item) => {
      delete item.policy['encode'];

      return item;
    });
  })
  policies?: CreatePolicyDto[];
}
