export const HLS_PROFILE_PRESETS = {
  '1080p': {
    profile: '1080p',
    height: 1080,
    bandwidth: 5_000_000,
    audioBitrate: '128k',
    crf: 23,
  },
  '720p': {
    profile: '720p',
    height: 720,
    bandwidth: 2_800_000,
    audioBitrate: '128k',
    crf: 24,
  },
  '360p': {
    profile: '360p',
    height: 360,
    bandwidth: 800_000,
    audioBitrate: '96k',
    crf: 27,
  },
} as const;

export type HlsProfile = keyof typeof HLS_PROFILE_PRESETS;

export const HLS_PROFILE_VALUES = Object.keys(
  HLS_PROFILE_PRESETS,
) as HlsProfile[];

export interface HlsVariantLike {
  profile: HlsProfile;
  width: number;
  height: number;
  bandwidth: number;
  playlist_path: string;
}

export function resolveAutoHlsProfile(sourceHeight: number): HlsProfile | null {
  if (sourceHeight >= HLS_PROFILE_PRESETS['720p'].height) {
    return '720p';
  }

  if (sourceHeight >= HLS_PROFILE_PRESETS['360p'].height) {
    return '360p';
  }

  return null;
}

export function computeScaledWidth(
  sourceWidth: number,
  sourceHeight: number,
  targetHeight: number,
): number {
  const scaledWidth = (sourceWidth * targetHeight) / sourceHeight;
  return Math.max(2, Math.round(scaledWidth / 2) * 2);
}

export function buildHlsMasterPlaylist(variants: HlsVariantLike[]): string {
  const sorted = [...variants].sort((left, right) => right.height - left.height);
  const lines = ['#EXTM3U', '#EXT-X-VERSION:3'];

  for (const variant of sorted) {
    lines.push(
      `#EXT-X-STREAM-INF:BANDWIDTH=${variant.bandwidth},RESOLUTION=${variant.width}x${variant.height}`,
    );
    lines.push(variant.playlist_path.replace(/\\/g, '/'));
  }

  return `${lines.join('\n')}\n`;
}

export function getHlsContentType(fileName: string): string {
  if (fileName.endsWith('.m3u8')) {
    return 'application/vnd.apple.mpegurl';
  }

  if (fileName.endsWith('.ts')) {
    return 'video/mp2t';
  }

  return 'application/octet-stream';
}

export function getHlsCacheControl(fileName: string): string {
  if (fileName.endsWith('.m3u8')) {
    return 'public, max-age=5, must-revalidate';
  }

  if (fileName.endsWith('.ts')) {
    return 'public, max-age=3600';
  }

  return 'public, max-age=60';
}
