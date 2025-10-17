import { Expose, Transform } from 'class-transformer';
import { UserRole, Role, RolePermissions } from '@prisma/client';

export class PublicUserDto {
  @Expose()
  id: number;

  @Expose()
  username: string;

  @Transform(
    ({
      value,
      obj,
    }: {
      value: Array<
        UserRole & { role: Role & { RolePermissions: RolePermissions[] } }
      >;
      obj: {
        Roles: Array<
          UserRole & { role: Role & { RolePermissions: RolePermissions[] } }
        >;
      };
    }) => {
      // 这里有个问题？为什么 value 是一个 [ {}, {} ], 而 obj.Roles 是一个 [{ userId: 4, roleId: 2, role: [Object] }] 有数据
      console.log('public user data', obj, value);

      return obj.Roles?.map((roleItem) => {
        // console.log(roleItem.role);
        return {
          id: roleItem.role.id,
          name: roleItem.role.name,
          permissions: roleItem.role.RolePermissions,
        };
      });
    },
  )
  @Expose({ name: 'Roles' })
  roles: any;
}
