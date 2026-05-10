import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeedbackEntity } from '../database/entities/feedback.entity';
import { OrderEntity } from '../database/entities/order.entity';
import { ShareRecordEntity } from '../database/entities/share-record.entity';
import { UserEntity } from '../database/entities/user.entity';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminDashboardService } from './admin-dashboard.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      OrderEntity,
      FeedbackEntity,
      ShareRecordEntity,
    ]),
  ],
  controllers: [AdminDashboardController],
  providers: [AdminDashboardService],
})
export class AdminDashboardModule {}
