import { Injectable, PipeTransform } from '@nestjs/common';
import { SignInUserDto } from '../dto/signin-user.dto';

@Injectable()
export class CreateUserPipe implements PipeTransform {
  transform(value: SignInUserDto) {
    if (!value) {
      return;
    }

    const { roles2 } = value;
    if (roles2 && roles2 instanceof Array) {
      value.roles2 = roles2?.map((o) =>
        typeof o === 'string' ? parseInt(o) : o,
      );
    }

    return value;
  }
}
