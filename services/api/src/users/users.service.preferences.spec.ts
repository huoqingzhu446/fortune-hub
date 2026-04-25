import { UsersService } from './users.service';

describe('UsersService preferences', () => {
  it('merges preference patch into existing user settings', async () => {
    const user = {
      preferencesJson: {
        dailyReminderEnabled: true,
        luckyPushEnabled: true,
        quietModeEnabled: false,
        saveHistoryCardsEnabled: true,
        themeMode: 'auto',
        manualThemeKey: '',
      },
    };
    const userRepo = {
      save: jest.fn(async (input) => input),
    };
    const service = new UsersService(
      {} as never,
      userRepo as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );

    const response = await service.updatePreferences(user as never, {
      dailyReminderEnabled: false,
      themeMode: 'manual',
      manualThemeKey: 'mint_cyan',
    });

    expect(response.data.settings).toMatchObject({
      dailyReminderEnabled: false,
      luckyPushEnabled: true,
      themeMode: 'manual',
      manualThemeKey: 'mint_cyan',
    });
    expect(userRepo.save).toHaveBeenCalledWith(expect.objectContaining({
      preferencesJson: expect.objectContaining({ manualThemeKey: 'mint_cyan' }),
    }));
  });
});
