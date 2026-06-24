import { Request } from 'express';
import { toUppercase } from './mapper';
import { Eq, Or } from './map.filter.fn';

export { getClientIp } from './ip.utils';

export const getUserAgent = (req: Request) => {
  return req.headers['user-agent'] || 'unknown';
};

export const getDeviceType = (userAgent: string) => {
  const mobileRegex =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  return mobileRegex.test(userAgent) ? 'mobile' : 'desktop';
};

export const getDeviceOS = (userAgent: string) => {
  const osRegex = /Windows NT|Macintosh|Linux|Android|iOS/i;
  const match = osRegex.exec(userAgent);
  return match ? match[0] : 'unknown';
};

export const getDeviceBrowser = (userAgent: string) => {
  const browserRegex = /Chrome|Firefox|Safari|Edge|Opera|Brave/i;
  const match = browserRegex.exec(userAgent);
  return match ? match[0] : 'unknown';
};

export const getDeviceVersion = (userAgent: string) => {
  const versionRegex = /Chrome\/(\d+\.\d+)/;
  const match = versionRegex.exec(userAgent);
  return match ? match[1] : 'unknown';
};

export const getDeviceInfo = (req: Request) => {
  const userAgent = getUserAgent(req);
  const deviceType = getDeviceType(userAgent);
  const deviceOS = getDeviceOS(userAgent);
  const deviceBrowser = getDeviceBrowser(userAgent);
  const deviceVersion = getDeviceVersion(userAgent);
  return {
    deviceType,
    deviceOS,
    deviceBrowser,
    deviceVersion,
  };
};

export const getDeviceId = (req: Request) => {
  const userAgent = getUserAgent(req);
  const deviceType = getDeviceType(userAgent);
  const deviceOS = getDeviceOS(userAgent);
  const deviceBrowser = getDeviceBrowser(userAgent);
  const deviceVersion = getDeviceVersion(userAgent);
  return `${deviceType}-${deviceOS}-${deviceBrowser}-${deviceVersion}`;
};

export const getTimestamp = (req: Request) => {
  const key = Object.keys(req.headers)
    .map(toUppercase)
    .find(Or(Eq('TIMESTAMP'), Eq('X-TIMESTAMP')));

  return key ? (req.headers[key] as string) : null;
};

export const getNonce = (req: Request) => {
  const key = Object.keys(req.headers)
    .map(toUppercase)
    .find(Or(Eq('NONCE'), Eq('X-NONCE')));

  return key ? (req.headers[key] as string) : null;
};

export const getAuthorization = (req: Request) => {
  // Bearer
  if (
    req.headers.authorization &&
    req.headers.authorization.split(' ')[0] === 'Bearer'
  ) {
    return req.headers.authorization.split(' ')[1];
  }
  return null;
};
