import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedMeditationMusicConfig1761329800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const existing = await queryRunner.query(
      `
        SELECT id
        FROM configs
        WHERE namespace = ? AND configKey = ?
        LIMIT 1
      `,
      ['meditation', 'music_library'],
    );

    if (Array.isArray(existing) && existing.length) {
      return;
    }

    const payload = JSON.stringify({
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
    });

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
        '移动端冥想页可选音乐列表，支持试听链接与分类配置。',
        'json',
        payload,
        'published',
      ],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
        DELETE FROM configs
        WHERE namespace = ? AND configKey = ?
      `,
      ['meditation', 'music_library'],
    );
  }
}
