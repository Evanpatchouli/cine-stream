import log4js from 'log4js';
import AppConfig from '@/app.config';
import chalk from 'chalk';

const getCaller = (): string => {
  try {
    const error = new Error();
    const stack = error.stack?.split('\n') || [];

    // 寻找第一个不是 logger 本身的调用栈
    for (let i = 3; i < stack.length; i++) {
      const line = stack[i].trim();
      if (!line.includes('logger.ts') && !line.includes('node_modules')) {
        // 提取简化的类名/方法名
        const match = line.match(/at\s+([\w.]+)/);
        if (match) {
          const fullName = match[1];
          // 只取最后一部分（方法名）
          const parts = fullName.split('.');
          return parts[parts.length - 1];
        }
        return line.split(' ')[1] || 'anonymous';
      }
    }
    return 'unknown';
  } catch {
    return 'unknown';
  }
};

const colorfulCaller = true;
const default_prefix = '[Nest]';
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
  const spaces = levelSpaces[level.toUpperCase()] ?? 4;
  return ' '.repeat(spaces);
};

const P = '%[%p%]'; // %p - log level
const C = chalk.yellow('[%x{caller}]'); // %c - log category
const M = '%[%m%]'; // %m - log message

log4js.configure({
  appenders: {
    out: {
      type: 'stdout',
      layout: {
        type: 'pattern',
        pattern: `${compliedPrefix}  - ${datetime} %x{levelSpacing}% ${P} ${M}`,
        tokens: {
          caller: () => getCaller(),
          levelSpacing: (logEvent) => getLevelSpacing(logEvent.level.levelStr),
        },
      },
    },
  },
  categories: {
    default: {
      appenders: ['out'],
      level: AppConfig.Log4js.level,
    },
  },
});

const baseLogger = log4js.getLogger();

const ColorMap = (colorFul?: boolean) => ({
  ALL: colorFul ? chalk.grey : chalk.yellow,
  TRACE: colorFul ? chalk.blue : chalk.yellow,
  DEBUG: colorFul ? chalk.cyan : chalk.yellow,
  INFO: colorFul ? chalk.green : chalk.yellow,
  WARN: colorFul ? chalk.yellow : chalk.yellow,
  ERROR: colorFul ? chalk.red : chalk.yellow,
  FATAL: colorFul ? chalk.magenta : chalk.yellow,
  MARK: colorFul ? chalk.grey : chalk.yellow,
  OFF: colorFul ? chalk.grey : chalk.yellow,
});

export const createLogger = (context?: string) => {
  const colorMap = ColorMap(colorfulCaller);
  return {
    all: (message: string, ...args: any[]) => {
      const caller = colorMap.ALL(`[${context || getCaller()}]`);
      baseLogger.info(`${caller} ${message}`, ...args);
    },
    trace: (message: string, ...args: any[]) => {
      const caller = colorMap.TRACE(`[${context || getCaller()}]`);
      baseLogger.trace(`${caller} ${message}`, ...args);
    },
    info: (message: string, ...args: any[]) => {
      const caller = colorMap.INFO(`[${context || getCaller()}]`);
      baseLogger.info(`${caller} ${message}`, ...args);
    },
    debug: (message: string, ...args: any[]) => {
      const caller = colorMap.DEBUG(`[${context || getCaller()}]`);
      baseLogger.debug(`${caller} ${message}`, ...args);
    },
    warn: (message: string, ...args: any[]) => {
      const caller = colorMap.WARN(`[${context || getCaller()}]`);
      baseLogger.warn(`${caller} ${message}`, ...args);
    },
    error: (message: string, ...args: any[]) => {
      const caller = colorMap.ERROR(`[${context || getCaller()}]`);
      baseLogger.error(`${caller} ${message}`, ...args);
    },
    fatal: (message: string, ...args: any[]) => {
      const caller = colorMap.FATAL(`[${context || getCaller()}]`);
      baseLogger.error(`${caller} ${message}`, ...args);
    },
    mark: (message: string, ...args: any[]) => {
      const caller = colorMap.MARK(`[${context || getCaller()}]`);
      baseLogger.error(`${caller} ${message}`, ...args);
    },
    off: (message: string, ...args: any[]) => {
      const caller = colorMap.OFF(`[${context || getCaller()}]`);
      baseLogger.error(`${caller} ${message}`, ...args);
    },
  };
};

export const logger = createLogger();
