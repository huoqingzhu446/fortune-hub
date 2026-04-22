import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  nickname?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  avatarUrl?: string;

  @IsDateString()
  birthday!: string;

  @IsString()
  @IsIn(['male', 'female', 'unknown'])
  gender!: 'male' | 'female' | 'unknown';

  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  birthTime?: string;
}
