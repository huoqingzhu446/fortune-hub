import { Body, Controller, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { PhoneCodeDto } from './dto/phone-code.dto';
import { PhoneLoginDto } from './dto/phone-login.dto';
import { WechatLoginDto } from './dto/wechat-login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('wechat-login')
  login(@Body() dto: WechatLoginDto) {
    return this.authService.login(dto);
  }

  @Post('phone-code')
  sendPhoneCode(@Body() dto: PhoneCodeDto, @Req() request: Request) {
    return this.authService.sendPhoneCode(dto, this.resolveClientIp(request));
  }

  @Post('phone-login')
  phoneLogin(@Body() dto: PhoneLoginDto) {
    return this.authService.loginWithPhone(dto);
  }

  private resolveClientIp(request: Request) {
    const forwardedFor = request.headers['x-forwarded-for'];
    if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
      return forwardedFor.split(',')[0]?.trim() || null;
    }

    return request.ip || request.socket.remoteAddress || null;
  }
}
