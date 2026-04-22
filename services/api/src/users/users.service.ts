import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../database/entities/user.entity';
import { AuthService } from '../auth/auth.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

const WESTERN_ZODIAC_BOUNDARIES = [
  { sign: '摩羯座', start: '01-01', end: '01-19' },
  { sign: '水瓶座', start: '01-20', end: '02-18' },
  { sign: '双鱼座', start: '02-19', end: '03-20' },
  { sign: '白羊座', start: '03-21', end: '04-19' },
  { sign: '金牛座', start: '04-20', end: '05-20' },
  { sign: '双子座', start: '05-21', end: '06-21' },
  { sign: '巨蟹座', start: '06-22', end: '07-22' },
  { sign: '狮子座', start: '07-23', end: '08-22' },
  { sign: '处女座', start: '08-23', end: '09-22' },
  { sign: '天秤座', start: '09-23', end: '10-23' },
  { sign: '天蝎座', start: '10-24', end: '11-22' },
  { sign: '射手座', start: '11-23', end: '12-21' },
  { sign: '摩羯座', start: '12-22', end: '12-31' },
] as const;

const FIVE_ELEMENT_NAMES = ['木', '火', '土', '金', '水'] as const;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly authService: AuthService,
  ) {}

  getCurrentProfile(user: UserEntity) {
    return {
      code: 0,
      message: 'ok',
      data: {
        user: this.authService.serializeUser(user),
        isProfileCompleted: Boolean(user.birthday && user.zodiac),
      },
      timestamp: new Date().toISOString(),
    };
  }

  async updateProfile(user: UserEntity, dto: UpdateProfileDto) {
    const profile = this.buildProfile(dto);

    user.nickname = dto.nickname ?? user.nickname;
    user.avatarUrl = dto.avatarUrl ?? user.avatarUrl;
    user.birthday = dto.birthday;
    user.birthTime = dto.birthTime ?? user.birthTime ?? null;
    user.gender = dto.gender;
    user.zodiac = profile.zodiac;
    user.baziSummary = profile.baziSummary;
    user.fiveElements = profile.fiveElements;

    const savedUser = await this.userRepository.save(user);

    return {
      code: 0,
      message: 'ok',
      data: {
        user: this.authService.serializeUser(savedUser),
        isProfileCompleted: true,
      },
      timestamp: new Date().toISOString(),
    };
  }

  private buildProfile(dto: UpdateProfileDto) {
    const zodiac = this.computeWesternZodiac(dto.birthday);
    const fiveElements = this.computeFiveElements(dto.birthday, dto.birthTime);
    const dominantElement = Object.entries(fiveElements).sort(
      (left, right) => right[1] - left[1],
    )[0][0];

    return {
      zodiac,
      fiveElements,
      baziSummary: `简易测算显示你的能量偏向${dominantElement}，建议保持节奏与情绪平衡。`,
    };
  }

  private computeWesternZodiac(birthday: string) {
    const date = birthday.slice(5, 10);

    return (
      WESTERN_ZODIAC_BOUNDARIES.find(
        (item) => date >= item.start && date <= item.end,
      )?.sign ?? '摩羯座'
    );
  }

  private computeFiveElements(birthday: string, birthTime?: string) {
    const [year, month, day] = birthday.split('-').map((value) => Number(value));
    const hour = birthTime ? Number.parseInt(birthTime.slice(0, 2), 10) : 12;
    const seed = year + month * 3 + day * 5 + hour * 7;

    return FIVE_ELEMENT_NAMES.reduce<Record<string, number>>((result, element, index) => {
      result[element] = ((seed + index * 11) % 9) + 1;
      return result;
    }, {});
  }
}
