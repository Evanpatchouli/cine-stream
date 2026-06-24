import RS from '@/constants/resp.constant';
import HttpStatusRSMap from './HttpExceptionCodeMap';

export type EvpErrorMeta = Partial<{
  code: string | number;
  message: string;
  data: any;
  back: boolean;
  status: number;
}>;

export default class CustomError extends Error {
  #meta: EvpErrorMeta;
  constructor(meta?: EvpErrorMeta | string) {
    if (typeof meta === 'object') {
      super(meta?.message ?? RS.INTERNAL_SERVER_ERROR.message);
      this.#meta = meta || {
        code: RS.INTERNAL_SERVER_ERROR.code,
        message: RS.INTERNAL_SERVER_ERROR.message,
        back: true,
        status: 500,
      };
    } else {
      super(meta || RS.INTERNAL_SERVER_ERROR.message);
      this.#meta = {
        code: RS.INTERNAL_SERVER_ERROR.code,
        message: meta || RS.INTERNAL_SERVER_ERROR.message,
        back: true,
        status: 500,
      };
    }
  }

  get meta() {
    return this.#meta;
  }

  set meta(meta: EvpErrorMeta) {
    this.#meta = meta;
  }

  public getStatus() {
    return this.#meta.status || 500;
  }

  public getMessage() {
    return this.#meta.message || HttpStatusRSMap[this.getStatus()]?.message || RS.INTERNAL_SERVER_ERROR.message;
  }

  public getCode() {
    return this.#meta.code || HttpStatusRSMap[this.getStatus()]?.code || RS.INTERNAL_SERVER_ERROR.code;
  }

  public getBack() {
    return this.#meta.back ?? true;
  }

  public getData() {
    return this.#meta.data ?? null;
  }
}

export class IllegalArgument extends CustomError {
  #meta: EvpErrorMeta;
  constructor(meta?: EvpErrorMeta | string) {
    if (typeof meta === 'object') {
      super(meta?.message ?? RS.BAD_REQUEST.message);
      this.#meta = meta || {
        code: RS.BAD_REQUEST.code,
        message: RS.BAD_REQUEST.message,
        back: true,
        status: 400,
      };
    } else {
      super(meta || RS.BAD_REQUEST.message);
      this.#meta = {
        code: RS.BAD_REQUEST.code,
        message: meta || RS.BAD_REQUEST.message,
        back: true,
        status: 400,
      };
    }
  }

  public getStatus() {
    return this.#meta.status || 400;
  }

  public getMessage() {
    return this.#meta.message || RS.BAD_REQUEST.message;
  }

  public getCode() {
    return this.#meta.code || RS.BAD_REQUEST.code;
  }
}
