import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import argon2 from 'argon2';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User, 'mysql')
    private readonly userRepository: Repository<User>,
    // @InjectRepository(User, 'mysql2')
    // private readonly userRepository2: Repository<User>,
  ) {}

  // findAll2(): Promise<User[]> {
  //   return this.userRepository2.find();
  // }

  async create(user: User): Promise<User> {
    const { password, ...rest } = user;
    return this.userRepository.save({
      ...rest,
      password: await argon2.hash(password),
    });
  }

  findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  findOne(id: number): Promise<User | null> {
    return this.userRepository.findOneBy({ id });
  }

  findOneByUser(username: string, password?: string): Promise<User | null> {
    return this.userRepository.findOneBy({ username, password });
  }

  async remove(id: number): Promise<void> {
    await this.userRepository.delete(id);
  }
}
