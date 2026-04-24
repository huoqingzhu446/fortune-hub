import { Body, Controller, Get, Headers, Post, Put, Query } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { SaveMeditationRecordDto } from './dto/save-meditation-record.dto';
import { SaveMoodRecordDto } from './dto/save-mood-record.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';

@Controller()
export class UsersController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Get('me')
  async getMe(@Headers('authorization') authorization?: string) {
    const user = await this.authService.requireUserFromAuthorization(authorization);
    return this.usersService.getCurrentProfile(user);
  }

  @Get('user/profile')
  async getProfilePage(@Headers('authorization') authorization?: string) {
    const user = await this.authService.resolveUserFromAuthorization(authorization);
    return this.usersService.getProfilePage(user);
  }

  @Put('me/profile')
  async updateProfile(
    @Headers('authorization') authorization: string | undefined,
    @Body() dto: UpdateProfileDto,
  ) {
    const user = await this.authService.requireUserFromAuthorization(authorization);
    return this.usersService.updateProfile(user, dto);
  }

  @Get('records')
  async getRecords(
    @Headers('authorization') authorization?: string,
    @Query('limit') limit?: string,
  ) {
    const user = await this.authService.requireUserFromAuthorization(authorization);
    return this.usersService.getUnifiedHistory(
      user,
      typeof limit === 'string' ? Number(limit) : undefined,
    );
  }

  @Get('record/overview')
  async getRecordOverview(@Headers('authorization') authorization?: string) {
    const user = await this.authService.resolveUserFromAuthorization(authorization);
    return this.usersService.getRecordOverview(user);
  }

  @Get('record/mood')
  async getMoodRecords(@Headers('authorization') authorization?: string) {
    const user = await this.authService.requireUserFromAuthorization(authorization);
    return this.usersService.getMoodRecords(user);
  }

  @Post('record/mood')
  async saveMoodRecord(
    @Headers('authorization') authorization: string | undefined,
    @Body() dto: SaveMoodRecordDto,
  ) {
    const user = await this.authService.requireUserFromAuthorization(authorization);
    return this.usersService.saveMoodRecord(user, dto);
  }

  @Get('record/meditation')
  async getMeditationRecords(@Headers('authorization') authorization?: string) {
    const user = await this.authService.requireUserFromAuthorization(authorization);
    return this.usersService.getMeditationRecords(user);
  }

  @Post('record/meditation')
  async saveMeditationRecord(
    @Headers('authorization') authorization: string | undefined,
    @Body() dto: SaveMeditationRecordDto,
  ) {
    const user = await this.authService.requireUserFromAuthorization(authorization);
    return this.usersService.saveMeditationRecord(user, dto);
  }
}
