import { IsDateString, IsIn, IsOptional, IsString, Matches } from 'class-validator';

export class AnalyzeBaziDto {
  @IsDateString()
  birthday!: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  birthTime!: string;

  @IsOptional()
  @IsString()
  @IsIn(['male', 'female', 'unknown'])
  gender?: 'male' | 'female' | 'unknown';
}
