import { Module } from '@nestjs/common';
import { OPTController } from './opt.controller';
import OPTService from './opt.service';
import { EmailModule } from '../email-module';
import { MessageModule } from '../message-module';

@Module({
  imports: [EmailModule, MessageModule],
  controllers: [OPTController],
  providers: [OPTService],
  exports: [OPTService],
})
export class OPTModule {}
