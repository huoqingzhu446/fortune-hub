import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class WechatLoginDto {
  @IsString()
  @MinLength(2)
  code!: string;

  @IsString()
  @IsIn(['mp-weixin'])
  platform!: 'mp-weixin';

  @IsOptional()
  @IsString()
  @MaxLength(64)
  nickname?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  avatarUrl?: string;
}
