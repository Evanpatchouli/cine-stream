import { Request } from 'express';

/**
 * 获取客户端真实IP地址（支持多层代理）
 * 优先级：代理头 > socket地址 > 备用方案
 */
export const getClientIp = (request: Request): string => {
  let ip = 'unknown';

  // 1. 首先检查所有可能的代理头（按信任顺序）
  const proxyHeaders = [
    'x-client-ip', // 自定义代理
    'x-forwarded-for', // 标准代理头（可能包含多个IP）
    'x-real-ip', // Nginx代理
    'x-cluster-client-ip', // Rack代理
    'x-forwarded', // Squid代理
    'forwarded-for', // RFC 7239
    'forwarded', // RFC 7239
    'cf-connecting-ip', // Cloudflare
    'true-client-ip', // Akamai/Cloudflare
    'fastly-client-ip', // Fastly
    'x-appengine-user-ip', // Google App Engine
    'x-azure-clientip', // Azure
    'x-aws-vpc', // AWS
    'x-arr-logid', // Azure ARR
  ];

  for (const header of proxyHeaders) {
    const value = request.headers[header];
    if (value) {
      ip = extractFirstIp(value);
      if (ip && ip !== 'unknown') {
        break;
      }
    }
  }

  // 2. 如果代理头未找到有效IP，检查socket地址
  if (!ip || ip === 'unknown') {
    // 优先使用 request.ip（Express已处理）
    if (request.ip && request.ip !== '::1') {
      ip = request.ip;
    }
    // 检查连接的remoteAddress
    else if (request.connection?.remoteAddress) {
      ip = request.connection.remoteAddress;
    }
    // 检查socket的remoteAddress
    else if (request.socket?.remoteAddress) {
      ip = request.socket.remoteAddress;
    }
    // 旧版Node.js兼容
    else if ((request as any)._remoteAddress) {
      ip = (request as any)._remoteAddress;
    }
  }

  // 3. 清理和标准化IP地址
  ip = normalizeIp(ip);

  // 4. 验证IP格式（可选，增加安全性）
  if (!isValidIp(ip) && ip !== 'localhost') {
    // 记录日志但不抛出错误，防止攻击
    console.warn(
      `Invalid IP detected: ${ip}, request headers:`,
      request.headers,
    );
    return 'unknown';
  }

  return ip;
};

/**
 * 从代理头值中提取第一个IP
 */
const extractFirstIp = (value: string | string[]): string => {
  try {
    if (Array.isArray(value)) {
      // 取数组第一个元素
      value = value[0];
    }

    if (typeof value === 'string') {
      // 移除空格，按逗号分割（X-Forwarded-For可能有多个代理IP）
      const ips = value.split(',').map((ip) => ip.trim());

      // 返回第一个非空、非unknown的IP
      for (const ip of ips) {
        if (ip && ip !== '' && ip !== 'unknown') {
          return ip;
        }
      }
    }
  } catch (error) {
    console.error('Error extracting IP:', error);
  }

  return 'unknown';
};

/**
 * 标准化IP地址格式
 */
const normalizeIp = (ip: string): string => {
  if (!ip || ip === 'unknown') {
    return 'unknown';
  }

  // 移除IPv6映射的IPv4前缀
  if (ip.startsWith('::ffff:')) {
    ip = ip.substring(7); // 移除 '::ffff:'
  }

  // IPv6本地地址转IPv4
  if (ip === '::1') {
    return '127.0.0.1';
  }

  // 移除端口号（如果有）
  const portIndex = ip.lastIndexOf(':');
  if (portIndex > -1) {
    // 检查是否为IPv6地址（包含多个冒号）
    const colonCount = (ip.match(/:/g) || []).length;
    if (colonCount === 1 || ip.includes('.')) {
      // 可能是IPv4:port或IPv6简写:port
      ip = ip.substring(0, portIndex);
    }
  }

  // 清理可能的方括号（IPv6地址）
  ip = ip.replace(/^\[|\]$/g, '');

  return ip;
};

/**
 * 验证IP地址格式（IPv4或IPv6）
 */
const isValidIp = (ip: string): boolean => {
  if (!ip || ip === 'unknown' || ip === 'localhost') {
    return true;
  }

  // IPv4正则
  const ipv4Regex =
    /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

  // IPv6正则（简化版）
  const ipv6Regex =
    /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;

  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
};

/**
 * 获取客户端IP并包含可信度信息
 */
export interface IpInfoInterface {
  ip: string;
  source: 'proxy-header' | 'socket' | 'connection' | 'unknown';
  isLocal: boolean;
  isPrivate: boolean;
  rawValue?: string;
}

export const getClientIpWithInfo = (request: Request): IpInfoInterface => {
  const ip = getClientIp(request);

  return {
    ip,
    source: 'unknown', // 可以扩展记录来源
    isLocal: ip === '127.0.0.1' || ip === 'localhost',
    isPrivate: isPrivateIp(ip),
  };
};

/**
 * 检查是否为私有IP
 */
const isPrivateIp = (ip: string): boolean => {
  if (!ip || ip === 'unknown') return false;

  // 私有IP段
  const privateRanges = [
    /^10\./, // 10.0.0.0/8
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12
    /^192\.168\./, // 192.168.0.0/16
    /^127\./, // 127.0.0.0/8
    /^169\.254\./, // 链路本地
    /^::1$/, // IPv6本地
    /^fc00::/, // IPv6私有
    /^fe80::/, // IPv6链路本地
  ];

  return privateRanges.some((range) => range.test(ip));
};
