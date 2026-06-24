import { Injectable, Dependencies, Inject } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { User } from './user.schema';
import { UserLoginService } from './user.service.login';
import { UserRoleService } from './user.service.role';
import { RoleDocument } from '../role-module/role.schema';
import { AccountLoginForm } from './models/LoginForm';
import { UserRegisterService } from './user.service.register';
import { AuthTokenPayload } from '@/auth/jwt';

@Injectable()
@Dependencies(getModelToken(User.name))
export class UserService {
  constructor(
    @Inject() private loginService: UserLoginService,
    @Inject() private userRoleService: UserRoleService,
    @Inject() private registerService: UserRegisterService,
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

  async logout(user: AuthTokenPayload, token: string) {
    return await this.loginService.logout(user, token);
  }
}
