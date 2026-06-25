import { HttpException, HttpStatus } from '@nestjs/common';

export class RangeNotSatisfiableException extends HttpException {
  constructor(public readonly size: number) {
    super('Range 请求范围无效', HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE);
  }
}

export interface ByteRange {
  start: number;
  end: number;
  partial: boolean;
}

/**
 * 解析单个 HTTP Range 头，只支持 bytes 单区间请求。
 */
export function resolveByteRange(
  range: string | undefined,
  size: number,
): ByteRange {
  if (!range) {
    return { start: 0, end: size - 1, partial: false };
  }

  const match = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
  if (!match) {
    throw new RangeNotSatisfiableException(size);
  }

  const [, startText, endText] = match;
  let start = startText ? Number(startText) : 0;
  let end = endText ? Number(endText) : size - 1;

  if (!startText && endText) {
    const suffixLength = Number(endText);
    if (!Number.isInteger(suffixLength) || suffixLength <= 0) {
      throw new RangeNotSatisfiableException(size);
    }
    start = Math.max(size - suffixLength, 0);
    end = size - 1;
  }

  if (
    !Number.isInteger(start) ||
    !Number.isInteger(end) ||
    start < 0 ||
    end < start ||
    start >= size
  ) {
    throw new RangeNotSatisfiableException(size);
  }

  return {
    start,
    end: Math.min(end, size - 1),
    partial: true,
  };
}

/**
 * 基于文件大小和修改时间生成弱 ETag，避免为大文件额外计算内容哈希。
 */
export function buildVideoEtag(size: number, mtimeMs: number): string {
  const normalizedMtime = Math.max(0, Math.trunc(mtimeMs));
  return `W/"${size.toString(16)}-${normalizedMtime.toString(16)}"`;
}
