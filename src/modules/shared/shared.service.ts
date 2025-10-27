import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';

@Injectable()
export class SharedService {
  constructor(private readonly prisma: PrismaService) {}

  getSubject(subject: string, user: { id: string }, args?: any) {
    return this.prisma[subject].findUnique({
      where: {
        id: user.id,
      },
      ...(args || {}),
    });
  }
}
