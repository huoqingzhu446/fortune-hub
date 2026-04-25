import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableIndex,
} from 'typeorm';

export class SettingsFeedbackNotificationsOps1761333600000 implements MigrationInterface {
  name = 'SettingsFeedbackNotificationsOps1761333600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.ensureFeedbacksTable(queryRunner);
    await this.ensurePushSubscriptionsTable(queryRunner);
    await this.ensurePushDeliveryLogsTable(queryRunner);
    await this.ensureAuditLogsTable(queryRunner);
    await this.ensureReportTemplateVersionsTable(queryRunner);
    await this.ensurePosterJobsTable(queryRunner);
    await this.ensureShareFileColumns(queryRunner);
    await this.seedDefaultConfigs(queryRunner);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await this.dropColumnIfExists(queryRunner, 'shares', 'fileUrl');
    await this.dropColumnIfExists(queryRunner, 'shares', 'storageProvider');
    await this.dropColumnIfExists(queryRunner, 'shares', 'templateVersion');

    for (const tableName of [
      'poster_jobs',
      'report_template_versions',
      'audit_logs',
      'push_delivery_logs',
      'push_subscriptions',
      'feedbacks',
    ]) {
      if (await queryRunner.hasTable(tableName)) {
        await queryRunner.dropTable(tableName);
      }
    }
  }

  private async ensureFeedbacksTable(queryRunner: QueryRunner) {
    if (await queryRunner.hasTable('feedbacks')) {
      return;
    }

    await queryRunner.createTable(
      new Table({
        name: 'feedbacks',
        columns: [
          this.idColumn(),
          { name: 'userId', type: 'bigint', unsigned: true, isNullable: true },
          { name: 'contact', type: 'varchar', length: '64', isNullable: true },
          { name: 'category', type: 'varchar', length: '32', default: "'general'" },
          { name: 'source', type: 'varchar', length: '32', default: "'mobile'" },
          { name: 'status', type: 'varchar', length: '16', default: "'open'" },
          { name: 'message', type: 'text' },
          { name: 'adminNote', type: 'text', isNullable: true },
          { name: 'clientInfoJson', type: 'json', isNullable: true },
          { name: 'resolvedAt', type: 'datetime', isNullable: true },
          this.createdAtColumn(),
          this.updatedAtColumn(),
        ],
        indices: [
          new TableIndex({
            name: 'idx_feedbacks_user_status',
            columnNames: ['userId', 'status'],
          }),
          new TableIndex({
            name: 'idx_feedbacks_created_at',
            columnNames: ['createdAt'],
          }),
        ],
      }),
    );
  }

  private async ensurePushSubscriptionsTable(queryRunner: QueryRunner) {
    if (await queryRunner.hasTable('push_subscriptions')) {
      return;
    }

    await queryRunner.createTable(
      new Table({
        name: 'push_subscriptions',
        columns: [
          this.idColumn(),
          { name: 'userId', type: 'bigint', unsigned: true },
          { name: 'scene', type: 'varchar', length: '32' },
          { name: 'templateId', type: 'varchar', length: '128' },
          { name: 'status', type: 'varchar', length: '16', default: "'active'" },
          { name: 'extraJson', type: 'json', isNullable: true },
          { name: 'lastSubscribedAt', type: 'datetime' },
          { name: 'expireAt', type: 'datetime', isNullable: true },
          this.createdAtColumn(),
          this.updatedAtColumn(),
        ],
        indices: [
          new TableIndex({
            name: 'uniq_push_subscriptions_user_scene_template',
            columnNames: ['userId', 'scene', 'templateId'],
            isUnique: true,
          }),
          new TableIndex({
            name: 'idx_push_subscriptions_scene_status',
            columnNames: ['scene', 'status'],
          }),
        ],
      }),
    );
  }

  private async ensurePushDeliveryLogsTable(queryRunner: QueryRunner) {
    if (await queryRunner.hasTable('push_delivery_logs')) {
      return;
    }

    await queryRunner.createTable(
      new Table({
        name: 'push_delivery_logs',
        columns: [
          this.idColumn(),
          { name: 'userId', type: 'bigint', unsigned: true },
          { name: 'scene', type: 'varchar', length: '32' },
          { name: 'templateId', type: 'varchar', length: '128' },
          { name: 'status', type: 'varchar', length: '16', default: "'queued'" },
          { name: 'errorMessage', type: 'varchar', length: '255', isNullable: true },
          { name: 'payloadJson', type: 'json', isNullable: true },
          { name: 'retryCount', type: 'int', unsigned: true, default: '0' },
          { name: 'nextRetryAt', type: 'datetime', isNullable: true },
          { name: 'sentAt', type: 'datetime', isNullable: true },
          this.createdAtColumn(),
          this.updatedAtColumn(),
        ],
        indices: [
          new TableIndex({
            name: 'idx_push_delivery_logs_user_scene',
            columnNames: ['userId', 'scene'],
          }),
          new TableIndex({
            name: 'idx_push_delivery_logs_status_retry',
            columnNames: ['status', 'nextRetryAt'],
          }),
        ],
      }),
    );
  }

  private async ensureAuditLogsTable(queryRunner: QueryRunner) {
    if (await queryRunner.hasTable('audit_logs')) {
      return;
    }

    await queryRunner.createTable(
      new Table({
        name: 'audit_logs',
        columns: [
          this.idColumn(),
          { name: 'actorType', type: 'varchar', length: '16', default: "'admin'" },
          { name: 'actorId', type: 'varchar', length: '64', isNullable: true },
          { name: 'action', type: 'varchar', length: '64' },
          { name: 'resourceType', type: 'varchar', length: '64' },
          { name: 'resourceId', type: 'varchar', length: '64', isNullable: true },
          { name: 'payloadJson', type: 'json', isNullable: true },
          this.createdAtColumn(),
        ],
        indices: [
          new TableIndex({
            name: 'idx_audit_logs_actor_action',
            columnNames: ['actorType', 'action'],
          }),
          new TableIndex({
            name: 'idx_audit_logs_resource',
            columnNames: ['resourceType', 'resourceId'],
          }),
        ],
      }),
    );
  }

  private async ensureReportTemplateVersionsTable(queryRunner: QueryRunner) {
    if (await queryRunner.hasTable('report_template_versions')) {
      return;
    }

    await queryRunner.createTable(
      new Table({
        name: 'report_template_versions',
        columns: [
          this.idColumn(),
          { name: 'templateId', type: 'bigint', unsigned: true },
          { name: 'templateType', type: 'varchar', length: '64' },
          { name: 'bizCode', type: 'varchar', length: '64' },
          { name: 'versionNo', type: 'int', unsigned: true },
          { name: 'title', type: 'varchar', length: '128' },
          { name: 'engine', type: 'varchar', length: '32', default: "'json'" },
          { name: 'payloadJson', type: 'json' },
          { name: 'status', type: 'varchar', length: '16', default: "'snapshot'" },
          { name: 'createdBy', type: 'varchar', length: '64', isNullable: true },
          this.createdAtColumn(),
        ],
        indices: [
          new TableIndex({
            name: 'idx_report_template_versions_template',
            columnNames: ['templateId', 'versionNo'],
          }),
          new TableIndex({
            name: 'idx_report_template_versions_type_code',
            columnNames: ['templateType', 'bizCode'],
          }),
        ],
      }),
    );
  }

  private async ensurePosterJobsTable(queryRunner: QueryRunner) {
    if (await queryRunner.hasTable('poster_jobs')) {
      return;
    }

    await queryRunner.createTable(
      new Table({
        name: 'poster_jobs',
        columns: [
          this.idColumn(),
          { name: 'jobId', type: 'varchar', length: '64' },
          { name: 'userId', type: 'bigint', unsigned: true, isNullable: true },
          { name: 'jobType', type: 'varchar', length: '32' },
          { name: 'status', type: 'varchar', length: '16', default: "'queued'" },
          { name: 'requestJson', type: 'json', isNullable: true },
          { name: 'resultJson', type: 'json', isNullable: true },
          { name: 'fileUrl', type: 'varchar', length: '255', isNullable: true },
          { name: 'errorMessage', type: 'varchar', length: '255', isNullable: true },
          { name: 'startedAt', type: 'datetime', isNullable: true },
          { name: 'finishedAt', type: 'datetime', isNullable: true },
          this.createdAtColumn(),
          this.updatedAtColumn(),
        ],
        indices: [
          new TableIndex({
            name: 'uniq_poster_jobs_job_id',
            columnNames: ['jobId'],
            isUnique: true,
          }),
          new TableIndex({
            name: 'idx_poster_jobs_user_status',
            columnNames: ['userId', 'status'],
          }),
        ],
      }),
    );
  }

  private async ensureShareFileColumns(queryRunner: QueryRunner) {
    await this.addColumnIfMissing(
      queryRunner,
      'shares',
      new TableColumn({
        name: 'fileUrl',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
    );
    await this.addColumnIfMissing(
      queryRunner,
      'shares',
      new TableColumn({
        name: 'storageProvider',
        type: 'varchar',
        length: '32',
        isNullable: true,
      }),
    );
    await this.addColumnIfMissing(
      queryRunner,
      'shares',
      new TableColumn({
        name: 'templateVersion',
        type: 'int',
        unsigned: true,
        isNullable: true,
      }),
    );
  }

  private async seedDefaultConfigs(queryRunner: QueryRunner) {
    await this.insertConfigIfMissing(queryRunner, {
      namespace: 'settings',
      configKey: 'public',
      title: '设置中心公开配置',
      description: '控制隐私说明、反馈分类和订阅消息文案。',
      valueJson: JSON.stringify({
        privacyVersion: '2026-04-25',
        privacySummary: '用于登录、保存历史、同步偏好、发送订阅提醒与处理反馈。',
        feedbackCategories: [
          { label: '功能建议', value: 'feature' },
          { label: '问题反馈', value: 'bug' },
          { label: '内容纠错', value: 'content' },
          { label: '其他', value: 'general' },
        ],
        notificationScenes: [
          { scene: 'daily_reminder', title: '每日幸运提醒', enabled: true },
          { scene: 'lucky_push', title: '幸运物推荐提醒', enabled: true },
        ],
      }),
    });

    await this.insertConfigIfMissing(queryRunner, {
      namespace: 'compliance',
      configKey: 'emotion_support',
      title: '情绪合规与危机支持配置',
      description: '控制情绪自检免责声明版本、危机提示和支持资源。',
      valueJson: JSON.stringify({
        disclaimerVersion: '2026-04-25',
        disclaimer:
          '本结果仅用于日常自我观察，不构成医学诊断或治疗建议；如持续不适，请及时联系专业机构。',
        crisisTitle: '请优先获得现实支持',
        crisisMessage:
          '如果你已经出现明显失控感、持续失眠或伤害自己的想法，请立即联系急救、医院或当地心理危机干预资源。',
        resources: [
          { region: '中国大陆', name: '紧急医疗救助', phone: '120', type: 'emergency' },
          { region: '中国大陆', name: '公安报警', phone: '110', type: 'emergency' },
        ],
      }),
    });

    await this.insertConfigIfMissing(queryRunner, {
      namespace: 'lucky',
      configKey: 'recommendation_rules',
      title: '幸运物推荐规则',
      description: '控制幸运物推荐的适配分和标签。',
      valueJson: JSON.stringify({
        defaultBaseScore: 68,
        elementBoost: 12,
        zodiacBoost: 9,
        baziBoost: 6,
        personalityBoost: 8,
        emotionBoost: 10,
        emotionSteadyBoost: 4,
        rules: {},
      }),
    });

    await this.insertConfigIfMissing(queryRunner, {
      namespace: 'lucky',
      configKey: 'yearly_detail',
      title: '年度幸运详情',
      description: '年度幸运详情默认模板。',
      valueJson: JSON.stringify({
        title: '年度幸运节奏',
        summary: '这一年适合把优势沉淀成稳定节奏，也给自己保留恢复空间。',
        quarters: [
          { label: 'Q1', title: '整理基础', summary: '先把日常节奏和核心目标排清楚。' },
          { label: 'Q2', title: '主动推进', summary: '适合打开合作、表达和重要项目。' },
          { label: 'Q3', title: '复盘调频', summary: '把消耗点收回来，优化自己的行动方式。' },
          { label: 'Q4', title: '沉淀成果', summary: '把已经有效的方法整理成可复用模板。' },
        ],
      }),
    });
  }

  private async insertConfigIfMissing(
    queryRunner: QueryRunner,
    input: {
      namespace: string;
      configKey: string;
      title: string;
      description: string;
      valueJson: string;
    },
  ) {
    const existing = await queryRunner.query(
      'SELECT id FROM configs WHERE namespace = ? AND configKey = ? LIMIT 1',
      [input.namespace, input.configKey],
    );

    if (Array.isArray(existing) && existing.length) {
      return;
    }

    await queryRunner.query(
      `INSERT INTO configs
        (namespace, configKey, title, description, valueType, valueJson, status, publishedAt, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, 'json', CAST(? AS JSON), 'published', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [input.namespace, input.configKey, input.title, input.description, input.valueJson],
    );
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
      isNullable: false,
      default: 'CURRENT_TIMESTAMP',
    };
  }

  private updatedAtColumn() {
    return {
      name: 'updatedAt',
      type: 'datetime',
      isNullable: false,
      default: 'CURRENT_TIMESTAMP',
      onUpdate: 'CURRENT_TIMESTAMP',
    };
  }

  private async addColumnIfMissing(
    queryRunner: QueryRunner,
    tableName: string,
    column: TableColumn,
  ) {
    if (!(await queryRunner.hasTable(tableName))) {
      return;
    }

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
    if (
      (await queryRunner.hasTable(tableName)) &&
      (await queryRunner.hasColumn(tableName, columnName))
    ) {
      await queryRunner.dropColumn(tableName, columnName);
    }
  }
}
