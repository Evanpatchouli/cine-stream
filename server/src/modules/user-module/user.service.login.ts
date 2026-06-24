import { Injectable, Dependencies, Inject } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { User } from './user.schema';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { generateToken } from './utils';
import UserLoginEvent from '@/events/user.login.event';
import UserCreatedEvent from '@/events/user.created.event';
import { ILoginResult, LoginResult } from './models/LoginResult';
import { UserModel } from './user.model';
import { UserRoleService } from './user.service.role';
import CustomError from '@/exception/CustomError';
import RS from '@/constants/resp.constant';
import { LoginTypes } from '@/constants/login.constant';
import { AuthTokenPayload, formatTokenKey } from '@/auth/jwt';
import UserLogoutEvent from '@/events/user.logout.event';
import { EVENTS } from '@/constants/events';
import cache from '@/cache';

@Injectable()
@Dependencies(getModelToken(User.name))
export class UserLoginService {
  constructor(
    @Inject() private userModel: UserModel,
    @Inject() private emitter: EventEmitter2,
    @Inject() private userRoleService: UserRoleService,
  ) {}

  async useOpenid(
    openid: string,
    ip: string,
    last_login_at: number,
  ): Promise<ILoginResult> {
    let user = await this.userModel.findByOpenid(openid);
    if (user) {
      const userRoles = await this.userRoleService.getRoles(user.id, {
        withPermission: true,
      });
      const roles = userRoles.map((role) => role.role_code);
      const permissions = userRoles
        .map((role) => role.permissions!)
        .flat()
        .map((permission) => permission?.perm_code);
      const token = generateToken(
        user.id,
        user.openid,
        user.phone,
        user.username,
        user.email,
        roles,
        permissions,
      );
      const nickname = user.nickname;
      const phone = user.phone;
      const username = user.username;
      const email = user.email;

      this.emitter.emit(
        EVENTS.USER_LOGIN,
        new UserLoginEvent(user.id, ip, last_login_at, LoginTypes.OPENID),
      );

      return LoginResult.new()
        .Id(user.id)
        .Nickname(nickname)
        .Openid(openid)
        .Phone(phone)
        .Username(username)
        .Email(email)
        .Token(token)
        .Roles(roles)
        .Permissions(permissions);
    }
    user = await this.userModel.create({ openid }, ip, last_login_at);
    const userRoles = await this.userRoleService.getRoles(user.id, {
      withPermission: true,
    });

    await this.userRoleService.assignNormalUserRole(user.id);

    const roles = userRoles.map((role) => role.role_code);
    const permissions = userRoles
      .map((role) => role.permissions!)
      .flat()
      .map((permission) => permission?.perm_code);
    const token = generateToken(
      user.id,
      user.openid,
      user.phone,
      user.username,
      user.email,
      roles,
      permissions,
    );
    const nickname = user.nickname;
    const phone = user.phone;
    const username = user.username;
    const email = user.email;

    this.emitter.emit(EVENTS.USER_CREATED, new UserCreatedEvent(user.id));
    this.emitter.emit(
      EVENTS.USER_LOGIN,
      new UserLoginEvent(user.id, ip, last_login_at, LoginTypes.OPENID),
    );

    return LoginResult.new()
      .Id(user.id)
      .Nickname(nickname)
      .Openid(openid)
      .Phone(phone)
      .Username(username)
      .Email(email)
      .Token(token)
      .Roles(roles)
      .Permissions(permissions);
  }

  async useAccount(
    username: string,
    password: string,
    ip: string,
    last_login_at: number,
  ): Promise<ILoginResult> {
    const user = await this.userModel.findByUsernameAndPassword(
      username,
      password,
    );
    if (user) {
      const nickname = user.nickname;
      const user_id = user.id;
      const openid = user.openid;
      const phone = user.phone;
      const email = user.email;
      const userRoles = await this.userRoleService.getRoles(user_id, {
        withPermission: true,
      });
      const roles = userRoles.map((role) => role.role_code);
      const permissions = userRoles
        .map((role) => role.permissions!)
        .flat()
        .map((permission) => permission?.perm_code);
      const token = generateToken(
        user_id,
        openid,
        phone,
        username,
        email,
        roles,
        permissions,
      );

      this.emitter.emit(
        EVENTS.USER_LOGIN,
        new UserLoginEvent(user_id, ip, last_login_at, LoginTypes.ACCOUNT),
      );

      return LoginResult.new()
        .Id(user_id)
        .Nickname(nickname)
        .Openid(openid)
        .Phone(phone)
        .Username(username)
        .Email(email)
        .Token(token)
        .Roles(roles)
        .Permissions(permissions);
    } else {
      throw new CustomError({
        back: true,
        message: RS.LOGIN_FAIL_PASSWORD_NOT_MATCH.message,
        code: RS.LOGIN_FAIL_PASSWORD_NOT_MATCH.code,
        status: 401,
      });
    }
  }

  async usePhone(
    phone: string,
    ip: string,
    last_login_at: number,
  ): Promise<ILoginResult> {
    let user = await this.userModel.findByPhone(phone);
    if (user) {
      const nickname = user.nickname;
      const user_id = user.id;
      const openid = user.openid;
      const username = user.username;
      const email = user.email;
      const userRoles = await this.userRoleService.getRoles(user_id, {
        withPermission: true,
      });
      const roles = userRoles.map((role) => role.role_code);
      const permissions = userRoles
        .map((role) => role.permissions!)
        .flat()
        .map((permission) => permission?.perm_code);
      const token = generateToken(
        user_id,
        openid,
        phone,
        username,
        email,
        roles,
        permissions,
      );

      this.emitter.emit(
        EVENTS.USER_LOGIN,
        new UserLoginEvent(user_id, ip, last_login_at, LoginTypes.PHONE),
      );

      return LoginResult.new()
        .Id(user_id)
        .Nickname(nickname)
        .Openid(openid)
        .Phone(phone)
        .Username(username)
        .Email(email)
        .Token(token)
        .Roles(roles)
        .Permissions(permissions);
    }
    // 创建用户
    user = await this.userModel.create({ phone }, ip, last_login_at);

    const nickname = user.nickname;
    const user_id = user.id;
    const openid = user.openid;
    const username = user.username;
    const email = user.email;

    // 分配普通用户角色
    await this.userRoleService.assignNormalUserRole(user.id);
    // 查询角色和权限
    const userRoles = await this.userRoleService.getRoles(user.id, {
      withPermission: true,
    });

    const roles = userRoles.map((role) => role.role_code);
    const permissions = userRoles
      .map((role) => role.permissions!)
      .flat()
      .map((permission) => permission?.perm_code);

    const token = generateToken(
      user_id,
      openid,
      phone,
      username,
      email,
      roles,
      permissions,
    );

    this.emitter.emit(EVENTS.USER_CREATED, new UserCreatedEvent(user.id));
    this.emitter.emit(
      EVENTS.USER_LOGIN,
      new UserLoginEvent(user_id, ip, last_login_at, LoginTypes.PHONE),
    );

    return LoginResult.new()
      .Id(user_id)
      .Nickname(nickname)
      .Openid(openid)
      .Phone(phone)
      .Username(username)
      .Email(email)
      .Token(token)
      .Roles(roles)
      .Permissions(permissions);
  }

  async usePhonePassword(
    phone: string,
    password: string,
    ip: string,
    last_login_at: number,
  ): Promise<ILoginResult> {
    const user = await this.userModel.findByPhoneAndPassword(phone, password);
    if (!user) {
      throw new CustomError({
        back: true,
        message: RS.LOGIN_FAIL_PASSWORD_NOT_MATCH.message,
        code: RS.LOGIN_FAIL_PASSWORD_NOT_MATCH.code,
        status: 401,
      });
    }

    const user_id = user.id;
    const userRoles = await this.userRoleService.getRoles(user_id, {
      withPermission: true,
    });
    const roles = userRoles.map((role) => role.role_code);
    const permissions = userRoles
      .map((role) => role.permissions!)
      .flat()
      .map((permission) => permission?.perm_code);
    const token = generateToken(
      user_id,
      user.openid,
      phone,
      user.username,
      user.email,
      roles,
      permissions,
    );

    this.emitter.emit(
      EVENTS.USER_LOGIN,
      new UserLoginEvent(user_id, ip, last_login_at, LoginTypes.PHONE),
    );

    return LoginResult.new()
      .Id(user_id)
      .Nickname(user.nickname)
      .Openid(user.openid)
      .Phone(phone)
      .Username(user.username)
      .Email(user.email)
      .Token(token)
      .Roles(roles)
      .Permissions(permissions);
  }

  async useEmail(
    email: string,
    ip: string,
    last_login_at: number,
  ): Promise<ILoginResult> {
    let user = await this.userModel.findByEmail(email);
    if (user) {
      const nickname = user.nickname;
      const user_id = user.id;
      const openid = user.openid;
      const phone = user.phone;
      const username = user.username;
      const userRoles = await this.userRoleService.getRoles(user_id, {
        withPermission: true,
      });
      const roles = userRoles.map((role) => role.role_code);
      const permissions = userRoles
        .map((role) => role.permissions!)
        .flat()
        .map((permission) => permission?.perm_code);
      const token = generateToken(
        user_id,
        openid,
        phone,
        username,
        email,
        roles,
        permissions,
      );

      this.emitter.emit(
        EVENTS.USER_LOGIN,
        new UserLoginEvent(user_id, ip, last_login_at, LoginTypes.PHONE),
      );

      return LoginResult.new()
        .Id(user_id)
        .Nickname(nickname)
        .Openid(openid)
        .Phone(phone)
        .Username(username)
        .Email(email)
        .Token(token)
        .Roles(roles)
        .Permissions(permissions);
    }
    // 创建用户
    user = await this.userModel.create({ email }, ip, last_login_at);

    const nickname = user.nickname;
    const user_id = user.id;
    const openid = user.openid;
    const username = user.username;
    const phone = user.phone;

    // 分配普通用户角色
    await this.userRoleService.assignNormalUserRole(user.id);
    // 查询角色和权限
    const userRoles = await this.userRoleService.getRoles(user.id, {
      withPermission: true,
    });

    const roles = userRoles.map((role) => role.role_code);
    const permissions = userRoles
      .map((role) => role.permissions!)
      .flat()
      .map((permission) => permission?.perm_code);

    const token = generateToken(
      user_id,
      openid,
      phone,
      username,
      email,
      roles,
      permissions,
    );

    this.emitter.emit(EVENTS.USER_CREATED, new UserCreatedEvent(user.id));
    this.emitter.emit(
      EVENTS.USER_LOGIN,
      new UserLoginEvent(user_id, ip, last_login_at, LoginTypes.PHONE),
    );

    return LoginResult.new()
      .Id(user_id)
      .Nickname(nickname)
      .Openid(openid)
      .Phone(phone)
      .Username(username)
      .Email(email)
      .Token(token)
      .Roles(roles)
      .Permissions(permissions);
  }

  async logout(user: AuthTokenPayload, token: string): Promise<void> {
    cache.delete(formatTokenKey(token));
    this.emitter.emit(EVENTS.USER_LOGOUT, new UserLogoutEvent(user.id));
    return Promise.resolve();
  }
}
