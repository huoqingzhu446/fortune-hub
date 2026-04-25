import { FavoritesService } from './favorites.service';

describe('FavoritesService', () => {
  it('toggles favorite on and off', async () => {
    const store: Record<string, unknown> = {};
    const repo = {
      findOne: jest.fn(async () => store.item ?? null),
      create: jest.fn((input) => input),
      save: jest.fn(async (input) => {
        store.item = {
          id: 'f1',
          createdAt: new Date('2026-04-25T00:00:00Z'),
          ...input,
        };
        return store.item;
      }),
      delete: jest.fn(async () => {
        store.item = null;
      }),
    };
    const service = new FavoritesService(repo as never);
    const user = { id: 'u1' };
    const payload = {
      itemType: 'report',
      itemKey: 'r1',
      title: '报告',
      route: '/pages/report/index?id=r1',
    };

    await expect(service.toggleFavorite(user as never, payload)).resolves.toMatchObject({
      data: { active: true },
    });
    await expect(service.toggleFavorite(user as never, payload)).resolves.toMatchObject({
      data: { active: false },
    });
  });
});
