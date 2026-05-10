import { IsString, MaxLength, MinLength } from 'class-validator';

export class BindPhoneDto {
  @IsString()
  @MinLength(5)
  @MaxLength(20)
  phone!: string;

  @IsString()
  @MinLength(4)
  @MaxLength(8)
  code!: string;
}
