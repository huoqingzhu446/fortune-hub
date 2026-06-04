import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddWechatPayFieldsToOrders1763900000000
  implements MigrationInterface
{
  name = 'AddWechatPayFieldsToOrders1763900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.addColumnIfMissing(
      queryRunner,
      'orders',
      new TableColumn({
        name: 'paymentChannel',
        type: 'varchar',
        length: '32',
        isNullable: true,
      }),
    );
    await this.addColumnIfMissing(
      queryRunner,
      'orders',
      new TableColumn({
        name: 'paymentProvider',
        type: 'varchar',
        length: '32',
        isNullable: true,
      }),
    );
    await this.addColumnIfMissing(
      queryRunner,
      'orders',
      new TableColumn({
        name: 'paymentStatus',
        type: 'varchar',
        length: '32',
        isNullable: true,
      }),
    );
    await this.addColumnIfMissing(
      queryRunner,
      'orders',
      new TableColumn({
        name: 'paymentNotifyId',
        type: 'varchar',
        length: '64',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await this.dropColumnIfExists(queryRunner, 'orders', 'paymentNotifyId');
    await this.dropColumnIfExists(queryRunner, 'orders', 'paymentStatus');
    await this.dropColumnIfExists(queryRunner, 'orders', 'paymentProvider');
    await this.dropColumnIfExists(queryRunner, 'orders', 'paymentChannel');
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
}
