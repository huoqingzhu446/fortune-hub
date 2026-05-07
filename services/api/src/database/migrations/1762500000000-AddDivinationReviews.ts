import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class AddDivinationReviews1762500000000 implements MigrationInterface {
  name = 'AddDivinationReviews1762500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('divination_reviews')) {
      return;
    }

    await queryRunner.createTable(
      new Table({
        name: 'divination_reviews',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            unsigned: true,
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'userId',
            type: 'bigint',
            unsigned: true,
            isNullable: false,
          },
          {
            name: 'resultId',
            type: 'varchar',
            length: '128',
            isNullable: false,
          },
          {
            name: 'favorite',
            type: 'tinyint',
            width: 1,
            isNullable: false,
            default: 0,
          },
          {
            name: 'outcome',
            type: 'varchar',
            length: '16',
            isNullable: false,
            default: "'pending'",
          },
          {
            name: 'note',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'topic',
            type: 'varchar',
            length: '32',
            isNullable: true,
          },
          {
            name: 'title',
            type: 'varchar',
            length: '128',
            isNullable: true,
          },
          {
            name: 'summary',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'resultSnapshot',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'datetime',
            isNullable: false,
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'datetime',
            isNullable: false,
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
        indices: [
          new TableIndex({
            name: 'uniq_divination_reviews_user_result',
            columnNames: ['userId', 'resultId'],
            isUnique: true,
          }),
          new TableIndex({
            name: 'idx_divination_reviews_user_updated_at',
            columnNames: ['userId', 'updatedAt'],
          }),
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('divination_reviews')) {
      await queryRunner.dropTable('divination_reviews');
    }
  }
}
