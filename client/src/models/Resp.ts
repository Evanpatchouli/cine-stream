import { SUCCESS_CODE } from "@/constants";

export default class Resp<T = unknown> {
  private code: number | string;
  private message: string;
  private data: T | null;

  constructor(code: number | string, message: string, data: T | null) {
    this.code = code;
    this.message = message;
    this.data = data;
  }

  public getCode(): Resp["code"] {
    return this.code;
  }

  public getMessage(): Resp["message"] {
    return this.message;
  }

  public getData(): Resp<T>["data"] {
    return this.data;
  }

  public isSuccess(): boolean {
    return this.code === SUCCESS_CODE;
  }
}
