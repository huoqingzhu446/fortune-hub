import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableIndex,
} from 'typeorm';

export class FixPulseAndDivinationReviewSchema1763000000000 implements MigrationInterface {
  name = 'FixPulseAndDivinationReviewSchema1763000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.ensureDailyPulseRecordsTable(queryRunner);
    await this.ensureBreathingRecordsTable(queryRunner);
    await this.ensureDivinationReviewFeedbackColumns(queryRunner);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await this.dropDivinationReviewFeedbackColumns(queryRunner);

    if (await queryRunner.hasTable('breathing_records')) {
      await queryRunner.dropTable('breathing_records');
    }

    if (await queryRunner.hasTable('daily_pulse_records')) {
      await queryRunner.dropTable('daily_pulse_records');
    }
  }

  private async ensureDailyPulseRecordsTable(queryRunner: QueryRunner) {
    if (!(await queryRunner.hasTable('daily_pulse_records'))) {
      await queryRunner.createTable(
        new Table({
          name: 'daily_pulse_records',
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
              name: 'recordDate',
              type: 'date',
              isNullable: false,
            },
            {
              name: 'mood',
              type: 'varchar',
              length: '16',
              isNullable: false,
            },
            {
              name: 'intensity',
              type: 'tinyint',
              unsigned: true,
              isNullable: false,
              default: 3,
            },
            {
              name: 'category',
              type: 'varchar',
              length: '32',
              isNullable: true,
            },
            {
              name: 'note',
              type: 'varchar',
              length: '256',
              isNullable: true,
            },
            {
              name: 'responseMood',
              type: 'varchar',
              length: '16',
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
              name: 'idx_pulse_user_date',
              columnNames: ['userId', 'recordDate'],
              isUnique: true,
            }),
          ],
        }),
      );
      return;
    }

    await this.addColumnIfMissing(
      queryRunner,
      'daily_pulse_records',
      new TableColumn({
        name: 'responseMood',
        type: 'varchar',
        length: '16',
        isNullable: true,
      }),
    );
    await this.addIndexIfMissing(
      queryRunner,
      'daily_pulse_records',
      new TableIndex({
        name: 'idx_pulse_user_date',
        columnNames: ['userId', 'recordDate'],
        isUnique: true,
      }),
    );
  }

  private async ensureBreathingRecordsTable(queryRunner: QueryRunner) {
    if (!(await queryRunner.hasTable('breathing_records'))) {
      await queryRunner.createTable(
        new Table({
          name: 'breathing_records',
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
              name: 'mode',
              type: 'varchar',
              length: '32',
              isNullable: false,
            },
            {
              name: 'rounds',
              type: 'smallint',
              unsigned: true,
              isNullable: false,
              default: 1,
            },
            {
              name: 'durationSeconds',
              type: 'smallint',
              unsigned: true,
              isNullable: false,
              default: 60,
            },
            {
              name: 'preMood',
              type: 'varchar',
              length: '16',
              isNullable: true,
            },
            {
              name: 'preMoodIntensity',
              type: 'tinyint',
              unsigned: true,
              isNullable: true,
            },
            {
              name: 'postMood',
              type: 'varchar',
              length: '16',
              isNullable: true,
            },
            {
              name: 'postMoodIntensity',
              type: 'tinyint',
              unsigned: true,
              isNullable: true,
            },
            {
              name: 'createdAt',
              type: 'datetime',
              isNullable: false,
              default: 'CURRENT_TIMESTAMP',
            },
          ],
          indices: [
            new TableIndex({
              name: 'idx_breathing_user',
              columnNames: ['userId'],
            }),
          ],
        }),
      );
      return;
    }

    await this.addIndexIfMissing(
      queryRunner,
      'breathing_records',
      new TableIndex({
        name: 'idx_breathing_user',
        columnNames: ['userId'],
      }),
    );
  }

  private async ensureDivinationReviewFeedbackColumns(
    queryRunner: QueryRunner,
  ) {
    if (!(await queryRunner.hasTable('divination_reviews'))) {
      return;
    }

    await this.addColumnIfMissing(
      queryRunner,
      'divination_reviews',
      new TableColumn({
        name: 'preMood',
        type: 'varchar',
        length: '16',
        isNullable: true,
      }),
    );
    await this.addColumnIfMissing(
      queryRunner,
      'divination_reviews',
      new TableColumn({
        name: 'preMoodIntensity',
        type: 'tinyint',
        unsigned: true,
        isNullable: true,
      }),
    );
    await this.addColumnIfMissing(
      queryRunner,
      'divination_reviews',
      new TableColumn({
        name: 'postMood',
        type: 'varchar',
        length: '16',
        isNullable: true,
      }),
    );
    await this.addColumnIfMissing(
      queryRunner,
      'divination_reviews',
      new TableColumn({
        name: 'postMoodIntensity',
        type: 'tinyint',
        unsigned: true,
        isNullable: true,
      }),
    );
    await this.addColumnIfMissing(
      queryRunner,
      'divination_reviews',
      new TableColumn({
        name: 'expectation',
        type: 'varchar',
        length: '32',
        isNullable: true,
      }),
    );
  }

  private async dropDivinationReviewFeedbackColumns(queryRunner: QueryRunner) {
    if (!(await queryRunner.hasTable('divination_reviews'))) {
      return;
    }

    await this.dropColumnIfExists(
      queryRunner,
      'divination_reviews',
      'expectation',
    );
    await this.dropColumnIfExists(
      queryRunner,
      'divination_reviews',
      'postMoodIntensity',
    );
    await this.dropColumnIfExists(
      queryRunner,
      'divination_reviews',
      'postMood',
    );
    await this.dropColumnIfExists(
      queryRunner,
      'divination_reviews',
      'preMoodIntensity',
    );
    await this.dropColumnIfExists(queryRunner, 'divination_reviews', 'preMood');
  }

  private async addColumnIfMissing(
    queryRunner: QueryRunner,
    tableName: string,
    column: TableColumn,
  ) {
    if (await queryRunner.hasColumn(tableName, column.name)) {
      return;
    }

    await queryRunner.addColumn(tableName, column);
  }

  private async dropColumnIfExists(
    queryRunner: QueryRunner,
    tableName: string,
    columnName: string,
  ) {
    if (!(await queryRunner.hasColumn(tableName, columnName))) {
      return;
    }

    await queryRunner.dropColumn(tableName, columnName);
  }

  private async addIndexIfMissing(
    queryRunner: QueryRunner,
    tableName: string,
    index: TableIndex,
  ) {
    const table = await queryRunner.getTable(tableName);
    if (!table) {
      return;
    }

    const hasIndex = table.indices.some((existing) => {
      const sameColumns =
        existing.columnNames.length === index.columnNames.length &&
        existing.columnNames.every(
          (columnName, idx) => columnName === index.columnNames[idx],
        );
      return existing.name === index.name || sameColumns;
    });

    if (hasIndex) {
      return;
    }

    await queryRunner.createIndex(tableName, index);
  }
}
