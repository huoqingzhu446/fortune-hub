import {
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class SaveMoodRecordDto {
  @IsOptional()
  @IsString()
  @MaxLength(32)
  recordId?: string;

  @IsDateString()
  recordDate!: string;

  @IsString()
  @IsIn(['calm', 'low', 'anxious', 'happy', 'tired'])
  moodType!: 'calm' | 'low' | 'anxious' | 'happy' | 'tired';

  @IsInt()
  @Min(0)
  @Max(100)
  moodScore!: number;

  @IsOptional()
  @IsArray()
  emotionTags?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  content?: string;
}
