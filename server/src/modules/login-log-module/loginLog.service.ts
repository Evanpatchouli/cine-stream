import { DeleteResult, Model, Types } from 'mongoose';
import { Injectable, Dependencies, Inject } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { LoginLog } from './LoginLog.schema';
import dayjs from 'dayjs';

@Injectable()
@Dependencies(getModelToken(LoginLog.name))
export class LoginLogService {
  constructor(private model: Model<LoginLog>) {
    this.model = model;
  }

  async create(user_id: string, login_at: number, ip: string) {
    const created = new this.model({
      user_id,
      login_at,
      login_ip: ip,
    });
    return await created.save();
  }

  async findAll() {
    return this.model.find().exec();
  }

  async findById(id: string) {
    const query = this.model.findById(id);
    return await query.exec();
  }

  async findByIds(ids: string[]) {
    const query = this.model.find({ _id: { $in: ids } });
    return await query.exec();
  }

  async delete(id: string): Promise<DeleteResult> {
    return this.model.deleteOne({ id }).exec();
  }

  async deleteByIds(ids: string[]): Promise<DeleteResult> {
    return this.model.deleteMany({ _id: { $in: ids } }).exec();
  }

  async findByUserId(user_id: string) {
    return this.model.find({ user_id }).exec();
  }

  async findPageByUserId(user_id: string, page: number, size: number) {
    return this.model
      .find({ user_id })
      .skip((page - 1) * size)
      .limit(size)
      .exec();
  }

  async countDailyLoginLog() {
    return this.model.countDocuments({
      login_at: {
        $gte: new Date().setHours(0, 0, 0, 0),
        $lt: new Date().setHours(23, 59, 59, 999),
      },
    });
  }

  async countWeeklyLoginLog() {
    return this.model.countDocuments({
      login_at: {
        $gte: new Date().setDate(new Date().getDate() - 7),
        $lt: new Date().setDate(new Date().getDate()),
      },
    });
  }

  async countMonthlyLoginLog() {
    return this.model.countDocuments({
      login_at: {
        $gte: new Date().setMonth(new Date().getMonth() - 1),
        $lt: new Date().setMonth(new Date().getMonth()),
      },
    });
  }

  async countYearlyLoginLog() {
    return this.model.countDocuments({
      login_at: {
        $gte: new Date().setFullYear(new Date().getFullYear() - 1),
        $lt: new Date().setFullYear(new Date().getFullYear()),
      },
    });
  }

  // 统计指定某天的登录日志
  async countDayLoginLog(date: number) {
    return this.model.countDocuments({
      login_at: {
        $gte: dayjs(date).startOf('day').valueOf(), // 起始时间
        $lt: dayjs(date).endOf('day').valueOf(), // 结束时间
      },
    });
  }

  // 获取近七天登录日志的趋势数据
  async getDailyTrendData() {
    const today = dayjs();
    const results = await Promise.all(
      Array.from(Array(7).keys()).map(async (day) => {
        // 获取前 day 天的日期
        const date = today.subtract(7 - day, 'day');
        const count = await this.countDayLoginLog(date.valueOf());
        const growth = 0;
        return {
          date: date.format('YYYY-MM-DD'),
          count,
          growth,
        };
      }),
    );

    // 计算环比增长率
    for (let i = 1; i < results.length; i++) {
      const current = results[i];
      const previous = results[i - 1];
      current.growth =
        ((current.count - previous.count) / previous.count) * 100;
    }

    return results; // 返回结果
  }
}
