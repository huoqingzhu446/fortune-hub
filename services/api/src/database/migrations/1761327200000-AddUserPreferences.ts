import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddUserPreferences1761327200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasPreferencesColumn = await queryRunner.hasColumn('users', 'preferencesJson');

    if (!hasPreferencesColumn) {
      await queryRunner.addColumn(
        'users',
        new TableColumn({
          name: 'preferencesJson',
          type: 'json',
          isNullable: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasPreferencesColumn = await queryRunner.hasColumn('users', 'preferencesJson');

    if (hasPreferencesColumn) {
      await queryRunner.dropColumn('users', 'preferencesJson');
    }
  }
}
