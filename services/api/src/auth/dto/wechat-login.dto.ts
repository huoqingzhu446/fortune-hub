import { IsIn, IsString, MinLength } from 'class-validator';

export class WechatLoginDto {
  @IsString()
  @MinLength(2)
  code!: string;

  @IsString()
  @IsIn(['mp-weixin'])
  platform!: 'mp-weixin';
}
