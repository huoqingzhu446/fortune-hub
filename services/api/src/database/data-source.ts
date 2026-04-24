import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { AdConfigEntity } from './entities/ad-config.entity';
import { AppConfigEntity } from './entities/app-config.entity';
import { AssessmentQuestionEntity } from './entities/assessment-question.entity';
import { AssessmentSessionEntity } from './entities/assessment-session.entity';
import { AssessmentTestConfigEntity } from './entities/assessment-test-config.entity';
import { AssessmentTestGroupEntity } from './entities/assessment-test-group.entity';
import { FavoriteEntity } from './entities/favorite.entity';
import { FortuneContentEntity } from './entities/fortune-content.entity';
import { LuckyItemEntity } from './entities/lucky-item.entity';
import { MembershipProductEntity } from './entities/membership-product.entity';
import { OrderEntity } from './entities/order.entity';
import { ReportTemplateEntity } from './entities/report-template.entity';
import { ShareRecordEntity } from './entities/share-record.entity';
import { UserEntity } from './entities/user.entity';
import { UserRecordEntity } from './entities/user-record.entity';

export default new DataSource({
  type: 'mysql',
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: Number(process.env.MYSQL_PORT || 3306),
  username: process.env.MYSQL_USER || 'fortune',
  password: process.env.MYSQL_PASSWORD || 'fortune123',
  database: process.env.MYSQL_DATABASE || 'fortune_hub',
  timezone: 'Z',
  synchronize: false,
  entities: [
    AssessmentSessionEntity,
    AssessmentQuestionEntity,
    AssessmentTestConfigEntity,
    AssessmentTestGroupEntity,
    FavoriteEntity,
    UserEntity,
    UserRecordEntity,
    FortuneContentEntity,
    LuckyItemEntity,
    AppConfigEntity,
    ReportTemplateEntity,
    MembershipProductEntity,
    OrderEntity,
    AdConfigEntity,
    ShareRecordEntity,
  ],
  migrations: [`${__dirname}/migrations/*{.ts,.js}`],
});
