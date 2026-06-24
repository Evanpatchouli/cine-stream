import { logger } from '@/common/logger';
import { CaptchaWay } from '@/constants/captcha.constant';
import { SessionState } from '@/types';
import { ValuesOf } from '@cine-stream/common';
import { isBlank } from '@/utils/string.utl';
import { orBlank } from '@/utils/value';
import { Injectable, Session } from '@nestjs/common';
import svgCaptcha from 'svg-captcha';

@Injectable()
export default class CaptchaService {
  constructor() {}

  generate(way: ValuesOf<typeof CaptchaWay>, session: SessionState) {
    const { text, data } = svgCaptcha.create({
      size: 4, // 验证码长度
      ignoreChars: '0o1i', // 排除容易混淆的字符
      noise: 2, // 干扰线条数
      color: true, // 字符是否有颜色
      background: '#fff', // 背景色 #f0f2f5，灰色看不清
    });
    session[way] = text;
    return Buffer.from(data, 'utf8').toString('base64');
  }

  verify(
    text: string,
    way: ValuesOf<typeof CaptchaWay>,
    session: SessionState,
    autoDisable = true,
  ) {
    logger.info(
      `verify captcha: text(${text}) <=> session[${way}](${session[way]}) (Ignore case)`,
    );
    if (!text || isBlank(text)) {
      return false;
    }
    const isValid =
      orBlank(text).toLowerCase() === orBlank(session[way]).toLowerCase();
    if (isValid && autoDisable) {
      this.disable(way, session);
    }
    return isValid;
  }

  disable(way: ValuesOf<typeof CaptchaWay>, session: SessionState) {
    session[way] = null;
  }
}
