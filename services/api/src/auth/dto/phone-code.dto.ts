import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class PhoneCodeDto {
  @IsString()
  @MinLength(5)
  @MaxLength(20)
  phone!: string;

  @IsOptional()
  @IsString()
  @IsIn(['login', 'bind'])
  scene?: 'login' | 'bind';
}
