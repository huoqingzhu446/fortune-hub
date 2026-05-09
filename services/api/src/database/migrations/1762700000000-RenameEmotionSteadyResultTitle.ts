import { MigrationInterface, QueryRunner } from 'typeorm';

type JsonLike =
  | string
  | number
  | boolean
  | null
  | JsonLike[]
  | { [key: string]: JsonLike };

export class RenameEmotionSteadyResultTitle1762700000000 implements MigrationInterface {
  name = 'RenameEmotionSteadyResultTitle1762700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.replaceStoredTitle(queryRunner, '平稳观察区', '情绪良好');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await this.replaceStoredTitle(queryRunner, '情绪良好', '平稳观察区');
  }

  private async replaceStoredTitle(
    queryRunner: QueryRunner,
    from: string,
    to: string,
  ) {
    await this.replaceAssessmentConfigs(queryRunner, from, to);
    await this.replaceEmotionRecords(queryRunner, from, to);
  }

  private async replaceAssessmentConfigs(
    queryRunner: QueryRunner,
    from: string,
    to: string,
  ) {
    if (!(await queryRunner.hasTable('assessment_test_configs'))) {
      return;
    }

    const rows = (await queryRunner.query(
      'SELECT id, configJson FROM assessment_test_configs WHERE category = ?',
      ['emotion'],
    )) as Array<Record<string, unknown>>;

    for (const row of rows) {
      const configJson = this.parseJson(row.configJson);
      const replaced = this.replaceJsonText(configJson, from, to);

      if (!replaced.changed) {
        continue;
      }

      await queryRunner.query(
        'UPDATE assessment_test_configs SET configJson = CAST(? AS JSON), updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
        [JSON.stringify(replaced.value), row.id],
      );
    }
  }

  private async replaceEmotionRecords(
    queryRunner: QueryRunner,
    from: string,
    to: string,
  ) {
    if (!(await queryRunner.hasTable('records'))) {
      return;
    }

    const rows = (await queryRunner.query(
      'SELECT id, resultTitle, resultData FROM records WHERE recordType = ?',
      ['emotion'],
    )) as Array<Record<string, unknown>>;

    for (const row of rows) {
      const resultTitle =
        typeof row.resultTitle === 'string'
          ? row.resultTitle.split(from).join(to)
          : row.resultTitle;
      const resultData = this.parseJson(row.resultData);
      const replaced = this.replaceJsonText(resultData, from, to);
      const titleChanged = resultTitle !== row.resultTitle;

      if (!titleChanged && !replaced.changed) {
        continue;
      }

      await queryRunner.query(
        'UPDATE records SET resultTitle = ?, resultData = CAST(? AS JSON), updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
        [
          titleChanged ? resultTitle : row.resultTitle,
          JSON.stringify(replaced.value),
          row.id,
        ],
      );
    }
  }

  private parseJson(value: unknown): JsonLike {
    if (typeof value !== 'string') {
      return value as JsonLike;
    }

    try {
      return JSON.parse(value) as JsonLike;
    } catch {
      return value;
    }
  }

  private replaceJsonText(
    value: JsonLike,
    from: string,
    to: string,
  ): { value: JsonLike; changed: boolean } {
    if (typeof value === 'string') {
      const next = value.split(from).join(to);
      return {
        value: next,
        changed: next !== value,
      };
    }

    if (Array.isArray(value)) {
      let changed = false;
      const next = value.map((item) => {
        const replaced = this.replaceJsonText(item, from, to);
        changed = changed || replaced.changed;
        return replaced.value;
      });

      return { value: next, changed };
    }

    if (value && typeof value === 'object') {
      let changed = false;
      const next = Object.fromEntries(
        Object.entries(value).map(([key, item]) => {
          const replaced = this.replaceJsonText(item, from, to);
          changed = changed || replaced.changed;
          return [key, replaced.value];
        }),
      );

      return { value: next, changed };
    }

    return { value, changed: false };
  }
}
