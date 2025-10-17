import { PartialType } from '@nestjs/mapped-types';
import { IsArray } from 'class-validator';
import { Exclude, Expose, Transform } from 'class-transformer';
import { UpdateUserDto } from './update-user.dto';

export class PublicUpdateUserDto extends PartialType(UpdateUserDto) {
  @Exclude()
  password?: string;

  @IsArray()
  @Expose({ name: 'Roles' })
  @Transform(({ value, obj }) => {
    console.log('public update user data', value, obj);

    return obj?.Roles?.map((item) => item.roleId);
  })
  roleIds: number[];
}
