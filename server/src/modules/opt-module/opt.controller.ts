import { Controller, Get, Inject, Param } from '@nestjs/common';
import Resp from '@/common/models/Resp';
import { Tag } from '@/decorators/tag.decorator';
import OptService from './opt.service';

@Tag('一次性验证码')
@Controller('opt')
export class OPTController {
  constructor(@Inject() private optService: OptService) { }

  @Get('/login/phone/:phone')
  @Tag('获取登录短信验证码')
  getPhoneLoginOPT(@Param('phone') phone: string): Resp<any> {
    if (!phone) {
      return Resp.badRequest('手机号不能为空');
    }
    const data = this.optService.generatePhoneLoginOPT(phone);
    return Resp.success(data);
  }

  @Get('/login/email/:email')
  @Tag('获取登录短信验证码')
  getEmailLoginOPT(@Param('email') email: string): Resp<any> {
    if (!email) {
      return Resp.badRequest('邮箱不能为空');
    }
    const data = this.optService.generateEmailLoginOPT(email);
    return Resp.success(data);
  }
}
