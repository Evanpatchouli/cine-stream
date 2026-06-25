import {
  buildHlsMasterPlaylist,
  computeScaledWidth,
  getHlsCacheControl,
  getHlsContentType,
  resolveAutoHlsProfile,
} from './hls.util';

describe('hls.util', () => {
  it('默认档位优先选择 720p，其次 360p', () => {
    expect(resolveAutoHlsProfile(1080)).toBe('720p');
    expect(resolveAutoHlsProfile(720)).toBe('720p');
    expect(resolveAutoHlsProfile(540)).toBe('360p');
    expect(resolveAutoHlsProfile(240)).toBeNull();
  });

  it('会把缩放宽度修正为偶数', () => {
    expect(computeScaledWidth(1920, 1080, 720)).toBe(1280);
    expect(computeScaledWidth(1280, 720, 360)).toBe(640);
  });

  it('可以生成 master playlist', () => {
    expect(
      buildHlsMasterPlaylist([
        {
          profile: '360p',
          width: 640,
          height: 360,
          bandwidth: 800000,
          playlist_path: '360p/index.m3u8',
        },
        {
          profile: '720p',
          width: 1280,
          height: 720,
          bandwidth: 2800000,
          playlist_path: '720p/index.m3u8',
        },
      ]),
    ).toContain('720p/index.m3u8');
  });

  it('按文件类型返回 HLS 资源响应头策略', () => {
    expect(getHlsContentType('index.m3u8')).toBe(
      'application/vnd.apple.mpegurl',
    );
    expect(getHlsContentType('segment_001.ts')).toBe('video/mp2t');
    expect(getHlsCacheControl('index.m3u8')).toContain('max-age=5');
    expect(getHlsCacheControl('segment_001.ts')).toContain('max-age=3600');
  });
});
