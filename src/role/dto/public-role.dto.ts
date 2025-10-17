import { CreateRoleDto } from './create-role.dto';
import { Expose, Transform } from 'class-transformer';

export class PublicRoleDto extends CreateRoleDto {
  @Expose()
  id: number;

  @Expose()
  @Transform(({ value: RolePermissions }) => {
    console.log('RolePermissions', RolePermissions);
    return RolePermissions?.map(
      (rolePermission) => rolePermission?.permission?.name,
    );
  })
  RolePermissions: any[];
}
