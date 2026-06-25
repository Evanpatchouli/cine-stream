import { normalizeWatchProgressPayload } from './watch-progress';

describe('normalizeWatchProgressPayload', () => {
  it('优先根据播放位置和总时长计算真实进度', () => {
    expect(
      normalizeWatchProgressPayload({
        progress: 1,
        position_seconds: 180,
        duration_seconds: 600,
      }),
    ).toEqual({
      progress: 30,
      position_seconds: 180,
      duration_seconds: 600,
    });
  });

  it('接近片尾时直接视为看完', () => {
    expect(
      normalizeWatchProgressPayload({
        progress: 96,
        position_seconds: 598,
        duration_seconds: 600,
      }),
    ).toEqual({
      progress: 100,
      position_seconds: 600,
      duration_seconds: 600,
    });
  });

  it('没有总时长时回退到显式传入的百分比', () => {
    expect(
      normalizeWatchProgressPayload({
        progress: 48,
        position_seconds: 180,
        duration_seconds: 0,
      }),
    ).toEqual({
      progress: 48,
      position_seconds: 180,
      duration_seconds: 0,
    });
  });
});
