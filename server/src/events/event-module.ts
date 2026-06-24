import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { UserEventsListener } from './user.login.event.listener';
import { LoginLogModule } from '@/modules/login-log-module';

@Module({
  imports: [EventEmitterModule.forRoot(), LoginLogModule],
  providers: [UserEventsListener],
  exports: [EventEmitterModule],
})
export class EventModule {}
