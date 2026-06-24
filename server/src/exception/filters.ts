import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { APP_FILTER, HttpAdapterHost } from '@nestjs/core';
import CustomError, { IllegalArgument } from './CustomError';
import RS from 'src/constants/resp.constant';
import { getCaller } from '@/common/logger/get-caller';
import HttpStatusRSMap from './HttpExceptionCodeMap';
import DefaultNestMessageMap from './DefaultNestMessageMap';

@Catch()
export class GlobalExcenptionCatchFilter implements ExceptionFilter {
  private readonly logger = new Logger();
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    let httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string = RS.INTERNAL_SERVER_ERROR.message;
    let code: string = RS.INTERNAL_SERVER_ERROR.code;
    let data: any = null;

    /**
     * 处理 Nest 标准 HttpException
     */
    if (exception instanceof HttpException) {
      httpStatus = exception.getStatus();
      const response = exception.getResponse();

      let receivedMessage: string | undefined;

      if (typeof response === 'string') {
        receivedMessage = response;
      } else if (typeof response === 'object' && response !== null) {
        receivedMessage = (response as any).message;
        if (Array.isArray(receivedMessage)) {
          receivedMessage = receivedMessage.join(', ');
        }
      }

      const defaultNestMessage = DefaultNestMessageMap[httpStatus];

      /**
       * 判定逻辑：
       * 1. 如果有自定义 message 且不同于默认 → 视为用户传入的
       * 2. 否则用 HttpStatusRSMap
       */
      if (receivedMessage && receivedMessage !== defaultNestMessage) {
        message = receivedMessage;
      } else {
        message =
          HttpStatusRSMap[httpStatus]?.message ??
          RS.INTERNAL_SERVER_ERROR.message;
      }

      code = HttpStatusRSMap[httpStatus]?.code ?? RS.INTERNAL_SERVER_ERROR.code;
    } else if (
      /**
       * 处理自定义业务异常
       */
      (exception instanceof CustomError ||
        exception instanceof IllegalArgument) &&
      exception.getBack()
    ) {
      httpStatus = exception.getStatus();
      message = exception.getMessage();
      code = exception.getCode();
      data = exception.getData();
    }

    /**
     * 兜底：未知异常
     */
    const caller = getCaller();
    const loggerCaller =
      caller == 'unknown'
        ? `${GlobalExcenptionCatchFilter.name}`
        : `${caller}`;

    this.logger.error(
      message,
      (exception as Error).stack ?? String(exception),
      loggerCaller,
    );

    const responseBody = {
      message,
      code,
      data,
    };

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}

export const GlobalExcenptionCatchProvider = {
  provide: APP_FILTER,
  useClass: GlobalExcenptionCatchFilter,
};
