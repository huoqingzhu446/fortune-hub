import { BaziService } from './bazi.service';

describe('BaziService professional mode', () => {
  const service = new BaziService({
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  } as never);

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
    expect(response.data.result.professional.birthPlace).toBe('杭州');
    expect(response.data.result.professional.latitude).toBe(30.25);
    expect(response.data.result.professional.trueSolarOffsetMinutes).toBe(0);
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
