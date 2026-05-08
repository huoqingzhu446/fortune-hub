import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../database/entities/user.entity';
import { EntitlementsService } from './entitlements.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  providers: [EntitlementsService],
  exports: [EntitlementsService],
})
export class EntitlementsModule {}
