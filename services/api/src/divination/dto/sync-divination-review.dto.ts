import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export type DivinationReviewOutcome = 'pending' | 'fulfilled' | 'unfulfilled';

export class SyncDivinationReviewDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  resultId!: string;

  @IsOptional()
  @IsBoolean()
  favorite?: boolean;

  @IsOptional()
  @IsIn(['pending', 'fulfilled', 'unfulfilled'])
  outcome?: DivinationReviewOutcome;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  topic?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  summary?: string;

  @IsOptional()
  @IsObject()
  resultSnapshot?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @IsIn(['happy', 'neutral', 'low', 'anxious', 'irritable'])
  preMood?: string;

  @IsOptional()
  @IsIn([1, 2, 3, 4, 5])
  preMoodIntensity?: number;

  @IsOptional()
  @IsString()
  @IsIn(['happy', 'neutral', 'low', 'anxious', 'irritable'])
  postMood?: string;

  @IsOptional()
  @IsIn([1, 2, 3, 4, 5])
  postMoodIntensity?: number;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  expectation?: string;
}
