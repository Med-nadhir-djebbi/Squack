<<<<<<< HEAD
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],   
=======
import { Global, Module, } from '@nestjs/common';
import { PrismaService } from './prisma.service';
@Global()
@Module({
  providers: [PrismaService]
>>>>>>> 227522a (prisma service)
})
export class PrismaModule {}
