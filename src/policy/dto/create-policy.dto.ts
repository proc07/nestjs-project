import { IsIn, IsInt, IsOptional, IsString } from 'class-validator';

type FeildType = Record<string, any> | string | string[];

export class CreatePolicyDto {
  @IsInt()
  @IsOptional()
  id?: number;

  @IsInt()
  type: number;

  @IsString()
  @IsIn(['can', 'cannot']) // 检查给定值是否在允许值数组中。
  effect: 'can' | 'cannot';

  @IsString()
  action: string;

  @IsString()
  subject: string;

  @IsOptional()
  fields?: FeildType;

  @IsOptional()
  conditions?: FeildType;

  @IsOptional()
  args?: FeildType;
}
