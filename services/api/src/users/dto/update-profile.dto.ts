import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
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
}
