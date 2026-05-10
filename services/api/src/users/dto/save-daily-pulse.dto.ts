import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class SaveDailyPulseDto {
  @IsString()
  @IsIn(['happy', 'neutral', 'low', 'anxious', 'irritable'])
  mood!: string;

  @IsInt()
  @Min(1)
  @Max(5)
  intensity!: number;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(256)
  note?: string;
}
