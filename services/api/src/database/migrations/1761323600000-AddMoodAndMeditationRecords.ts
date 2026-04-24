import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class AddMoodAndMeditationRecords1761323600000
  implements MigrationInterface
{
  name = 'AddMoodAndMeditationRecords1761323600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.ensureMoodRecordsTable(queryRunner);
    await this.ensureMeditationRecordsTable(queryRunner);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('meditation_records')) {
      await queryRunner.dropTable('meditation_records');
    }

    if (await queryRunner.hasTable('mood_records')) {
      await queryRunner.dropTable('mood_records');
    }
  }

  private async ensureMoodRecordsTable(queryRunner: QueryRunner) {
    if (await queryRunner.hasTable('mood_records')) {
      return;
    }

    await queryRunner.createTable(
      new Table({
        name: 'mood_records',
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
            name: 'moodType',
            type: 'varchar',
            length: '16',
            isNullable: false,
          },
          {
            name: 'moodScore',
            type: 'int',
            unsigned: true,
            isNullable: false,
          },
          {
            name: 'emotionTags',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'content',
            type: 'text',
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
            name: 'uniq_mood_records_user_date',
            columnNames: ['userId', 'recordDate'],
            isUnique: true,
          }),
          new TableIndex({
            name: 'idx_mood_records_user_updated_at',
            columnNames: ['userId', 'updatedAt'],
          }),
        ],
      }),
    );
  }

  private async ensureMeditationRecordsTable(queryRunner: QueryRunner) {
    if (await queryRunner.hasTable('meditation_records')) {
      return;
    }

    await queryRunner.createTable(
      new Table({
        name: 'meditation_records',
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
            name: 'title',
            type: 'varchar',
            length: '128',
            isNullable: false,
          },
          {
            name: 'category',
            type: 'varchar',
            length: '32',
            isNullable: false,
            default: "'meditation'",
          },
          {
            name: 'durationMinutes',
            type: 'int',
            unsigned: true,
            isNullable: false,
          },
          {
            name: 'completed',
            type: 'boolean',
            isNullable: false,
            default: true,
          },
          {
            name: 'summary',
            type: 'varchar',
            length: '255',
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
            name: 'idx_meditation_records_user_record_date',
            columnNames: ['userId', 'recordDate'],
          }),
          new TableIndex({
            name: 'idx_meditation_records_user_updated_at',
            columnNames: ['userId', 'updatedAt'],
          }),
        ],
      }),
    );
  }
}
