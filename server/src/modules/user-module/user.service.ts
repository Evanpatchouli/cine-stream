import {
  Injectable,
  Dependencies,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { User } from './user.schema';
import { UserLoginService } from './user.service.login';
import { UserRoleService } from './user.service.role';
import { RoleDocument } from '../role-module/role.schema';
import { AccountLoginForm } from './models/LoginForm';
import { UserRegisterService } from './user.service.register';
import { AuthTokenPayload } from '@/auth/jwt';
import { UserModel } from './user.model';
import {
  PlaybackPreferencesDto,
  UpdateAvatarDto,
  UpdateProfileDto,
} from './models/ProfileDto';

const DEFAULT_PLAYBACK_PREFERENCES = {
  auto_play_next: true,
  default_muted: true,
};

@Injectable()
@Dependencies(getModelToken(User.name))
export class UserService {
  constructor(
    @Inject() private loginService: UserLoginService,
    @Inject() private userRoleService: UserRoleService,
    @Inject() private registerService: UserRegisterService,
    @Inject() private userModel: UserModel,
  ) {}

  async loginByOpenid(openid: string, ip: string, last_login_at: number) {
    return await this.loginService.useOpenid(openid, ip, last_login_at);
  }

  async loginByAccount(
    form: Omit<AccountLoginForm, 'captcha'>,
    ip: string,
    last_login_at: number,
  ) {
    const { username: u, password: p } = form;
    return await this.loginService.useAccount(u, p, ip, last_login_at);
  }

  async loginByPhone(phone: string, ip: string, last_login_at: number) {
    return await this.loginService.usePhone(phone, ip, last_login_at);
  }

  async loginByPhonePassword(
    phone: string,
    password: string,
    ip: string,
    last_login_at: number,
  ) {
    return await this.loginService.usePhonePassword(
      phone,
      password,
      ip,
      last_login_at,
    );
  }

  async loginByEmail(email: string, ip: string, last_login_at: number) {
    return await this.loginService.useEmail(email, ip, last_login_at);
  }

  /**
   * 注册成功后默认登录
   */
  async registerAccount(
    form: Omit<AccountLoginForm, 'captcha'>,
    ip: string,
    last_login_at: number,
  ) {
    const { username: u, password: p } = form;
    return await this.registerService.registerAccount(u, p, ip, last_login_at);
  }

  async assignRole(userId: string, roleId: string) {
    return await this.userRoleService.pushRole(userId, roleId);
  }

  async getRoles(
    user_id: string,
    options?: {
      withPermission?: boolean; // 是否联查权限
    },
  ): Promise<RoleDocument[] | string> {
    return await this.userRoleService.getRoles(user_id, options);
  }

  async assignNormalUserRole(user_id: string) {
    return await this.userRoleService.assignNormalUserRole(user_id);
  }

  async getProfile(userId: string): Promise<Record<string, any>> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return this.toSafeProfile(user.toJSON());
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<Record<string, any>> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    await this.userModel.updateById(userId, {
      nickname: dto.nickname?.trim() || '',
      email: dto.email?.trim() || '',
      updated_at: Date.now(),
    });

    return this.getProfile(userId);
  }

  async updateAvatar(
    userId: string,
    dto: UpdateAvatarDto,
  ): Promise<Record<string, any>> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    await this.userModel.updateById(userId, {
      avatar: dto.avatar?.trim() || '',
      updated_at: Date.now(),
    });

    return this.getProfile(userId);
  }

  async getPlaybackPreferences(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return this.resolvePlaybackPreferences(user.toJSON().playback_preferences);
  }

  async updatePlaybackPreferences(
    userId: string,
    dto: PlaybackPreferencesDto,
  ) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const current = this.resolvePlaybackPreferences(
      user.toJSON().playback_preferences,
    );
    const playback_preferences = {
      auto_play_next: dto.auto_play_next ?? current.auto_play_next,
      default_muted: dto.default_muted ?? current.default_muted,
    };

    await this.userModel.updateById(userId, {
      playback_preferences,
      updated_at: Date.now(),
    });

    return playback_preferences;
  }

  async logout(user: AuthTokenPayload, token: string) {
    return await this.loginService.logout(user, token);
  }

  private toSafeProfile(rawUser: Record<string, any>): Record<string, any> {
    const { password, role_ids, ...profile } = rawUser;
    return {
      ...profile,
      avatar: profile.avatar || '',
      playback_preferences: this.resolvePlaybackPreferences(
        profile.playback_preferences,
      ),
    };
  }

  private resolvePlaybackPreferences(
    value?: Partial<typeof DEFAULT_PLAYBACK_PREFERENCES> | null,
  ) {
    return {
      auto_play_next:
        value?.auto_play_next ?? DEFAULT_PLAYBACK_PREFERENCES.auto_play_next,
      default_muted:
        value?.default_muted ?? DEFAULT_PLAYBACK_PREFERENCES.default_muted,
    };
  }
}
