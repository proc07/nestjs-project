import { Module } from '@nestjs/common';
import { PolicyService } from './policy.service';
import { PolicyController } from './policy.controller';
import { CaslAbilityService } from './casl-ability.service';
import { PrismaModule } from 'src/database/prisma/prisma.module';

@Module({
  controllers: [PolicyController],
  providers: [PolicyService, CaslAbilityService],
  exports: [CaslAbilityService],
  imports: [PrismaModule],
})
export class PolicyModule {}
