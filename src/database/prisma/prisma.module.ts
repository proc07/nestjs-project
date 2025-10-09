import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Module({})
export class PrismaModule {
  static forRootAsync() {
    return {
      module: PrismaModule,
      providers: [],
      exports: [],
    };
  }
}
