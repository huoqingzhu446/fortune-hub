import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class QuestionOptionDto {
  @IsString()
  @MaxLength(8)
  key!: string;

  @IsString()
  @MaxLength(255)
  label!: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  dimension?: string;

  @IsInt()
  @Min(0)
  score!: number;
}

class QuestionItemDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  questionId?: string;

  @IsString()
  @MaxLength(500)
  prompt!: string;

  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => QuestionOptionDto)
  options!: QuestionOptionDto[];
}

class EmotionThresholdDto {
  @IsInt()
  @Min(0)
  maxScore!: number;

  @IsString()
  @IsIn(['steady', 'watch', 'support', 'urgent'])
  level!: string;

  @IsString()
  @MaxLength(128)
  title!: string;

  @IsString()
  @MaxLength(255)
  subtitle!: string;

  @IsString()
  @MaxLength(1200)
  summary!: string;

  @IsString()
  @MaxLength(500)
  primarySuggestion!: string;

  @IsString()
  @MaxLength(500)
  supportSignal!: string;
}

class SharePosterDto {
  @IsString()
  @MaxLength(255)
  headlineTemplate!: string;

  @IsString()
  @MaxLength(255)
  subtitleTemplate!: string;

  @IsString()
  @MaxLength(128)
  accentText!: string;

  @IsString()
  @MaxLength(255)
  footerText!: string;

  @IsString()
  @MaxLength(64)
  themeName!: string;
}

export class UpdateQuestionBankDto {
  @IsString()
  @MaxLength(128)
  title!: string;

  @IsString()
  @MaxLength(255)
  subtitle!: string;

  @IsString()
  @MaxLength(2000)
  description!: string;

  @IsString()
  @MaxLength(4000)
  intro!: string;

  @IsInt()
  @Min(1)
  durationMinutes!: number;

  @IsArray()
  @IsString({ each: true })
  tags!: string[];

  @IsString()
  @MaxLength(64)
  groupCode!: string;

  @IsOptional()
  @IsObject()
  dimensionLabels?: Record<string, string>;

  @IsOptional()
  @IsObject()
  profiles?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  disclaimer?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  relaxSteps?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmotionThresholdDto)
  thresholds?: EmotionThresholdDto[];

  @ValidateNested()
  @Type(() => SharePosterDto)
  sharePoster!: SharePosterDto;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => QuestionItemDto)
  questions!: QuestionItemDto[];
}
