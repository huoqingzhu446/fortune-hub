import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { FortuneContentEntity } from '../database/entities/fortune-content.entity';
import { ShareRecordEntity } from '../database/entities/share-record.entity';
import { ReportsModule } from '../reports/reports.module';
import { PostersController } from './posters.controller';
import { PostersService } from './posters.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ShareRecordEntity, FortuneContentEntity]),
    AuthModule,
    ReportsModule,
  ],
  controllers: [PostersController],
  providers: [PostersService],
})
export class PostersModule {}
