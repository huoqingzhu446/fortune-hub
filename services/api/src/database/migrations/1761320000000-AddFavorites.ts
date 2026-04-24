import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class AddFavorites1761320000000 implements MigrationInterface {
  name = 'AddFavorites1761320000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('favorites')) {
      return;
    }

    await queryRunner.createTable(
      new Table({
        name: 'favorites',
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
            name: 'itemType',
            type: 'varchar',
            length: '32',
            isNullable: false,
          },
          {
            name: 'itemKey',
            type: 'varchar',
            length: '128',
            isNullable: false,
          },
          {
            name: 'title',
            type: 'varchar',
            length: '128',
            isNullable: false,
          },
          {
            name: 'summary',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'icon',
            type: 'varchar',
            length: '16',
            isNullable: true,
          },
          {
            name: 'route',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'extraJson',
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
            name: 'uniq_favorites_user_item',
            columnNames: ['userId', 'itemType', 'itemKey'],
            isUnique: true,
          }),
          new TableIndex({
            name: 'idx_favorites_user_created_at',
            columnNames: ['userId', 'createdAt'],
          }),
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('favorites')) {
      await queryRunner.dropTable('favorites');
    }
  }
}
