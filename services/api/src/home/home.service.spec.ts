import { HomeService } from './home.service';
import { MoodRecordEntity } from '../database/entities/mood-record.entity';
import { UserRecordEntity } from '../database/entities/user-record.entity';
import { UserEntity } from '../database/entities/user.entity';

describe('HomeService current state score', () => {
  const createService = (options: {
    records?: UserRecordEntity[];
    moods?: MoodRecordEntity[];
  }) =>
    new HomeService(
      { get: jest.fn((_key: string, fallback: unknown) => fallback) } as never,
      { getStatus: jest.fn(() => 'ok') } as never,
      {
        getTodaySignSnapshot: jest.fn(async () => ({
          title: '今日幸运签',
          summary: '照顾当下',
          tag: '薄荷色',
          themeName: 'mint',
        })),
      } as never,
      { isMembershipActive: jest.fn(() => false) } as never,
      { find: jest.fn(async () => options.records ?? []) } as never,
      { find: jest.fn(async () => options.moods ?? []) } as never,
      { findOne: jest.fn(async () => null) } as never,
    );

  const user = {
    id: '1',
    nickname: '清浅',
    birthday: '1993-05-20',
    birthTime: '08:00',
    zodiac: '金牛座',
    gender: 'female',
    fiveElements: { 木: 8, 水: 6 },
    preferencesJson: {
      birthPlace: '杭州',
    },
    vipStatus: 'inactive',
    vipExpiredAt: null,
  } as UserEntity;

  it('keeps the score conservative when there is no recent self-report', async () => {
    const service = createService({});
    const response = await service.getHomeIndex(user);
    const score = Number(response.data.todayLuckyScore.value);

    expect(score).toBeLessThanOrEqual(68);
    expect(response.data.todayLuckyScore.hint).toContain('缺少近期自述状态');
  });

  it('lets a fresh positive mood and steady assessment raise the score', async () => {
    const service = createService({
      records: [createEmotionRecord('steady')],
      moods: [createMoodRecord('happy', 88)],
    });
    const response = await service.getHomeIndex(user);
    const score = Number(response.data.todayLuckyScore.value);

    expect(score).toBeGreaterThanOrEqual(78);
    expect(response.data.stateOverview.evidenceLabel).toContain('最近心情日记');
  });

  it('drops the score when the latest mood is low or anxious', async () => {
    const service = createService({
      moods: [createMoodRecord('anxious', 34)],
    });
    const response = await service.getHomeIndex(user);
    const score = Number(response.data.todayLuckyScore.value);

    expect(score).toBeLessThanOrEqual(55);
    expect(response.data.todayLuckyScore.hint).toContain('稳定感和支持');
  });
});

function createMoodRecord(
  moodType: string,
  moodScore: number,
): MoodRecordEntity {
  const now = new Date();

  return {
    id: `${moodType}-${moodScore}`,
    userId: '1',
    recordDate: now.toISOString().slice(0, 10),
    moodType,
    moodScore,
    emotionTags: [],
    content: '今天认真记录了心情。',
    createdAt: now,
    updatedAt: now,
  } as MoodRecordEntity;
}

function createEmotionRecord(riskLevel: string): UserRecordEntity {
  const now = new Date();

  return {
    id: `emotion-${riskLevel}`,
    userId: '1',
    recordType: 'emotion',
    sourceCode: 'emotion',
    resultTitle: '情绪自检',
    score: null,
    resultLevel: riskLevel,
    resultData: {
      riskLevel,
      primarySuggestion: '先保持呼吸和节奏。',
      completedAt: now.toISOString(),
    },
    isFullReportUnlocked: false,
    unlockType: null,
    createdAt: now,
    updatedAt: now,
  } as UserRecordEntity;
}
