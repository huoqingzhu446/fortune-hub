import { BaziEngine } from './bazi-engine';
import { BaziService } from './bazi.service';

describe('BaziService professional mode', () => {
  const service = new BaziService({
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  } as never, new BaziEngine());

  it('uses lunar library pillars and true solar time correction', async () => {
    const response = await service.analyzeProfessional(
      {
        birthday: '1990-01-01',
        birthTime: '12:00',
        gender: 'unknown',
        birthPlace: '杭州',
        longitude: 120,
        latitude: 30.25,
        timezoneOffset: 8,
      },
      null,
    );

    expect(response.data.result.chart).toMatchObject({
      yearPillar: '己巳',
      monthPillar: '丙子',
      dayPillar: '丙寅',
      hourPillar: '甲午',
    });
    expect(response.data.result.professional.library).toBe('lunar-typescript');
    expect(response.data.result.algorithmVersion).toBe('bazi-engine-v1.2.0');
    expect(response.data.result.inputSnapshot).toMatchObject({
      birthday: '1990-01-01',
      birthTime: '12:00',
      mode: 'professional',
      calendarType: 'solar',
      birthPlace: '杭州',
    });
    expect(response.data.result.correctionSnapshot).toMatchObject({
      enabled: true,
      method: 'longitude-true-solar-time',
      adjustedBirthday: '1990-01-01',
      adjustedBirthTime: '12:00',
      offsetMinutes: 0,
    });
    expect(response.data.result.dayMasterAnalysis).toMatchObject({
      dayStem: '丙',
      dayElement: '火',
      polarity: 'yang',
      monthBranch: '子',
      monthElement: '水',
    });
    expect(response.data.result.professional.birthPlace).toBe('杭州');
    expect(response.data.result.professional.latitude).toBe(30.25);
    expect(response.data.result.professional.trueSolarOffsetMinutes).toBe(0);
    expect(response.data.result.professional.majorLuck).toMatchObject({
      available: false,
      direction: 'unknown',
    });
    expect(response.data.result.professional.annualFortunes).toHaveLength(5);
  });

  it('uses the shared lunar engine for lite mode without true solar correction', async () => {
    const response = await service.analyze(
      {
        birthday: '1990-01-01',
        birthTime: '12:00',
        gender: 'unknown',
      },
      null,
    );

    expect(response.data.result.algorithmVersion).toBe('bazi-engine-v1.2.0');
    expect(response.data.result.correctionSnapshot).toMatchObject({
      enabled: false,
      method: 'none',
      offsetMinutes: 0,
    });
    expect(response.data.result.chart).toMatchObject({
      yearPillar: '己巳',
      monthPillar: '丙子',
      dayPillar: '丙寅',
      hourPillar: '甲午',
    });
    expect(response.data.result.professional).toBeUndefined();
  });

  it('keeps true solar correction auditable when it crosses a day boundary', async () => {
    const response = await service.analyzeProfessional(
      {
        birthday: '2026-04-26',
        birthTime: '00:05',
        gender: 'unknown',
        birthPlace: '拉萨',
        longitude: 91.13,
        latitude: 29.65,
        timezoneOffset: 8,
      },
      null,
    );

    expect(response.data.result.correctionSnapshot).toMatchObject({
      enabled: true,
      originalBirthday: '2026-04-26',
      originalBirthTime: '00:05',
      adjustedBirthday: '2026-04-25',
      adjustedBirthTime: '22:10',
      offsetMinutes: -115,
    });
    expect(response.data.result.professional.trueSolarOffsetMinutes).toBe(-115);
  });

  it('calculates major luck cycles when gender is available', async () => {
    const response = await service.analyzeProfessional(
      {
        birthday: '1990-01-01',
        birthTime: '12:00',
        gender: 'male',
        birthPlace: '杭州',
        longitude: 120,
        latitude: 30.25,
        timezoneOffset: 8,
      },
      null,
    );

    expect(response.data.result.professional.majorLuck).toMatchObject({
      available: true,
      gender: 'male',
      direction: 'backward',
      startAgeYears: 8,
      startAgeMonths: 4,
    });
    expect(response.data.result.professional.majorLuck.cycles[0]).toMatchObject({
      ganZhi: '乙亥',
      startAge: 9,
      endAge: 18,
      startYear: 1998,
    });
  });

  it('returns professional detail from an owned saved record', async () => {
    const generated = await service.analyzeProfessional(
      {
        birthday: '1990-01-01',
        birthTime: '12:00',
        gender: 'male',
        birthPlace: '杭州',
        longitude: 120,
        latitude: 30.25,
        timezoneOffset: 8,
      },
      null,
    );
    const repository = {
      findOne: jest.fn().mockResolvedValue({
        id: 'record-1',
        userId: 'user-1',
        recordType: 'bazi',
        resultTitle: generated.data.result.title,
        resultData: generated.data.result,
        createdAt: new Date('2026-04-26T00:00:00.000Z'),
      }),
    };
    const detailService = new BaziService(repository as never, new BaziEngine());

    const response = await detailService.getProfessionalDetail(
      'record-1',
      { id: 'user-1' } as never,
    );

    expect(repository.findOne).toHaveBeenCalledWith({
      where: {
        id: 'record-1',
        userId: 'user-1',
        recordType: 'bazi',
      },
    });
    expect(response.data.detail.recordId).toBe('record-1');
    expect(response.data.detail.professional.majorLuck.available).toBe(true);
    expect(response.data.detail.majorLuck.cycles[0]).toMatchObject({
      ganZhi: '乙亥',
      startYear: 1998,
    });
    expect(response.data.detail.annualFortunes).toHaveLength(5);
  });

  it('searches birth places with longitude and latitude', () => {
    const response = service.searchBirthPlaces('徐州', 5);

    expect(response.data.items[0]).toMatchObject({
      code: 'xuzhou',
      label: '徐州',
      province: '江苏',
      longitude: 117.18,
      latitude: 34.26,
      timezoneOffset: 8,
    });
  });
});
