import { IsString, MaxLength } from 'class-validator';

export class VerifyRewardDto {
  @IsString()
  @MaxLength(32)
  recordId!: string;

  @IsString()
  @MaxLength(32)
  slotCode!: string;
}
