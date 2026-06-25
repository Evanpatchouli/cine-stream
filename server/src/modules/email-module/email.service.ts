import cache from '@/cache';
import { OPTWay } from '@/constants/opt.constant';
import { IllegalArgument } from '@/exception/CustomError';
import { TimeUnitString, ValuesOf } from '@cine-stream/common';
import { Injectable, Session } from '@nestjs/common';
import nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import AppConfig from '@/app.config';

const { SMTP } = AppConfig;

const transporter = nodemailer.createTransport({
  host: SMTP.host, // SMTP服务器地址
  port: SMTP.port, // SMTP端口
  secure: SMTP.secure ?? true, // 使用SSL/TLS
  auth: {
    user: SMTP.user, // 邮箱账号
    pass: SMTP.pass, // SMTP授权码
  },
});

const EmailSubjectMap = {
  [OPTWay.EMAIL_LOGIN]: 'Cine Stream 登录验证邮件',
};

@Injectable()
export default class EmailService {
  constructor() {}

  async sendEmail(to: string, options: Omit<Mail.Options, 'from' | 'to'>) {
    this.validateTransport();
    await transporter.sendMail({
      from: '"Evanpatchouli" <evanpatchouli@foxmail.com>', // 发送者
      to, // 接收者
      ...options,
    });
  }

  async sendOptEmail(
    to: string,
    opt: string,
    optType: ValuesOf<typeof OPTWay>,
  ) {
    if (!to) throw new IllegalArgument('接收者邮箱地址不能为空');
    await this.sendEmail(to, {
      subject: EmailSubjectMap[optType],
      text: `您正在通过邮箱登录 Cine Stream，您的验证码为：${opt}，30分钟内有效，请勿将验证码告知他人，如不是本人请忽略本邮件。`,
    });
  }

  private validateTransport() {
    if (!transporter) throw new IllegalArgument('未配置 SMTP 服务器');
    if (!SMTP.user) throw new IllegalArgument('未配置 SMTP 用户名');
    if (!SMTP.pass) throw new IllegalArgument('未配置 SMTP 授权码');
    if (!SMTP.host) throw new IllegalArgument('未配置 SMTP 主机地址');
    if (!SMTP.port) throw new IllegalArgument('未配置 SMTP 端口');
    if (!SMTP.secure) throw new IllegalArgument('未配置 SMTP 是否使用 SSL/TLS');
  }
}
