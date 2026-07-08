import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Put,
  Query,
  Session,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserService } from './user.service';
import {
  AccountLoginForm,
  PhoneLoginForm,
  OpenidLoginForm,
  GeneralLoginForm,
  EmailLoginForm,
  PhonePasswordLoginForm,
} from './models/LoginForm';
import {
  PlaybackPreferencesDto,
  UpdateAvatarDto,
  UpdateProfileDto,
} from './models/ProfileDto';
import Resp from '@/common/models/Resp';
import { ILoginResult, LoginResult } from './models/LoginResult';
import { CurrentUser } from 'src/decorators/request-meta.decorator';
import type { AuthTokenPayload } from '@/auth/jwt';
import { LoginTypes, type LoginType } from '@/constants/login.constant';
import { IsNotEmpty } from 'class-validator';
import CaptchaService from '../captcha-module/captcha.service';
import OPTService from '../opt-module/opt.service';
import { CaptchaWay } from '@/constants/captcha.constant';
import type { SessionState } from '@/types';
import { OPTWay } from '@/constants/opt.constant';
import { Tag } from '../../decorators/tag.decorator';
import { Ip } from '@/decorators/ip.decorator';
import { HeaderAuthorization } from '@/decorators/header.decorator';
import { Todo } from '@/decorators/todo.decorator';
import { AuthApi } from '@/auth/auth.decorator';
import { AliOssSdk, AliOssUploadResult } from '../oss-module/ali-oss.sdk';

class LoginQuery {
  @IsNotEmpty()
  type: LoginType;
}

@Controller('user')
export class UserController {
  constructor(
    @Inject() private readonly userService: UserService,
    @Inject() private readonly captchaService: CaptchaService,
    @Inject() private readonly optService: OPTService,
    @Inject() private readonly aliOssSdk: AliOssSdk,
  ) {}

  @Post('/login')
  async login(
    @Body() form: GeneralLoginForm,
    @Session() session: SessionState,
    @Query() query: LoginQuery,
    @Ip() ip: string,
  ): Promise<Resp<ILoginResult>> {
    const { type } = query;
    const loginHandlers = {
      [LoginTypes.OPENID]: () =>
        this.loginByOpenid(form as OpenidLoginForm, ip),
      [LoginTypes.ACCOUNT]: () =>
        this.loginByAccount(form as AccountLoginForm, session, ip),
      [LoginTypes.PHONE]: () => this.loginByPhone(form as PhoneLoginForm, ip),
      [LoginTypes.EMAIL]: () => this.loginByEmail(form as EmailLoginForm, ip),
    };

    const handler = loginHandlers[type];
    return handler ? handler() : Resp.fail('不支持的登录方式');
  }

  @Tag('微信扫码登录')
  @Post('/login/openid')
  async loginByOpenid(
    @Body() form: OpenidLoginForm,
    @Ip() ip: string,
  ): Promise<Resp<ILoginResult>> {
    const openid = form.openid;
    const last_login_at = Date.now();
    const result = await this.userService.loginByOpenid(
      openid,
      ip,
      last_login_at,
    );
    return Resp.success(result);
  }

  @Tag('账号密码 + 图形验证码登录')
  @Post('/login/account')
  async loginByAccount(
    @Body() form: AccountLoginForm,
    @Session() session: SessionState,
    @Ip() ip: string,
  ): Promise<Resp<ILoginResult>> {
    const { username, password, captcha } = form;

    if (!this.captchaService.verify(captcha, CaptchaWay.LOGIN, session)) {
      throw new BadRequestException('验证码错误'); // TODO: 增加验证码错误次数限制
    }

    const last_login_at = Date.now();
    const result = await this.userService.loginByAccount(
      { username, password },
      ip,
      last_login_at,
    );

    return Resp.success(result);
  }

  @Tag('账号密码 + 图形验证码注册，注册成功后默认登录')
  @Post('/register/account')
  async registerAccount(
    @Body() form: AccountLoginForm,
    @Session() session: SessionState,
    @Ip() ip: string,
  ) {
    const { username, password, captcha } = form;

    if (!this.captchaService.verify(captcha, CaptchaWay.REGISTER, session)) {
      throw new BadRequestException('验证码错误'); // TODO: 增加验证码错误次数限制
    }

    const last_login_at = Date.now();
    const result = await this.userService.registerAccount(
      { username, password },
      ip,
      last_login_at,
    );

    return Resp.success(result);
  }

  @Tag('手机号 + 短信验证码登录')
  @Post('/login/phone')
  async loginByPhone(
    @Body() form: PhoneLoginForm,
    @Ip() ip: string,
  ): Promise<Resp<ILoginResult>> {
    const { phone, code } = form;

    if (!this.optService.verify(phone, code, OPTWay.PHONE_LOGIN)) {
      throw new BadRequestException('验证码错误'); // TODO: 增加验证码错误次数限制
    }

    const last_login_at = Date.now();
    const result = await this.userService.loginByPhone(
      phone,
      ip,
      last_login_at,
    );
    return Resp.success(result);
  }

  @Tag('手机号 + 密码登录')
  @Post('/login/password')
  async loginByPhonePassword(
    @Body() form: PhonePasswordLoginForm,
    @Ip() ip: string,
  ): Promise<Resp<ILoginResult>> {
    const last_login_at = Date.now();
    const result = await this.userService.loginByPhonePassword(
      form.phone,
      form.password,
      ip,
      last_login_at,
    );
    return Resp.success(result);
  }

  @Tag('电子邮件 + 邮件验证码登录')
  @Post('/login/email')
  async loginByEmail(
    @Body() form: EmailLoginForm,
    @Ip() ip: string,
  ): Promise<Resp<ILoginResult>> {
    const { email, code } = form;

    if (!this.optService.verify(email, code, OPTWay.EMAIL_LOGIN)) {
      throw new BadRequestException('验证码错误'); // TODO: 增加验证码错误次数限制
    }

    const last_login_at = Date.now();
    const result = await this.userService.loginByEmail(
      email,
      ip,
      last_login_at,
    );
    return Resp.success(result);
  }

  @Tag('当前用户资料')
  @AuthApi()
  @Get('/profile')
  async getProfile(
    @CurrentUser() user: AuthTokenPayload,
  ): Promise<Resp<Record<string, any>>> {
    const profile = await this.userService.getProfile(user.id);
    return Resp.success(profile);
  }

  @Tag('更新当前用户资料')
  @AuthApi()
  @Put('/profile')
  async updateProfile(
    @CurrentUser() user: AuthTokenPayload,
    @Body() dto: UpdateProfileDto,
  ): Promise<Resp<Record<string, any>>> {
    const profile = await this.userService.updateProfile(user.id, dto);
    return Resp.success(profile);
  }

  @Tag('更新当前用户头像地址')
  @AuthApi()
  @Put('/avatar')
  async updateAvatar(
    @CurrentUser() user: AuthTokenPayload,
    @Body() dto: UpdateAvatarDto,
  ): Promise<Resp<Record<string, any>>> {
    const profile = await this.userService.updateAvatar(user.id, dto);
    return Resp.success(profile);
  }

  @Tag('上传当前用户头像')
  @AuthApi()
  @Post('/avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @CurrentUser() user: AuthTokenPayload,
    @UploadedFile() file?: {
      buffer: Buffer;
      originalname: string;
      mimetype: string;
    },
  ): Promise<Resp<Record<string, any> & { upload: AliOssUploadResult }>> {
    if (!file) {
      throw new BadRequestException('请选择头像图片');
    }
    const upload = await this.aliOssSdk.uploadImage(file);
    const profile = await this.userService.updateAvatar(user.id, {
      avatar: upload.url,
    });
    return Resp.success({
      ...profile,
      upload,
    });
  }

  @Tag('当前用户播放偏好')
  @AuthApi()
  @Get('/playback-preferences')
  async getPlaybackPreferences(
    @CurrentUser() user: AuthTokenPayload,
  ): Promise<Resp<Record<string, boolean>>> {
    const preferences = await this.userService.getPlaybackPreferences(user.id);
    return Resp.success(preferences);
  }

  @Tag('更新当前用户播放偏好')
  @AuthApi()
  @Put('/playback-preferences')
  async updatePlaybackPreferences(
    @CurrentUser() user: AuthTokenPayload,
    @Body() dto: PlaybackPreferencesDto,
  ): Promise<Resp<Record<string, boolean>>> {
    const preferences = await this.userService.updatePlaybackPreferences(
      user.id,
      dto,
    );
    return Resp.success(preferences);
  }

  @Todo('FIX', 'off')
  @Post('/logout')
  async logout(
    @CurrentUser() user: AuthTokenPayload,
    @HeaderAuthorization() token: string,
  ) {
    await this.userService.logout(user, token);
    return Resp.success();
  }
}
