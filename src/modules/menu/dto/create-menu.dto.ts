import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
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
  name: string;

  @IsString()
  path: string;

  @IsString()
  component: string;

  @IsString()
  @IsOptional()
  redirect: string;

  @IsString()
  @IsOptional()
  fullPath: string;

  @IsString()
  @IsOptional()
  alias: string;

  @IsOptional()
  @Type(() => Meta)
  @ValidateNested({ each: true })
  meta: Meta;

  @IsString()
  @IsOptional()
  label: string;

  @IsOptional()
  @Type(() => CreateMenuDto)
  children: CreateMenuDto[];
}
