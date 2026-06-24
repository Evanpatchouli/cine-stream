import { Controller, Get, Inject, Session } from '@nestjs/common';
import Resp from '@/common/models/Resp';
import { Tag } from '@/decorators/tag.decorator';
import type { SessionState } from '@/types';
import CaptchaService from './captcha.service';
import { CaptchaWay } from '@/constants/captcha.constant';

@Tag('图形验证码')
@Controller('captcha')
export class CaptchaController {
  constructor(@Inject() private captchaService: CaptchaService) {}

  @Get('/login')
  @Tag('获取用户登录时的图片验证码')
  getLoginCaptcha(@Session() session: SessionState): Resp<any> {
    const data = this.captchaService.generate(CaptchaWay.LOGIN, session);
    return Resp.success(data);
  }

  @Get('/register')
  @Tag('获取用户注册时的图片验证码')
  getRegisterCaptcha(@Session() session: SessionState): Resp<any> {
    const data = this.captchaService.generate(CaptchaWay.REGISTER, session);
    return Resp.success(data);
  }
}
