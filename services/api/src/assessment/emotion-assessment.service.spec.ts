import { EmotionAssessmentService } from './emotion-assessment.service';

describe('EmotionAssessmentService', () => {
  it('submits a configured test and returns a scored result', async () => {
    const service = new EmotionAssessmentService(
      {} as never,
      {} as never,
      {} as never,
      { findOne: jest.fn(async () => null) } as never,
    );
    (service as unknown as { findTestOrThrow: jest.Mock }).findTestOrThrow = jest.fn(
      async () => ({
        code: 'mood-check',
        title: '情绪自检',
        subtitle: '观察状态',
        description: '测试',
        intro: '答题',
        durationMinutes: 3,
        tags: [],
        disclaimer: '非诊断',
        relaxSteps: ['呼吸'],
        questions: [
          {
            id: 'q1',
            prompt: '最近是否低落？',
            options: [{ key: 'A', label: '没有', score: 0 }],
          },
        ],
        thresholds: [
          {
            maxScore: 3,
            level: 'steady',
            title: '平稳观察区',
            subtitle: '稳定',
            summary: '整体稳定',
            primarySuggestion: '保持节奏',
            supportSignal: '继续观察',
          },
        ],
      }),
    );

    const response = await service.submitEmotionTest(
      'mood-check',
      { answers: [{ questionId: 'q1', optionKey: 'A' }] },
      null,
    );

    expect(response.data.result.riskLevel).toBe('steady');
    expect(response.data.result.compliance.disclaimerVersion).toBe('2026-04-25');
  });
});
