import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LoginLog, LoginLogSchema } from './LoginLog.schema';
import { LoginLogService } from './loginLog.service';
import { LoginLogController } from './LoginLog.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LoginLog.name, schema: LoginLogSchema },
    ]),
  ],
  controllers: [LoginLogController],
  providers: [LoginLogService],
  exports: [LoginLogService],
})
export class LoginLogModule {}
