import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

const OLD_MEDITATION_MUSIC_IDS = [
  'moon-breath',
  'forest-focus',
  'tidal-reset',
  'silent-count',
] as const;

const ENRICHED_MEDITATION_MUSIC_PAYLOAD = {
  items: [
    {
      id: 'evening-body-scan',
      title: '睡前身体扫描',
      subtitle: '从脚到头慢慢放松，适合睡前 15 分钟关闭白天的紧绷。',
      category: 'sleep',
      categoryLabel: '睡前安睡',
      durationMinutes: 12,
      atmosphere: '低频环境音',
      scene: '入睡困难、身体紧绷、脑内还在复盘白天时使用。',
      guide: ['调暗灯光，放下手机', '从脚趾开始逐段放松', '结束后不再处理复杂信息'],
      tags: ['安睡', '身体放松', '晚间'],
      previewUrl: 'https://actions.google.com/sounds/v1/ambiences/ocean_waves.ogg',
      enabled: true,
    },
    {
      id: 'box-breath-reset',
      title: '四拍呼吸复位',
      subtitle: '吸气、停顿、呼气、停顿各四拍，快速把注意力带回身体。',
      category: 'breath',
      categoryLabel: '呼吸减压',
      durationMinutes: 5,
      atmosphere: '极简提示音',
      scene: '焦虑上头、会议前、通勤中或需要马上降速时使用。',
      guide: ['吸气 4 拍', '停顿 4 拍', '呼气 4 拍，再停顿 4 拍'],
      tags: ['急救', '短练习', '呼吸'],
      previewUrl: 'https://actions.google.com/sounds/v1/ambiences/woodland_night.ogg',
      enabled: true,
    },
    {
      id: 'forest-focus',
      title: '林间专注启动',
      subtitle: '先稳定呼吸，再给今天最重要的一件事留出清晰入口。',
      category: 'focus',
      categoryLabel: '专注启动',
      durationMinutes: 10,
      atmosphere: '自然环境音',
      scene: '开始工作、学习前，或注意力碎片化时使用。',
      guide: ['写下一个任务', '跟随 10 次自然呼吸', '结束后立刻开始第一步'],
      tags: ['专注', '工作前', '清晰'],
      previewUrl: 'https://actions.google.com/sounds/v1/ambiences/birds_in_forest.ogg',
      enabled: true,
    },
    {
      id: 'tidal-emotion-reset',
      title: '潮汐情绪复位',
      subtitle: '允许情绪像潮水一样来去，练习不评判地观察和安放。',
      category: 'healing',
      categoryLabel: '情绪修复',
      durationMinutes: 8,
      atmosphere: '海浪与低频铺底',
      scene: '情绪起伏、委屈、烦躁或需要重新稳定身体节奏时使用。',
      guide: ['给情绪命名', '把注意力放到胸口或腹部', '用一句温柔的话收束'],
      tags: ['情绪', '接纳', '复位'],
      previewUrl: 'https://actions.google.com/sounds/v1/water/dripping_water.ogg',
      enabled: true,
    },
    {
      id: 'morning-grounding',
      title: '晨间安定练习',
      subtitle: '用 7 分钟确认身体、环境和今天的优先级，让一天不被推着走。',
      category: 'meditation',
      categoryLabel: '基础静心',
      durationMinutes: 7,
      atmosphere: '清晨轻环境音',
      scene: '起床后、出门前，或想给一天定一个稳定基调时使用。',
      guide: ['感受双脚和坐骨', '观察三处环境声音', '确认今天只先做好一件事'],
      tags: ['晨间', '安定', '意图'],
      previewUrl: 'https://actions.google.com/sounds/v1/ambiences/birds_in_forest.ogg',
      enabled: true,
    },
    {
      id: 'shoulder-release',
      title: '肩颈松开练习',
      subtitle: '把注意力放到肩颈、下颌和眼周，适合久坐后的身体修复。',
      category: 'body',
      categoryLabel: '身体扫描',
      durationMinutes: 9,
      atmosphere: '柔和白噪',
      scene: '久坐、肩颈紧、头脑疲惫但又不想睡觉时使用。',
      guide: ['觉察肩膀高度', '放松下颌和眼周', '缓慢转动肩颈后记录身体变化'],
      tags: ['肩颈', '久坐', '身体觉察'],
      previewUrl: 'https://actions.google.com/sounds/v1/ambiences/ocean_waves.ogg',
      enabled: true,
    },
  ],
};

const OLD_MEDITATION_MUSIC_PAYLOAD = {
  items: [
    {
      id: 'moon-breath',
      title: '月光呼吸',
      subtitle: '适合睡前放松，呼吸节奏更慢一点。',
      category: 'sleep',
      durationMinutes: 12,
      atmosphere: '柔和白噪',
      previewUrl: 'https://actions.google.com/sounds/v1/ambiences/ocean_waves.ogg',
      enabled: true,
    },
    {
      id: 'forest-focus',
      title: '林间专注',
      subtitle: '适合工作前整理心绪，安静进入状态。',
      category: 'focus',
      durationMinutes: 10,
      atmosphere: '自然环境音',
      previewUrl: 'https://actions.google.com/sounds/v1/ambiences/birds_in_forest.ogg',
      enabled: true,
    },
    {
      id: 'tidal-reset',
      title: '潮汐复位',
      subtitle: '适合情绪起伏后，重新稳定身体节奏。',
      category: 'healing',
      durationMinutes: 8,
      atmosphere: '海浪与低频铺底',
      previewUrl: 'https://actions.google.com/sounds/v1/water/dripping_water.ogg',
      enabled: true,
    },
    {
      id: 'silent-count',
      title: '静数呼吸',
      subtitle: '适合短时间呼吸练习，轻量不打扰。',
      category: 'breath',
      durationMinutes: 5,
      atmosphere: '极简提示音',
      previewUrl: 'https://actions.google.com/sounds/v1/ambiences/woodland_night.ogg',
      enabled: true,
    },
  ],
};

export class EnrichMeditationRecords1761365000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.addColumnIfMissing(queryRunner, 'intention', 'varchar', '120');
    await this.addColumnIfMissing(queryRunner, 'moodBefore', 'varchar', '32');
    await this.addColumnIfMissing(queryRunner, 'moodAfter', 'varchar', '32');
    await this.addColumnIfMissing(queryRunner, 'focusScore', 'tinyint', undefined, true);
    await this.addColumnIfMissing(queryRunner, 'bodySignal', 'varchar', '120');
    await this.addColumnIfMissing(queryRunner, 'insight', 'varchar', '255');
    await this.addColumnIfMissing(queryRunner, 'nextAction', 'varchar', '120');
    await this.refreshDefaultMeditationMusic(queryRunner);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await this.restoreOldMeditationMusic(queryRunner);
    await this.dropColumnIfExists(queryRunner, 'nextAction');
    await this.dropColumnIfExists(queryRunner, 'insight');
    await this.dropColumnIfExists(queryRunner, 'bodySignal');
    await this.dropColumnIfExists(queryRunner, 'focusScore');
    await this.dropColumnIfExists(queryRunner, 'moodAfter');
    await this.dropColumnIfExists(queryRunner, 'moodBefore');
    await this.dropColumnIfExists(queryRunner, 'intention');
  }

  private async addColumnIfMissing(
    queryRunner: QueryRunner,
    name: string,
    type: string,
    length?: string,
    unsigned = false,
  ) {
    if (await queryRunner.hasColumn('meditation_records', name)) {
      return;
    }

    await queryRunner.addColumn(
      'meditation_records',
      new TableColumn({
        name,
        type,
        length,
        unsigned,
        isNullable: true,
      }),
    );
  }

  private async dropColumnIfExists(queryRunner: QueryRunner, name: string) {
    if (await queryRunner.hasColumn('meditation_records', name)) {
      await queryRunner.dropColumn('meditation_records', name);
    }
  }

  private async refreshDefaultMeditationMusic(queryRunner: QueryRunner) {
    const rows = await this.loadMusicConfig(queryRunner);
    const payload = JSON.stringify(ENRICHED_MEDITATION_MUSIC_PAYLOAD);

    if (!rows.length) {
      await queryRunner.query(
        `
          INSERT INTO configs
            (namespace, configKey, title, description, valueType, valueJson, status, publishedAt, archivedAt, createdAt, updatedAt)
          VALUES
            (?, ?, ?, ?, ?, CAST(? AS JSON), ?, UTC_TIMESTAMP(), NULL, UTC_TIMESTAMP(), UTC_TIMESTAMP())
        `,
        [
          'meditation',
          'music_library',
          '冥想音乐库',
          '移动端冥想页可选音乐列表，包含场景、步骤与分类中文展示。',
          'json',
          payload,
          'published',
        ],
      );
      return;
    }

    const currentValue = this.parseJson(rows[0].valueJson);
    if (!this.shouldReplaceDefaultMusic(currentValue)) {
      return;
    }

    await queryRunner.query(
      `
        UPDATE configs
        SET title = ?, description = ?, valueJson = CAST(? AS JSON), status = ?, publishedAt = COALESCE(publishedAt, UTC_TIMESTAMP()), updatedAt = UTC_TIMESTAMP()
        WHERE namespace = ? AND configKey = ?
      `,
      [
        '冥想音乐库',
        '移动端冥想页可选音乐列表，包含场景、步骤与分类中文展示。',
        payload,
        'published',
        'meditation',
        'music_library',
      ],
    );
  }

  private async restoreOldMeditationMusic(queryRunner: QueryRunner) {
    const rows = await this.loadMusicConfig(queryRunner);
    if (!rows.length) {
      return;
    }

    const currentValue = this.parseJson(rows[0].valueJson);
    if (!this.shouldRestoreOldMusic(currentValue)) {
      return;
    }

    await queryRunner.query(
      `
        UPDATE configs
        SET valueJson = CAST(? AS JSON), updatedAt = UTC_TIMESTAMP()
        WHERE namespace = ? AND configKey = ?
      `,
      [JSON.stringify(OLD_MEDITATION_MUSIC_PAYLOAD), 'meditation', 'music_library'],
    );
  }

  private async loadMusicConfig(queryRunner: QueryRunner): Promise<Array<{ valueJson: unknown }>> {
    return queryRunner.query(
      `
        SELECT valueJson
        FROM configs
        WHERE namespace = ? AND configKey = ?
        LIMIT 1
      `,
      ['meditation', 'music_library'],
    );
  }

  private parseJson(value: unknown): Record<string, unknown> | null {
    if (!value) {
      return null;
    }

    if (typeof value === 'string') {
      try {
        return JSON.parse(value) as Record<string, unknown>;
      } catch {
        return null;
      }
    }

    if (typeof value === 'object') {
      return value as Record<string, unknown>;
    }

    return null;
  }

  private shouldReplaceDefaultMusic(value: Record<string, unknown> | null) {
    if (!value) {
      return true;
    }

    const items = Array.isArray(value.items) ? value.items : [];
    const ids = items
      .map((item) => (item && typeof item === 'object' ? (item as { id?: unknown }).id : null))
      .filter((id): id is string => typeof id === 'string');

    return (
      ids.length > 0 &&
      ids.length <= OLD_MEDITATION_MUSIC_IDS.length &&
      ids.every((id) => OLD_MEDITATION_MUSIC_IDS.includes(id as typeof OLD_MEDITATION_MUSIC_IDS[number]))
    );
  }

  private shouldRestoreOldMusic(value: Record<string, unknown> | null) {
    if (!value) {
      return false;
    }

    const items = Array.isArray(value.items) ? value.items : [];
    const ids = items
      .map((item) => (item && typeof item === 'object' ? (item as { id?: unknown }).id : null))
      .filter((id): id is string => typeof id === 'string');

    return ids.includes('evening-body-scan') && ids.includes('box-breath-reset');
  }
}
