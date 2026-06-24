import { Controller, Get, Inject } from '@nestjs/common';
import { LoginLogService } from './loginLog.service';
import Resp from '@/common/models/Resp';

@Controller('login-log')
export class LoginLogController {
  constructor(@Inject() private readonly loginLogService: LoginLogService) {}

  @Get('/count/daily')
  async countDailyLoginLog() {
    const count = await this.loginLogService.countDailyLoginLog();
    return Resp.success(count);
  }

  @Get('/count/weekly')
  async countWeeklyLoginLog() {
    const count = await this.loginLogService.countWeeklyLoginLog();
    return Resp.success(count);
  }

  @Get('/count/monthly')
  async countMonthlyLoginLog() {
    const count = await this.loginLogService.countMonthlyLoginLog();
    return Resp.success(count);
  }

  @Get('/count/yearly')
  async countYearlyLoginLog() {
    const count = await this.loginLogService.countYearlyLoginLog();
    return Resp.success(count);
  }

  @Get('/trend/daily')
  async getDailyTrendData() {
    const result = await this.loginLogService.getDailyTrendData();
    return Resp.success(result);
  }
}
