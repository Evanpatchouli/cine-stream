import { TimeUnit, TimeUnitString } from '@cine-stream/common';
export default class TimeUnitUtil {
  private static readonly UNIT_MAP: Record<string, number> = {
    // 年 (365天)
    years: 31536000000,
    year: 31536000000,
    yrs: 31536000000,
    yr: 31536000000,
    y: 31536000000,

    // 周
    weeks: 604800000,
    week: 604800000,
    w: 604800000,

    // 天
    days: 86400000,
    day: 86400000,
    d: 86400000,

    // 小时
    hours: 3600000,
    hour: 3600000,
    hrs: 3600000,
    hr: 3600000,
    h: 3600000,

    // 分钟
    minutes: 60000,
    minute: 60000,
    mins: 60000,
    min: 60000,
    m: 60000,

    // 秒
    seconds: 1000,
    second: 1000,
    secs: 1000,
    sec: 1000,
    s: 1000,

    // 毫秒
    milliseconds: 1,
    millisecond: 1,
    msecs: 1,
    msec: 1,
    ms: 1,
  };

  /**
   * - 转换为毫秒
   */
  static convertToMillSeconds(time: TimeUnit): number {
    if (typeof time === 'number') {
      return time;
    }
    if (!time || time.trim() === '') {
      throw new Error('Time string cannot be empty');
    }

    const trimmed = time.trim();

    // 纯数字情况，默认单位是毫秒
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
      const millseconds = parseFloat(trimmed);
      if (isNaN(millseconds) || !isFinite(millseconds)) {
        throw new Error(`Invalid number value: ${time}`);
      }
      return millseconds;
    }

    // 匹配数字和单位部分
    // 支持可选空格：例如 "1d", "1 d", "1.5h", "1.5 h"
    const match = trimmed.match(/^(-?\d+(?:\.\d+)?)\s*([a-zA-Z]+)$/);

    if (!match) {
      throw new Error(
        `Invalid time format: ${time}. Expected format like "1d", "2.5h", "30min", or pure number like "60" (seconds)`,
      );
    }

    const value = parseFloat(match[1]);
    const unit = match[2].toLowerCase(); // 转换为小写以匹配映射表

    if (isNaN(value) || !isFinite(value)) {
      throw new Error(`Invalid number value in: ${time}`);
    }

    if (!(unit in TimeUnitUtil.UNIT_MAP)) {
      const validUnits = Object.keys(TimeUnitUtil.UNIT_MAP).sort().join(', ');
      throw new Error(
        `Unknown time unit: "${match[2]}". Supported units: ${validUnits}`,
      );
    }

    return value * TimeUnitUtil.UNIT_MAP[unit];
  }

  /**
   * - （简单别名）转换为毫秒
   */
  static getMilliseconds(time: TimeUnit): number {
    return this.convertToMillSeconds(time);
  }

  /**
   * - （最简别名）转换为毫秒
   */
  static toMS(time: TimeUnit): number {
    return this.convertToMillSeconds(time);
  }
  /**
   * - 转换为秒
   */
  static getSeconds(time: TimeUnit): number {
    return this.convertToMillSeconds(time) / this.UNIT_MAP['seconds'];
  }
  /**
   * - 转换为分钟
   */
  static getMinutes(time: TimeUnit): number {
    return this.convertToMillSeconds(time) / this.UNIT_MAP['minutes'];
  }
  /**
   * - 转换为小时
   */
  static getHours(time: TimeUnit): number {
    return this.convertToMillSeconds(time) / this.UNIT_MAP['hours'];
  }
  /**
   * - 转换为天
   */
  static getDays(time: TimeUnit): number {
    return this.convertToMillSeconds(time) / this.UNIT_MAP['days'];
  }

  /**
   * - 转换为周
   */
  static getWeeks(time: TimeUnit): number {
    return this.convertToMillSeconds(time) / this.UNIT_MAP['weeks'];
  }

  /**
   * - 转换为年
   */
  static getYears(time: TimeUnit): number {
    return this.convertToMillSeconds(time) / this.UNIT_MAP['years'];
  }

  /**
   * - 静态辅助方法，用于验证时间字符串格式
   */
  static isValidTimeString(time: string): time is TimeUnitString {
    try {
      this.convertToMillSeconds(time as TimeUnit);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * - 获取支持的完整时间单位列表（用于错误信息或文档）
   */
  static getSupportedUnits(): string[] {
    return Object.keys(this.UNIT_MAP);
  }

  /**
   * - 获取时间单位的完整名称
   */
  static getUnitName(unitAbbreviation: string): string {
    const unit = unitAbbreviation.toLowerCase();
    const unitNames: Record<string, string> = {
      y: 'years',
      yr: 'years',
      yrs: 'years',
      year: 'years',
      years: 'years',
      w: 'weeks',
      week: 'weeks',
      weeks: 'weeks',
      d: 'days',
      day: 'days',
      days: 'days',
      h: 'hours',
      hr: 'hours',
      hrs: 'hours',
      hour: 'hours',
      hours: 'hours',
      m: 'minutes',
      min: 'minutes',
      mins: 'minutes',
      minute: 'minutes',
      minutes: 'minutes',
      s: 'seconds',
      sec: 'seconds',
      secs: 'seconds',
      second: 'seconds',
      seconds: 'seconds',
      ms: 'milliseconds',
      msec: 'milliseconds',
      msecs: 'milliseconds',
      millisecond: 'milliseconds',
      milliseconds: 'milliseconds',
    };

    return unitNames[unit] || unitAbbreviation;
  }
}
