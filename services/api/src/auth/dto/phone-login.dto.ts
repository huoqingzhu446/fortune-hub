import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class PhoneLoginDto {
  @IsString()
  @MinLength(5)
  @MaxLength(20)
  phone!: string;

  @IsString()
  @MinLength(4)
  @MaxLength(8)
  code!: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  nickname?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  avatarUrl?: string;
}
