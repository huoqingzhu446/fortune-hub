import { MigrationInterface, QueryRunner, TableIndex } from 'typeorm';

export class OptimizePosterMetricLookupIndexes1762800000000
  implements MigrationInterface
{
  name = 'OptimizePosterMetricLookupIndexes1762800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.createIndexIfMissing(
      queryRunner,
      'shares',
      new TableIndex({
        name: 'idx_shares_user_created_at',
        columnNames: ['userId', 'createdAt'],
      }),
    );
    await this.createIndexIfMissing(
      queryRunner,
      'poster_jobs',
      new TableIndex({
        name: 'idx_poster_jobs_user_created_at',
        columnNames: ['userId', 'createdAt'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await this.dropIndexIfExists(
      queryRunner,
      'poster_jobs',
      'idx_poster_jobs_user_created_at',
    );
    await this.dropIndexIfExists(
      queryRunner,
      'shares',
      'idx_shares_user_created_at',
    );
  }

  private async createIndexIfMissing(
    queryRunner: QueryRunner,
    tableName: string,
    index: TableIndex,
  ) {
    const table = await queryRunner.getTable(tableName);
    if (!table || table.indices.some((item) => item.name === index.name)) {
      return;
    }

    await queryRunner.createIndex(tableName, index);
  }

  private async dropIndexIfExists(
    queryRunner: QueryRunner,
    tableName: string,
    indexName: string,
  ) {
    const table = await queryRunner.getTable(tableName);
    const index = table?.indices.find((item) => item.name === indexName);
    if (!index) {
      return;
    }

    await queryRunner.dropIndex(tableName, index);
  }
}
