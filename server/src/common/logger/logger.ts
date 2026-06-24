import log4js from 'log4js';
import chalk from 'chalk';
import { getTraceId } from '../trace/trace.storage';
import AppConfig from '@/app.config';
import { getCaller } from './get-caller';
import pkg from '../../../package.json';

const colorful = true;

const colorfulCaller = false;
const default_prefix = pkg.name;
const custom_prefix = AppConfig.Log4js.prefix;
const prefix = custom_prefix || default_prefix;
const pid = process.pid;
const compliedPrefix = chalk.green(`${prefix} ${pid}`);

const datetime = '%d{yyyy/MM/dd hh:mm:ss}';

// 定义等级对应的空格数量
const levelSpaces = {
  TRACE: 1,
  DEBUG: 1,
  INFO: 2,
  WARN: 0,
  ERROR: 1,
  FATAL: 1,
};

// 获取等级对应的空格字符串
const getLevelSpacing = (level: string) => {
  const spaces = levelSpaces[level.toUpperCase()] || 4;
  return ' '.repeat(spaces);
};

const LEVEL = '%[%p%]'; // %p - log level
const CALLER = chalk.yellow('[%x{caller}]'); // %c - log category
const TRACE = '[%x{traceId}]';
const MESSAGE = '%[%m%]'; // %m - log message

const Color = {
  ALL: colorful ? chalk.grey : chalk.yellow,
  TRACE: colorful ? chalk.blue : chalk.yellow,
  DEBUG: colorful ? chalk.cyan : chalk.yellow,
  INFO: colorful ? chalk.green : chalk.yellow,
  WARN: colorful ? chalk.yellow : chalk.yellow,
  ERROR: colorful ? chalk.red : chalk.yellow,
  FATAL: colorful ? chalk.magenta : chalk.yellow,
  MARK: colorful ? chalk.grey : chalk.yellow,
  OFF: colorful ? chalk.grey : chalk.yellow,
};

log4js.configure({
  appenders: {
    out: {
      type: 'stdout',
      layout: {
        type: 'pattern',
        pattern: `${compliedPrefix}  - ${datetime} %x{levelSpacing}% ${LEVEL} ${CALLER} ${TRACE} ${MESSAGE}`,
        tokens: {
          caller: () => getCaller(),
          traceId: () => getTraceId() || 'no-trace',
          levelSpacing: (logEvent) => getLevelSpacing(logEvent.level.levelStr),
        },
      },
    },
  },
  categories: {
    default: { appenders: ['out'], level: 'debug' },
  },
});

export const createLogger = (context?: string) => {
  const logger = log4js.getLogger();

  const caller = context ?? getCaller();

  // return {
  //   trace: (msg: string, ...a: any[]) =>
  //     logger.trace(Color.TRACE(`[${caller}] ${msg}`), ...a),
  //   debug: (msg: string, ...a: any[]) =>
  //     logger.debug(Color.DEBUG(`[${caller}] ${msg}`), ...a),
  //   info: (msg: string, ...a: any[]) =>
  //     logger.info(Color.INFO(`[${caller}] ${msg}`), ...a),
  //   warn: (msg: string, ...a: any[]) =>
  //     logger.warn(Color.WARN(`[${caller}] ${msg}`), ...a),
  //   error: (msg: string, ...a: any[]) =>
  //     logger.error(Color.ERROR(`[${caller}] ${msg}`), ...a),
  //   fatal: (msg: string, ...a: any[]) =>
  //     logger.fatal(Color.FATAL(`[${caller}] ${msg}`), ...a),
  // };
  return logger;
};

export const logger = createLogger();
