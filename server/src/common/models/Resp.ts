import { Maybe } from '@cine-stream/common';
import RS from '@/constants/resp.constant';

export default class Resp<T = unknown> {
  public code: Maybe<number | string>;
  public message: Maybe<string>;
  public data: Maybe<T>;

  constructor(code?: Maybe<number | string>, message?: string, data?: T) {
    this.code = code;
    this.message = message;
    this.data = data;
  }

  Code(code: number | string) {
    this.code = code;
    return this;
  }

  Message(message: string) {
    this.message = message;
    return this;
  }

  Data(data: T) {
    this.data = data;
    return this;
  }

  PageData<E = Record<string, any>>(
    list: E[],
    page: number,
    size: number,
    total: number,
  ) {
    this.data = {
      list,
      page,
      size,
      total,
      totalPages: Math.ceil(total / size),
    } as T;
  }

  public static success<T>(data?: T): Resp<T> {
    return new Resp(RS.SUCCESS.code, RS.SUCCESS.message, data);
  }

  public static fail<T>(message: string, data?: T): Resp<T> {
    return new Resp(RS.BAD_REQUEST.code, message, data);
  }

  public static badRequest<T>(message: string, data?: T): Resp<T> {
    return new Resp(RS.BAD_REQUEST.code, message, data);
  }

  public static unauthorized<T>(message: string, data?: T): Resp<T> {
    return new Resp(RS.UNAUTHORIZED.code, message, data);
  }

  public static forbidden<T>(message: string, data?: T): Resp<T> {
    return new Resp(RS.FORBIDDEN.code, message, data);
  }

  public static notFound<T>(message: string, data?: T): Resp<T> {
    return new Resp(RS.NOT_FOUND.code, message, data);
  }

  public static internalServerError<T>(message: string, data?: T): Resp<T> {
    return new Resp(RS.INTERNAL_SERVER_ERROR.code, message, data);
  }

  public static serviceUnavailable<T>(message: string, data?: T): Resp<T> {
    return new Resp(RS.SERVICE_UNAVAILABLE.code, message, data);
  }
}
