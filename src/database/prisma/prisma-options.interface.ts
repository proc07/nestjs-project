import { ModuleMetadata, Type } from '@nestjs/common';
import { Prisma } from '@prisma/client';

export interface PrismaModuleOptions {
  url?: string;
  options?: Prisma.PrismaClientOptions;
  name?: string;
  retryAttempts?: number;
  retryDelay?: number;
  connectionFactory?: (connection: any, clientClass: any) => any;
  connectionErrorFactory?: (
    error: Prisma.PrismaClientKnownRequestError,
  ) => Prisma.PrismaClientKnownRequestError;
}

export interface PrismaOptionsFactory {
  createPrismaModuleOptions():
    | Promise<PrismaModuleOptions>
    | PrismaModuleOptions;
}

export type PrismaModuleFactoryOptions = Omit<PrismaModuleOptions, 'name'>;

export interface PrismaModuleAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  name?: string;
  useExisting?: Type<PrismaOptionsFactory>;
  useClass?: Type<PrismaOptionsFactory>;
  useFactory?: (
    ...args: any[]
  ) => Promise<PrismaModuleFactoryOptions> | PrismaModuleFactoryOptions;
  inject?: any[];
}
