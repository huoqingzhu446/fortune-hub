import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';
import { AdminAuthService, type AdminProfile } from './admin-auth.service';

type AdminRequest = Request & {
  admin?: AdminProfile;
};

@Injectable()
export class AdminSessionGuard implements CanActivate {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AdminRequest>();
    request.admin = await this.adminAuthService.requireAdminFromAuthorization(
      request.headers.authorization,
    );
    return true;
  }
}
