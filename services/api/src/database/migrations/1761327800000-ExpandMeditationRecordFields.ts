import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class ExpandMeditationRecordFields1761327800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasSourceType = await queryRunner.hasColumn('meditation_records', 'sourceType');
    const hasSourceTitle = await queryRunner.hasColumn('meditation_records', 'sourceTitle');
    const hasCompletionStatus = await queryRunner.hasColumn(
      'meditation_records',
      'completionStatus',
    );

    if (!hasSourceType) {
      await queryRunner.addColumn(
        'meditation_records',
        new TableColumn({
          name: 'sourceType',
          type: 'varchar',
          length: '32',
          default: "'custom'",
        }),
      );
    }

    if (!hasSourceTitle) {
      await queryRunner.addColumn(
        'meditation_records',
        new TableColumn({
          name: 'sourceTitle',
          type: 'varchar',
          length: '128',
          isNullable: true,
        }),
      );
    }

    if (!hasCompletionStatus) {
      await queryRunner.addColumn(
        'meditation_records',
        new TableColumn({
          name: 'completionStatus',
          type: 'varchar',
          length: '16',
          default: "'completed'",
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasColumn('meditation_records', 'completionStatus')) {
      await queryRunner.dropColumn('meditation_records', 'completionStatus');
    }

    if (await queryRunner.hasColumn('meditation_records', 'sourceTitle')) {
      await queryRunner.dropColumn('meditation_records', 'sourceTitle');
    }

    if (await queryRunner.hasColumn('meditation_records', 'sourceType')) {
      await queryRunner.dropColumn('meditation_records', 'sourceType');
    }
  }
}
