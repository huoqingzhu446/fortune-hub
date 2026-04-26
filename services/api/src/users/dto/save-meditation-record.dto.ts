import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class SaveMeditationRecordDto {
  @IsOptional()
  @IsString()
  @MaxLength(32)
  recordId?: string;

  @IsDateString()
  recordDate!: string;

  @IsString()
  @MaxLength(128)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  sourceType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  sourceTitle?: string;

  @IsInt()
  @Min(1)
  @Max(180)
  durationMinutes!: number;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;

  @IsOptional()
  @IsString()
  @IsIn(['completed', 'partial', 'skipped'])
  completionStatus?: 'completed' | 'partial' | 'skipped';

  @IsOptional()
  @IsString()
  @MaxLength(255)
  summary?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  intention?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  moodBefore?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  moodAfter?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  focusScore?: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  bodySignal?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  insight?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  nextAction?: string;
}
