import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class SaveMeditationRecordDto {
  @IsDateString()
  recordDate!: string;

  @IsString()
  @MaxLength(128)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  category?: string;

  @IsInt()
  @Min(1)
  @Max(180)
  durationMinutes!: number;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  summary?: string;
}
