import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableIndex,
} from 'typeorm';

export class AddPhoneAuthToUsers1762900000000 implements MigrationInterface {
  name = 'AddPhoneAuthToUsers1762900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('users'))) {
      return;
    }

    await queryRunner.query(
      'ALTER TABLE `users` MODIFY `openid` varchar(64) NULL',
    );
    await this.addColumnIfMissing(
      queryRunner,
      new TableColumn({
        name: 'phone',
        type: 'varchar',
        length: '20',
        isNullable: true,
      }),
    );
    await this.addColumnIfMissing(
      queryRunner,
      new TableColumn({
        name: 'phoneVerifiedAt',
        type: 'datetime',
        isNullable: true,
      }),
    );
    await this.addColumnIfMissing(
      queryRunner,
      new TableColumn({
        name: 'lastLoginProvider',
        type: 'varchar',
        length: '16',
        isNullable: true,
      }),
    );
    await this.createIndexIfMissing(
      queryRunner,
      new TableIndex({
        name: 'uniq_users_phone',
        columnNames: ['phone'],
        isUnique: true,
      }),
    );

    await queryRunner.query(
      "UPDATE `users` SET `lastLoginProvider` = CASE WHEN `openid` LIKE 'mock\\_%' THEN 'mock' ELSE 'wechat' END WHERE `lastLoginProvider` IS NULL AND `openid` IS NOT NULL",
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('users'))) {
      return;
    }

    await queryRunner.query(
      "UPDATE `users` SET `openid` = CONCAT('phone_', SUBSTRING(SHA2(CONCAT(`id`, ':', COALESCE(`phone`, '')), 256), 1, 24)) WHERE `openid` IS NULL",
    );
    await queryRunner.query(
      'ALTER TABLE `users` MODIFY `openid` varchar(64) NOT NULL',
    );
    await this.dropIndexIfExists(queryRunner, 'uniq_users_phone');
    await this.dropColumnIfExists(queryRunner, 'lastLoginProvider');
    await this.dropColumnIfExists(queryRunner, 'phoneVerifiedAt');
    await this.dropColumnIfExists(queryRunner, 'phone');
  }

  private async addColumnIfMissing(
    queryRunner: QueryRunner,
    column: TableColumn,
  ) {
    const table = await queryRunner.getTable('users');
    if (!table?.findColumnByName(column.name)) {
      await queryRunner.addColumn('users', column);
    }
  }

  private async dropColumnIfExists(
    queryRunner: QueryRunner,
    columnName: string,
  ) {
    const table = await queryRunner.getTable('users');
    if (table?.findColumnByName(columnName)) {
      await queryRunner.dropColumn('users', columnName);
    }
  }

  private async createIndexIfMissing(
    queryRunner: QueryRunner,
    index: TableIndex,
  ) {
    const table = await queryRunner.getTable('users');
    if (!table || table.indices.some((item) => item.name === index.name)) {
      return;
    }

    await queryRunner.createIndex('users', index);
  }

  private async dropIndexIfExists(queryRunner: QueryRunner, indexName: string) {
    const table = await queryRunner.getTable('users');
    const index = table?.indices.find((item) => item.name === indexName);
    if (index) {
      await queryRunner.dropIndex('users', index);
    }
  }
}
