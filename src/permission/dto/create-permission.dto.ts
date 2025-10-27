import { Expose, Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { CreatePolicyDto } from 'src/policy/dto/create-policy.dto';

export class CreatePermissionDto {
  @Expose()
  @IsNotEmpty()
  @IsString()
  name: string;

  @Expose()
  @IsNotEmpty()
  @IsString()
  action: string;

  @Expose()
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  // 每个元素都需要进行验证
  @ValidateNested({ each: true })
  @Type(() => CreatePolicyDto)
  policies?: CreatePolicyDto[];
}
