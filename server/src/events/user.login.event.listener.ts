import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import UserLoginEvent from './user.login.event';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { logger } from '@/common/logger';
import UserCreatedEvent from './user.created.event';
import { LoginLogService } from '@/modules/login-log-module/loginLog.service';

@Injectable()
export class UserEventsListener {
  // constructor(@InjectConnection() private conn: Connection) {}
  constructor(@Inject() private loginLogService: LoginLogService) {}

  @OnEvent('user.created')
  handleUserCreatedEvent(event: UserCreatedEvent) {
    logger.info(`用户创建（id: ${event.id}）`);
    logger.debug('用户创建事件:', event);
    logger.info(`将为用户（id: ${event.id}）推送欢迎`);
    // 发送欢迎邮件
    // 创建用户统计
    // 初始化用户设置
  }

  @OnEvent('user.login')
  async handleUserLoginEvent(event: UserLoginEvent) {
    logger.info(`用户登录（id: ${event.id}, ip: ${event.last_login_ip}）`);
    logger.debug('用户登录事件:', event);
    await this.loginLogService.create(
      event.id,
      event.last_login_at,
      event.last_login_ip,
    );
  }

  @OnEvent('user.logout')
  handleUserDeletedEvent(event: UserLoginEvent) {
    logger.info(`用户登出（id: ${event.id}）`);
    logger.debug('用户登出事件:', event);
  }
}
