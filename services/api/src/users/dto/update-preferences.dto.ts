import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdatePreferencesDto {
  @IsOptional()
  @IsBoolean()
  dailyReminderEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  luckyPushEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  quietModeEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  saveHistoryCardsEnabled?: boolean;

  @IsOptional()
  @IsString()
  @IsIn(['auto', 'manual'])
  themeMode?: 'auto' | 'manual';

  @IsOptional()
  @IsString()
  @MaxLength(32)
  manualThemeKey?: string;
}
