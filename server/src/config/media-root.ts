import * as fs from 'fs/promises';
import * as path from 'path';
import AppConfig from '@/app.config';

interface MediaRootConfig {
  root?: string;
  updated_at?: number;
}

const configFile = path.resolve(
  AppConfig.Process.ROOT,
  'storage',
  'media-root.json',
);

export function resolveVideoRoot(root: string): string {
  return path.isAbsolute(root)
    ? path.resolve(root)
    : path.resolve(AppConfig.Process.ROOT, root);
}

async function readMediaRootConfig(): Promise<MediaRootConfig> {
  try {
    const content = await fs.readFile(configFile, 'utf-8');
    return JSON.parse(content) as MediaRootConfig;
  } catch {
    return {};
  }
}

export async function getVideoRootSetting(): Promise<{
  configured_root: string;
  root: string;
}> {
  const config = await readMediaRootConfig();
  const configuredRoot = config.root || AppConfig.Media.VIDEO_LIBRARY_ROOT;
  return {
    configured_root: configuredRoot,
    root: resolveVideoRoot(configuredRoot),
  };
}

export async function updateVideoRootSetting(root: string): Promise<{
  configured_root: string;
  root: string;
}> {
  const configuredRoot = root.trim();
  const absoluteRoot = resolveVideoRoot(configuredRoot);

  await fs.mkdir(absoluteRoot, { recursive: true });
  await fs.mkdir(path.dirname(configFile), { recursive: true });
  await fs.writeFile(
    configFile,
    JSON.stringify(
      {
        root: configuredRoot,
        updated_at: Date.now(),
      } satisfies MediaRootConfig,
      null,
      2,
    ),
    'utf-8',
  );

  return {
    configured_root: configuredRoot,
    root: absoluteRoot,
  };
}
