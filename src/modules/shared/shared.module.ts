import { Global, Module } from '@nestjs/common';
import { SharedService } from './shared.service';
import { SharedController } from './shared.controller';
import { PrismaService } from 'src/database/prisma/prisma.service';

@Global()
@Module({
  controllers: [SharedController],
  providers: [SharedService, PrismaService],
  exports: [SharedService],
})
export class SharedModule {}
