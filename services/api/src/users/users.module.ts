import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { OrderEntity } from '../database/entities/order.entity';
import { MeditationRecordEntity } from '../database/entities/meditation-record.entity';
import { MoodRecordEntity } from '../database/entities/mood-record.entity';
import { UserRecordEntity } from '../database/entities/user-record.entity';
import { UserEntity } from '../database/entities/user.entity';
import { FavoritesModule } from '../favorites/favorites.module';
import { MembershipModule } from '../membership/membership.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      UserRecordEntity,
      MoodRecordEntity,
      MeditationRecordEntity,
      OrderEntity,
    ]),
    AuthModule,
    FavoritesModule,
    MembershipModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
