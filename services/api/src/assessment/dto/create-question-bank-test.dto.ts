import { IsIn, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class CreateQuestionBankTestDto {
  @IsString()
  @IsIn(['personality', 'emotion'])
  category!: 'personality' | 'emotion';

  @IsString()
  @MaxLength(64)
  @Matches(/^[a-z0-9-]+$/)
  code!: string;

  @IsString()
  @MaxLength(128)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  subtitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  groupCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  cloneFromCode?: string;
}
