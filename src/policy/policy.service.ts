import { Injectable } from '@nestjs/common';
import { CreatePolicyDto } from './dto/create-policy.dto';
import { UpdatePolicyDto } from './dto/update-policy.dto';
import { PrismaService } from 'src/database/prisma/prisma.service';

@Injectable()
export class PolicyService {
  constructor(private prisma: PrismaService) {}

  async create(createPolicyDto: CreatePolicyDto) {
    const encode = Buffer.from(JSON.stringify(createPolicyDto)).toString(
      'base64',
    );
    return await this.prisma.policy.create({
      data: {
        ...createPolicyDto,
        encode,
      },
    });
  }

  findAll() {
    return `This action returns all policy`;
  }

  findOne(id: number) {
    return `This action returns a #${id} policy`;
  }

  update(id: number, updatePolicyDto: UpdatePolicyDto) {
    return `This action updates a #${id} policy`;
  }

  remove(id: number) {
    return `This action removes a #${id} policy`;
  }
}
