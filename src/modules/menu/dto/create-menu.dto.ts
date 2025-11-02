import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

export class Meta {
  @IsOptional()
  @IsInt()
  id?: number;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  layout?: string;

  @IsOptional()
  @IsInt()
  order?: number;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsBoolean()
  hideMenu?: boolean;

  @IsOptional()
  @IsBoolean()
  disabled?: boolean;
}

export class CreateMenuDto {
  @IsOptional()
  @IsInt()
  id?: number;

  @IsString()
  @ValidateIf((object) => !object.id) // 只有当 id 不存在时才验证
  name: string;

  @IsString()
  @ValidateIf((object) => !object.id) // 只有当 id 不存在时才验证
  path: string;

  @IsString()
  @ValidateIf((object) => !object.id) // 只有当 id 不存在时才验证
  component: string;

  @IsString()
  @IsOptional()
  @ValidateIf((object) => !object.id) // 只有当 id 不存在时才验证
  redirect: string;

  @IsString()
  @IsOptional()
  @ValidateIf((object) => !object.id) // 只有当 id 不存在时才验证
  fullPath: string;

  @IsString()
  @IsOptional()
  @ValidateIf((object) => !object.id) // 只有当 id 不存在时才验证
  alias: string;

  @IsOptional()
  @Type(() => Meta)
  @ValidateNested({ each: true })
  @ValidateIf((object) => !object.id) // 只有当 id 不存在时才验证
  meta: Meta;

  @IsString()
  @IsOptional()
  @ValidateIf((object) => !object.id) // 只有当 id 不存在时才验证
  label: string;

  @IsOptional()
  @Type(() => CreateMenuDto)
  @ValidateIf((object) => !object.id) // 只有当 id 不存在时才验证
  children: CreateMenuDto[];
}
