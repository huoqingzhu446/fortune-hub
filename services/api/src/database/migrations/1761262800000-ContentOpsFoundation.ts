import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableIndex,
} from 'typeorm';

export class ContentOpsFoundation1761262800000 implements MigrationInterface {
  name = 'ContentOpsFoundation1761262800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.ensureLuckyItemsTable(queryRunner);
    await this.ensureConfigsTable(queryRunner);
    await this.ensureReportTemplatesTable(queryRunner);
    await this.ensureLifecycleColumns(
      queryRunner,
      'fortune_contents',
      ['publishedAt', 'archivedAt'],
    );
    await this.ensureLifecycleColumns(
      queryRunner,
      'assessment_test_configs',
      ['publishedAt', 'archivedAt'],
    );
    await this.ensureLifecycleColumns(
      queryRunner,
      'assessment_test_groups',
      ['publishedAt', 'archivedAt'],
    );
    await this.ensureLifecycleColumns(
      queryRunner,
      'assessment_questions',
      ['publishedAt', 'archivedAt'],
    );

    await this.backfillPublishedAt(queryRunner, 'fortune_contents');
    await this.backfillPublishedAt(queryRunner, 'assessment_test_configs');
    await this.backfillPublishedAt(queryRunner, 'assessment_test_groups');
    await this.backfillPublishedAt(queryRunner, 'assessment_questions');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await this.dropColumnIfExists(queryRunner, 'assessment_test_groups', 'archivedAt');
    await this.dropColumnIfExists(queryRunner, 'assessment_test_groups', 'publishedAt');
    await this.dropColumnIfExists(queryRunner, 'assessment_questions', 'archivedAt');
    await this.dropColumnIfExists(queryRunner, 'assessment_questions', 'publishedAt');
    await this.dropColumnIfExists(queryRunner, 'assessment_test_configs', 'archivedAt');
    await this.dropColumnIfExists(queryRunner, 'assessment_test_configs', 'publishedAt');
    await this.dropColumnIfExists(queryRunner, 'fortune_contents', 'archivedAt');
    await this.dropColumnIfExists(queryRunner, 'fortune_contents', 'publishedAt');

    if (await queryRunner.hasTable('report_templates')) {
      await queryRunner.dropTable('report_templates');
    }

    if (await queryRunner.hasTable('configs')) {
      await queryRunner.dropTable('configs');
    }

    if (await queryRunner.hasTable('lucky_items')) {
      await queryRunner.dropTable('lucky_items');
    }
  }

  private async ensureLuckyItemsTable(queryRunner: QueryRunner) {
    if (await queryRunner.hasTable('lucky_items')) {
      return;
    }

    await queryRunner.createTable(
      new Table({
        name: 'lucky_items',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            unsigned: true,
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'bizCode', type: 'varchar', length: '64', isNullable: false },
          { name: 'title', type: 'varchar', length: '128', isNullable: false },
          { name: 'summary', type: 'varchar', length: '255', isNullable: true },
          {
            name: 'category',
            type: 'varchar',
            length: '64',
            isNullable: false,
            default: "'幸运物'",
          },
          { name: 'publishDate', type: 'date', isNullable: true },
          {
            name: 'sortOrder',
            type: 'int',
            unsigned: true,
            isNullable: false,
            default: '100',
          },
          { name: 'contentJson', type: 'json', isNullable: false },
          {
            name: 'status',
            type: 'varchar',
            length: '16',
            isNullable: false,
            default: "'draft'",
          },
          { name: 'publishedAt', type: 'datetime', isNullable: true },
          { name: 'archivedAt', type: 'datetime', isNullable: true },
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
            name: 'uniq_lucky_items_biz_code',
            columnNames: ['bizCode'],
            isUnique: true,
          }),
          new TableIndex({
            name: 'idx_lucky_items_status_publish_date',
            columnNames: ['status', 'publishDate'],
          }),
        ],
      }),
    );
  }

  private async ensureConfigsTable(queryRunner: QueryRunner) {
    if (await queryRunner.hasTable('configs')) {
      return;
    }

    await queryRunner.createTable(
      new Table({
        name: 'configs',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            unsigned: true,
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'namespace', type: 'varchar', length: '64', isNullable: false },
          { name: 'configKey', type: 'varchar', length: '128', isNullable: false },
          { name: 'title', type: 'varchar', length: '128', isNullable: false },
          { name: 'description', type: 'varchar', length: '255', isNullable: true },
          {
            name: 'valueType',
            type: 'varchar',
            length: '16',
            isNullable: false,
            default: "'json'",
          },
          { name: 'valueJson', type: 'json', isNullable: false },
          {
            name: 'status',
            type: 'varchar',
            length: '16',
            isNullable: false,
            default: "'draft'",
          },
          { name: 'publishedAt', type: 'datetime', isNullable: true },
          { name: 'archivedAt', type: 'datetime', isNullable: true },
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
            name: 'uniq_configs_namespace_key',
            columnNames: ['namespace', 'configKey'],
            isUnique: true,
          }),
          new TableIndex({
            name: 'idx_configs_namespace_status',
            columnNames: ['namespace', 'status'],
          }),
        ],
      }),
    );
  }

  private async ensureReportTemplatesTable(queryRunner: QueryRunner) {
    if (await queryRunner.hasTable('report_templates')) {
      return;
    }

    await queryRunner.createTable(
      new Table({
        name: 'report_templates',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            unsigned: true,
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'templateType', type: 'varchar', length: '64', isNullable: false },
          { name: 'bizCode', type: 'varchar', length: '64', isNullable: false },
          { name: 'title', type: 'varchar', length: '128', isNullable: false },
          { name: 'description', type: 'varchar', length: '255', isNullable: true },
          {
            name: 'engine',
            type: 'varchar',
            length: '32',
            isNullable: false,
            default: "'json'",
          },
          {
            name: 'sortOrder',
            type: 'int',
            unsigned: true,
            isNullable: false,
            default: '100',
          },
          { name: 'payloadJson', type: 'json', isNullable: false },
          {
            name: 'status',
            type: 'varchar',
            length: '16',
            isNullable: false,
            default: "'draft'",
          },
          { name: 'publishedAt', type: 'datetime', isNullable: true },
          { name: 'archivedAt', type: 'datetime', isNullable: true },
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
            name: 'uniq_report_templates_type_code',
            columnNames: ['templateType', 'bizCode'],
            isUnique: true,
          }),
          new TableIndex({
            name: 'idx_report_templates_type_status_sort',
            columnNames: ['templateType', 'status', 'sortOrder'],
          }),
        ],
      }),
    );
  }

  private async ensureLifecycleColumns(
    queryRunner: QueryRunner,
    tableName: string,
    columnNames: string[],
  ) {
    for (const columnName of columnNames) {
      const exists = await queryRunner.hasColumn(tableName, columnName);

      if (exists) {
        continue;
      }

      await queryRunner.addColumn(
        tableName,
        new TableColumn({
          name: columnName,
          type: 'datetime',
          isNullable: true,
        }),
      );
    }
  }

  private async backfillPublishedAt(queryRunner: QueryRunner, tableName: string) {
    await queryRunner.query(
      `UPDATE \`${tableName}\` SET \`publishedAt\` = COALESCE(\`publishedAt\`, \`updatedAt\`, \`createdAt\`) WHERE \`status\` = 'published'`,
    );
  }

  private async dropColumnIfExists(
    queryRunner: QueryRunner,
    tableName: string,
    columnName: string,
  ) {
    if (await queryRunner.hasColumn(tableName, columnName)) {
      await queryRunner.dropColumn(tableName, columnName);
    }
  }
}
