import { Module } from '@nestjs/common';
import { AssessmentModule } from './assessment/assessment.module';
import { BaziModule } from './bazi/bazi.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssessmentSessionEntity } from './database/entities/assessment-session.entity';
import { FortuneContentEntity } from './database/entities/fortune-content.entity';
import { UserEntity } from './database/entities/user.entity';
import { UserRecordEntity } from './database/entities/user-record.entity';
import { AuthModule } from './auth/auth.module';
import { FortuneModule } from './fortune/fortune.module';
import { HomeModule } from './home/home.module';
import { HealthController } from './health/health.controller';
import { RedisModule } from './redis/redis.module';
import { UsersModule } from './users/users.module';
import { ZodiacModule } from './zodiac/zodiac.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql' as const,
        host: configService.get<string>('MYSQL_HOST', '127.0.0.1'),
        port: configService.get<number>('MYSQL_PORT', 3306),
        username: configService.get<string>('MYSQL_USER', 'fortune'),
        password: configService.get<string>('MYSQL_PASSWORD', 'fortune123'),
        database: configService.get<string>('MYSQL_DATABASE', 'fortune_hub'),
        entities: [
          AssessmentSessionEntity,
          UserEntity,
          UserRecordEntity,
          FortuneContentEntity,
        ],
        autoLoadEntities: true,
        synchronize: configService.get<string>('DB_SYNCHRONIZE')
          ? configService.get<string>('DB_SYNCHRONIZE') === 'true'
          : configService.get<string>('NODE_ENV') !== 'production',
        timezone: 'Z',
      }),
    }),
    RedisModule,
    AssessmentModule,
    BaziModule,
    AuthModule,
    UsersModule,
    HomeModule,
    ZodiacModule,
    FortuneModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
