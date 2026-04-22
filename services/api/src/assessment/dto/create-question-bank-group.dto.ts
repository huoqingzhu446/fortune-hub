import { IsIn, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class CreateQuestionBankGroupDto {
  @IsString()
  @IsIn(['personality', 'emotion'])
  category!: 'personality' | 'emotion';

  @IsString()
  @MaxLength(64)
  @Matches(/^[a-z0-9-]+$/)
  code!: string;

  @IsString()
  @MaxLength(64)
  label!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;
}
