import { Controller, Get, Headers } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { MembershipService } from './membership.service';

@Controller('membership')
export class MembershipController {
  constructor(
    private readonly authService: AuthService,
    private readonly membershipService: MembershipService,
  ) {}

  @Get('status')
  async getStatus(@Headers('authorization') authorization?: string) {
    const user = await this.authService.requireUserFromAuthorization(authorization);
    return this.membershipService.getStatus(user);
  }
}
