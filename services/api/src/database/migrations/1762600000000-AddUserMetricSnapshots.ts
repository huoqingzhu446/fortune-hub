import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class AddUserMetricSnapshots1762600000000 implements MigrationInterface {
  name = 'AddUserMetricSnapshots1762600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('user_metric_snapshots')) {
      return;
    }

    await queryRunner.createTable(
      new Table({
        name: 'user_metric_snapshots',
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
            name: 'metricKey',
            type: 'varchar',
            length: '32',
            isNullable: false,
          },
          {
            name: 'snapshotDate',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'value',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'unit',
            type: 'varchar',
            length: '16',
            isNullable: false,
          },
          {
            name: 'label',
            type: 'varchar',
            length: '32',
            isNullable: false,
          },
          {
            name: 'summary',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'formulaVersion',
            type: 'varchar',
            length: '32',
            isNullable: false,
            default: "'v1'",
          },
          {
            name: 'breakdownJson',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'sourceJson',
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
            name: 'uniq_user_metric_snapshot_date',
            columnNames: ['userId', 'metricKey', 'snapshotDate'],
            isUnique: true,
          }),
          new TableIndex({
            name: 'idx_user_metric_snapshots_user_metric_date',
            columnNames: ['userId', 'metricKey', 'snapshotDate'],
          }),
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('user_metric_snapshots')) {
      await queryRunner.dropTable('user_metric_snapshots');
    }
  }
}
