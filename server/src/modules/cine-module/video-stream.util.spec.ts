import {
  buildVideoEtag,
  RangeNotSatisfiableException,
  resolveByteRange,
} from './video-stream.util';

describe('resolveByteRange', () => {
  it('没有 Range 时返回整文件范围', () => {
    expect(resolveByteRange(undefined, 4096)).toEqual({
      start: 0,
      end: 4095,
      partial: false,
    });
  });

  it('支持显式开始和结束位置', () => {
    expect(resolveByteRange('bytes=0-1023', 4096)).toEqual({
      start: 0,
      end: 1023,
      partial: true,
    });
  });

  it('支持开放式结束位置', () => {
    expect(resolveByteRange('bytes=1024-', 4096)).toEqual({
      start: 1024,
      end: 4095,
      partial: true,
    });
  });

  it('支持后缀 Range', () => {
    expect(resolveByteRange('bytes=-512', 4096)).toEqual({
      start: 3584,
      end: 4095,
      partial: true,
    });
  });

  it('非法 Range 返回 416 异常', () => {
    expect(() => resolveByteRange('bytes=9999-10000', 4096)).toThrow(
      RangeNotSatisfiableException,
    );
    expect(() => resolveByteRange('bytes=abc', 4096)).toThrow(
      RangeNotSatisfiableException,
    );
  });
});

describe('buildVideoEtag', () => {
  it('相同文件元信息生成稳定 ETag', () => {
    expect(buildVideoEtag(4096, 2048)).toBe(buildVideoEtag(4096, 2048));
  });

  it('文件大小或修改时间变化时 ETag 会变化', () => {
    expect(buildVideoEtag(4096, 2048)).not.toBe(buildVideoEtag(8192, 2048));
    expect(buildVideoEtag(4096, 2048)).not.toBe(buildVideoEtag(4096, 4096));
  });
});
