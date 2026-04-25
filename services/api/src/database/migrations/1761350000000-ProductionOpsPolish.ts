import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableIndex,
} from 'typeorm';

export class ProductionOpsPolish1761350000000 implements MigrationInterface {
  name = 'ProductionOpsPolish1761350000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.ensureUserConsentsTable(queryRunner);
    await this.addColumnIfMissing(
      queryRunner,
      'feedbacks',
      new TableColumn({ name: 'assignee', type: 'varchar', length: '64', isNullable: true }),
    );
    await this.addColumnIfMissing(
      queryRunner,
      'feedbacks',
      new TableColumn({ name: 'priority', type: 'varchar', length: '16', default: "'normal'" }),
    );
    await this.addColumnIfMissing(
      queryRunner,
      'feedbacks',
      new TableColumn({ name: 'adminReply', type: 'text', isNullable: true }),
    );
    await this.addColumnIfMissing(
      queryRunner,
      'feedbacks',
      new TableColumn({ name: 'attachmentsJson', type: 'json', isNullable: true }),
    );
    await this.addColumnIfMissing(
      queryRunner,
      'feedbacks',
      new TableColumn({ name: 'repliedAt', type: 'datetime', isNullable: true }),
    );
    await this.addColumnIfMissing(
      queryRunner,
      'push_subscriptions',
      new TableColumn({ name: 'cancelledAt', type: 'datetime', isNullable: true }),
    );
    await this.addColumnIfMissing(
      queryRunner,
      'push_delivery_logs',
      new TableColumn({ name: 'lastAttemptAt', type: 'datetime', isNullable: true }),
    );
    await this.addColumnIfMissing(
      queryRunner,
      'report_templates',
      new TableColumn({ name: 'grayPercent', type: 'int', unsigned: true, default: '100' }),
    );
    await this.addColumnIfMissing(
      queryRunner,
      'report_templates',
      new TableColumn({ name: 'releaseNote', type: 'varchar', length: '255', isNullable: true }),
    );
    await this.addColumnIfMissing(
      queryRunner,
      'report_templates',
      new TableColumn({
        name: 'publishedVersionNo',
        type: 'int',
        unsigned: true,
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const [table, column] of [
      ['report_templates', 'publishedVersionNo'],
      ['report_templates', 'releaseNote'],
      ['report_templates', 'grayPercent'],
      ['push_delivery_logs', 'lastAttemptAt'],
      ['push_subscriptions', 'cancelledAt'],
      ['feedbacks', 'repliedAt'],
      ['feedbacks', 'attachmentsJson'],
      ['feedbacks', 'adminReply'],
      ['feedbacks', 'priority'],
      ['feedbacks', 'assignee'],
    ] as const) {
      await this.dropColumnIfExists(queryRunner, table, column);
    }

    if (await queryRunner.hasTable('user_consents')) {
      await queryRunner.dropTable('user_consents');
    }
  }

  private async ensureUserConsentsTable(queryRunner: QueryRunner) {
    if (await queryRunner.hasTable('user_consents')) {
      return;
    }

    await queryRunner.createTable(
      new Table({
        name: 'user_consents',
        columns: [
          this.idColumn(),
          { name: 'userId', type: 'bigint', unsigned: true },
          { name: 'consentType', type: 'varchar', length: '32' },
          { name: 'version', type: 'varchar', length: '32' },
          { name: 'status', type: 'varchar', length: '16', default: "'agreed'" },
          { name: 'source', type: 'varchar', length: '32', default: "'mobile'" },
          { name: 'clientInfoJson', type: 'json', isNullable: true },
          { name: 'agreedAt', type: 'datetime' },
          { name: 'revokedAt', type: 'datetime', isNullable: true },
          this.createdAtColumn(),
          this.updatedAtColumn(),
        ],
        indices: [
          new TableIndex({
            name: 'idx_user_consents_user_type',
            columnNames: ['userId', 'consentType'],
          }),
          new TableIndex({
            name: 'idx_user_consents_type_version_status',
            columnNames: ['consentType', 'version', 'status'],
          }),
        ],
      }),
    );
  }

  private async addColumnIfMissing(
    queryRunner: QueryRunner,
    tableName: string,
    column: TableColumn,
  ) {
    if (!(await queryRunner.hasTable(tableName))) {
      return;
    }

    const table = await queryRunner.getTable(tableName);
    if (!table?.findColumnByName(column.name)) {
      await queryRunner.addColumn(tableName, column);
    }
  }

  private async dropColumnIfExists(
    queryRunner: QueryRunner,
    tableName: string,
    columnName: string,
  ) {
    if (!(await queryRunner.hasTable(tableName))) {
      return;
    }

    const table = await queryRunner.getTable(tableName);
    if (table?.findColumnByName(columnName)) {
      await queryRunner.dropColumn(tableName, columnName);
    }
  }

  private idColumn() {
    return {
      name: 'id',
      type: 'bigint',
      unsigned: true,
      isPrimary: true,
      isGenerated: true,
      generationStrategy: 'increment' as const,
    };
  }

  private createdAtColumn() {
    return {
      name: 'createdAt',
      type: 'datetime',
      default: 'CURRENT_TIMESTAMP',
    };
  }

  private updatedAtColumn() {
    return {
      name: 'updatedAt',
      type: 'datetime',
      default: 'CURRENT_TIMESTAMP',
      onUpdate: 'CURRENT_TIMESTAMP',
    };
  }
}
