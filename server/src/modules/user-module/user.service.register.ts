import { Injectable, Dependencies, Inject } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { User } from './user.schema';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { generateToken } from './utils';
import UserLoginEvent from '../../events/user.login.event';
import UserCreatedEvent from '../../events/user.created.event';
import { ILoginResult, LoginResult } from './models/LoginResult';
import { UserModel } from './user.model';
import { UserRoleService } from './user.service.role';
import CustomError from '@/exception/CustomError';
import RS from '@/constants/resp.constant';
import { LoginTypes } from '@/constants/login.constant';

@Injectable()
@Dependencies(getModelToken(User.name))
export class UserRegisterService {
  constructor(
    @Inject() private userModel: UserModel,
    @Inject() private emitter: EventEmitter2,
    @Inject() private userRoleService: UserRoleService,
  ) {}

  /**
   * 注册成功后默认登录
   */
  async registerAccount(
    username: string,
    password: string,
    ip: string,
    last_login_at: number,
  ): Promise<ILoginResult> {
    const record = await this.userModel.findByUsername(username);
    if (!record) {
      // 创建用户
      const user = await this.userModel.create(
        {
          username,
          password,
        },
        ip,
        last_login_at,
      );

      const user_id = user.id;
      const openid = user.openid;
      const phone = user.phone;
      const email = user.email;

      // 分配普通用户角色
      await this.userRoleService.assignNormalUserRole(user_id);
      // 查询角色和权限
      const userRoles = await this.userRoleService.getRoles(user_id, {
        withPermission: true,
      });
      const roles = userRoles.map((role) => role.role_code);
      const permissions = userRoles
        .map((role) => role.permissions!)
        .flat()
        .map((permission) => permission?.perm_code);

      // 生成 token
      const token = generateToken(
        user_id,
        openid,
        phone,
        username,
        email,
        roles,
        permissions,
      );
      // 发布用户注册事件
      this.emitter.emit('user.created', new UserCreatedEvent(user_id));
      // 发布用户登录事件
      this.emitter.emit(
        'user.login',
        new UserLoginEvent(user_id, ip, last_login_at, LoginTypes.ACCOUNT),
      );

      return LoginResult.new()
        .Id(user_id)
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
        message: RS.USER_REGISTER_FAIL_USERNAME_EXIST.message,
        code: RS.USER_REGISTER_FAIL_USERNAME_EXIST.code,
        status: 400,
      });
    }
  }
}
