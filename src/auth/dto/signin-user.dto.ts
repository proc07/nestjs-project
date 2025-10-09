import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class SignInUserDto {
  @IsNotEmpty()
  @IsString()
  @Length(6, 20, { message: 'username must be between 6 and 20 characters' })
  username: string;

  @IsNotEmpty()
  @IsString()
  @Length(6, 32, {
    message: ({ value, constraints }) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (value?.length < constraints[0] || value?.length > constraints[1]) {
        return `password must be between ${constraints[0]} and ${constraints[1]} characters`;
      }
      return '';
    },
  })
  password: string;

  @IsArray()
  @IsOptional()
  @IsNotEmpty({ each: true })
  // @IsNumber({}, { each: true })
  // 第1种实现方式
  @Transform(({ value }: { value: Array<number | string> }) =>
    value?.map((o) => (typeof o === 'string' ? parseInt(o) : o)),
  )
  roles: number[];

  // 第2种 pipe 实现方式
  @IsArray()
  @IsOptional()
  roles2: number[];
}
