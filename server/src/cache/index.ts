import { Nullable, TimeUnitString } from '@cine-stream/common';
import TimeUnitUtil from '../utils/time.unit.util';
import { createLogger } from '@/common/logger';
import path from 'path';
import AppConfig from '@/app.config';
import fs from 'fs';

interface CacheItem {
  value: any;
  createAt: number; // 创建时间戳
  expireAt: number | null; // 过期时间戳
}

interface UpdateOptions {
  /** 是否重新设置TTL，默认为 false */
  renewTTL?: boolean | number | TimeUnitString;
  /** 如果键不存在时是否创建，默认为 true */
  createIfNotExists?: boolean;
  /** 创建时使用的TTL，仅在createIfNotExists为true时生效 */
  createWithTTL?: number | TimeUnitString;
  /** 是否水合（合并）对象，默认为 false */
  hydrate?: boolean;
  /** 水合模式：'shallow'（浅合并）或 'deep'（深合并），默认为 'shallow' */
  hydrateMode?: 'shallow' | 'deep';
}

// 类型安全缓存装饰器
export function createTypedCache() {
  const instance = new CustomCache();

  return {
    // 为预定义键提供类型安全的 getter/setter
    get loginedCount(): number | null {
      return instance.get<number>('loginedCount');
    },
    set loginedCount(value: number | null) {
      if (value !== null) {
        instance.set('loginedCount', value);
      } else {
        instance.delete('loginedCount');
      }
    },

    // 通用的方法
    set: <T>(key: string, value: T, ttl?: Nullable<number | TimeUnitString>) =>
      instance.set(key, value, ttl),

    get: <T = any>(key: string) => instance.get<T>(key),

    has: (key: string) => instance.has(key),

    update: <T>(key: string, value: T, options?: UpdateOptions) =>
      instance.update(key, value, options),

    delete: (key: string) => instance.delete(key),

    clear: () => instance.clear(),

    size: () => instance.size(),

    destroy: () => instance.destroy(),

    // 获取剩余过期时间（毫秒）
    getTTL: (key: string) => instance.getTTL(key),

    // 获取所有键
    keys: () => instance.keys(),

    persist: () => instance.persist(),

    getInfo: () => getCacheInfo(instance), // 获取缓存情况
  };
}

export type CacheInfo = {
  size: number;
  alive_count: number;
  expire_count: number;
  expire_rate: number;
  version: number;
};

const getCacheInfo = (instance: CustomCache): CacheInfo => {
  const cache = instance.getCache();
  const size = instance.size();
  const alive_count = [...cache.values()].filter(
    (item) => item.expireAt,
  ).length;
  const expire_count = size - alive_count;
  return {
    size: size,
    alive_count: alive_count,
    expire_count: expire_count,
    expire_rate: Number((expire_count / size).toFixed(2)),
    version: instance.version,
  };
};

// 基础 Cache 类
class CustomCache {
  private v: number = 0;
  private cache: Map<string, CacheItem> = new Map();
  private cleanupInterval: NodeJS.Timeout;
  private cleanupTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private persistenceInterval: NodeJS.Timeout;

  private enablePersistence = true;

  private readonly logger = createLogger('CustomCache');

  constructor() {
    this.load();
    this.persist();
    // 每30分钟进行一次全局清理（兜底机制）
    this.cleanupInterval = setInterval(
      () => this.globalCleanup(),
      TimeUnitUtil.toMS('30m'),
    );
    const interval = TimeUnitUtil.toMS('1h');
    this.persistenceInterval = setInterval(() => {
      void this.persist();
    }, interval);
  }

  get version(): number {
    return this.v;
  }

  set version(value: number) {
    this.v = value;
  }

  getCache(): Readonly<Map<string, CacheItem>> {
    return new Map(this.cache);
  }

  private load(): void {
    if (!this.enablePersistence) return;
    if (!fs.existsSync(cachePath)) return;

    try {
      const raw = JSON.parse(fs.readFileSync(cachePath, 'utf8'));

      if (raw.version) {
        this.version = raw.version;
      }
      const loadItems = () => {
        if (raw.items && typeof raw.items === 'object') {
          return raw.items;
        }
        return {};
      };
      const items = loadItems();

      const now = Date.now();
      let loaded = 0;
      let expired = 0;

      for (const key of Object.keys(items)) {
        const item = items[key];
        if (!item) continue;

        const { value, createAt, expireAt } = item;

        // 过滤已过期
        if (expireAt && now > expireAt) {
          expired++;
          continue;
        }

        // 调用 set() 恢复定时器与 TTL
        const ttl = expireAt ? expireAt - now : null;

        this.set(key, value, ttl);
        loaded++;
      }

      this.logger.info(
        `缓存加载完成: 加载 ${loaded} 项, 丢弃过期 ${expired} 项`,
      );
    } catch (err) {
      this.logger.error('缓存加载失败，忽略现有数据:', err);
    }
  }

  /**
   * 持久化
   */
  public persist(): void {
    if (!this.enablePersistence) return;
    const data = {
      version: this.version,
      items: Object.fromEntries(this.cache.entries()),
    };

    try {
      fs.writeFileSync(cachePath, JSON.stringify(data, null, 2), {
        encoding: 'utf8',
      });
      this.logger.debug('缓存持久化成功');
    } catch (err) {
      this.logger.error('缓存持久化失败', err);
      throw err;
    }

    this.version += 1; // 更新版本号
  }

  /**
   * 深度合并对象
   */
  private deepMerge<T extends Record<string, any>>(target: T, source: any): T {
    const result = { ...target };

    for (const key in source) {
      // 如果目标对象中不存在该键，则直接添加
      // Object.prototype.hasOwnProperty.call(source, key)
      if (Object.hasOwn(source, key)) {
        const targetValue = target[key];
        const sourceValue = source[key];

        // 如果两个值都是对象，则递归合并
        if (
          targetValue &&
          sourceValue &&
          this.isPlainObject(targetValue) &&
          this.isPlainObject(sourceValue)
        ) {
          // @ts-ignore
          result[key] = this.deepMerge(targetValue, sourceValue);
        } else {
          // @ts-ignore
          result[key] = sourceValue;
        }
      }
    }

    return result;
  }

  /**
   * 浅合并对象
   */
  private shallowMerge<T extends Record<string, any>>(
    target: T,
    source: any,
  ): T {
    return { ...target, ...source };
  }

  /**
   * 判断是否是普通对象
   */
  private isPlainObject(value: any): boolean {
    return (
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      !(value instanceof Date) &&
      !(value instanceof RegExp) &&
      !(value instanceof Map) &&
      !(value instanceof Set) &&
      !(value instanceof Buffer)
    );
  }

  /**
   * 处理水合逻辑
   */
  private handleHydrate<T>(
    currentValue: any,
    newValue: T,
    hydrateMode: 'shallow' | 'deep',
  ): T {
    // 只有当两个值都是普通对象时才进行合并
    if (this.isPlainObject(currentValue) && this.isPlainObject(newValue)) {
      if (hydrateMode === 'deep') {
        return this.deepMerge(currentValue, newValue) as T;
      } else {
        return this.shallowMerge(currentValue, newValue) as T;
      }
    }

    // 如果不是对象或者有一个不是对象，直接返回新值
    return newValue;
  }

  /**
   * 设置缓存值
   * @param key 缓存键
   * @param value 缓存值
   * @param ttl 过期时间（秒或时间单位字符串），0或null表示永不过期
   */
  public set<T>(
    key: string,
    value: T,
    ttl?: Nullable<number | TimeUnitString>,
  ): void {
    // 清除该键已有的定时器
    this.clearTimeout(key);

    const createAt = Date.now();
    const expireAt = this.calculateExpireAt(ttl);

    // 设置缓存项
    this.cache.set(key, { value, createAt, expireAt });

    // 如果设置了TTL，则创建定时清理任务
    if (expireAt !== null) {
      const ttlMs = expireAt - Date.now();
      if (ttlMs > 0) {
        const timeout = setTimeout(() => {
          this.cache.delete(key);
          this.cleanupTimeouts.delete(key);
        }, ttlMs);

        this.cleanupTimeouts.set(key, timeout);

        // 设置定时器最大限制（防止内存泄漏）
        const maxTTLRecommended = TimeUnitUtil.toMS('1d');
        if (ttlMs > maxTTLRecommended && !key.startsWith('AUTH::')) {
          // 超过24小时
          this.logger.warn(
            `Cache key "${key}" has a very long TTL (${ttlMs}ms). Consider using shorter TTL.`,
          );
        }
      }
    }
  }

  /**
   * 获取缓存值
   */
  public get<T = any>(key: string): T | null {
    const item = this.cache.get(key);

    if (!item) return null;

    // 检查是否过期
    if (item.expireAt && Date.now() > item.expireAt) {
      this.delete(key);
      return null;
    }

    return item.value as T;
  }

  /**
   * 更新缓存值
   * @param key 缓存键
   * @param value 新的缓存值
   * @param options 更新选项
   */
  public update<T>(key: string, value: T, options?: UpdateOptions): boolean {
    const item = this.cache.get(key);

    if (!item) {
      // 键不存在时的处理
      const createIfNotExists = options?.createIfNotExists ?? true;
      if (createIfNotExists) {
        const ttl = options?.createWithTTL;
        this.set(key, value, ttl);
        return true;
      }
      return false;
    }

    // 处理TTL更新
    let newExpireAt: number | null = item.expireAt;

    if (options?.renewTTL !== undefined) {
      if (options.renewTTL === true) {
        // 使用原有TTL重新计时
        if (item.expireAt) {
          const originalTTL = item.expireAt - Date.now();
          if (originalTTL > 0) {
            newExpireAt = Date.now() + originalTTL;
          } else {
            // 已过期，不清除TTL（维持原状）
            newExpireAt = item.expireAt;
          }
        }
      } else if (
        typeof options.renewTTL === 'number' ||
        typeof options.renewTTL === 'string'
      ) {
        // 使用新的TTL
        newExpireAt = this.calculateExpireAt(options.renewTTL);
      } else if (options.renewTTL === false) {
        // 明确指定不更新TTL，保持原状
        newExpireAt = item.expireAt;
      }
    }

    // 处理水合逻辑
    let finalValue: T = value;
    const shouldHydrate = options?.hydrate ?? false;
    const hydrateMode = options?.hydrateMode ?? 'shallow';

    if (shouldHydrate) {
      finalValue = this.handleHydrate(item.value, value, hydrateMode);
    }

    // 清除旧的定时器（如果TTL有变化）
    if (newExpireAt !== item.expireAt) {
      this.clearTimeout(key);

      // 如果设置了新的过期时间，创建新的定时器
      if (newExpireAt !== null) {
        const ttlMs = newExpireAt - Date.now();
        if (ttlMs > 0) {
          const timeout = setTimeout(() => {
            this.cache.delete(key);
            this.cleanupTimeouts.delete(key);
          }, ttlMs);

          this.cleanupTimeouts.set(key, timeout);
        }
      }
    }

    // 更新缓存值
    this.cache.set(key, {
      value: finalValue,
      createAt: item.createAt,
      expireAt: newExpireAt,
    });

    if (
      shouldHydrate &&
      this.isPlainObject(item.value) &&
      this.isPlainObject(value)
    ) {
      this.logger.debug(
        `Cache key "${key}" hydrated with mode: ${hydrateMode}`,
      );
    }

    return true;
  }

  /**
   * 检查键是否存在且未过期
   */
  public has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * 删除缓存项
   */
  public delete(key: string): boolean {
    this.clearTimeout(key);
    return this.cache.delete(key);
  }

  /**
   * 清空所有缓存
   */
  public clear(): void {
    // 清除所有定时器
    for (const timeout of this.cleanupTimeouts.values()) {
      clearTimeout(timeout);
    }
    this.cleanupTimeouts.clear();
    this.cache.clear();
    this.logger.debug('Cache cleared');
  }

  /**
   * 获取缓存大小
   */
  public size(): number {
    return this.cache.size;
  }

  /**
   * 获取所有键名
   */
  public keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * 获取剩余过期时间（毫秒）
   * @returns 剩余毫秒数，null表示永不过期，-1表示不存在或已过期
   */
  public getTTL(key: string): number | null {
    const item = this.cache.get(key);

    if (!item) return -1;

    if (item.expireAt === null) return null;

    const remaining = item.expireAt - Date.now();
    return remaining > 0 ? remaining : -1;
  }

  /**
   * 销毁缓存实例
   */
  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
    this.logger.info('Cache instance destroyed');
  }

  /**
   * 计算过期时间戳
   */
  private calculateExpireAt(
    ttl?: Nullable<number | TimeUnitString>,
  ): number | null {
    if (ttl === null || ttl === undefined) {
      return null; // 永不过期
    }

    // 0 也表示永不过期
    if (ttl === 0) {
      return null;
    }

    let ttlMs: number;
    if (typeof ttl === 'string') {
      ttlMs = TimeUnitUtil.toMS(ttl);
    } else {
      ttlMs = ttl;
    }

    return Date.now() + ttlMs;
  }

  /**
   * 清除指定键的定时器
   */
  private clearTimeout(key: string): void {
    const timeout = this.cleanupTimeouts.get(key);
    if (timeout) {
      clearTimeout(timeout);
      this.cleanupTimeouts.delete(key);
    }
  }

  /**
   * 全局清理（兜底机制）
   */
  private globalCleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];
    const totalKeys = this.cache.size;

    for (const [key, item] of this.cache.entries()) {
      if (item.expireAt && now > item.expireAt) {
        expiredKeys.push(key);
      }
    }

    // 删除所有过期的键
    expiredKeys.forEach((key) => {
      this.delete(key);
    });

    if (expiredKeys.length > 0) {
      this.logger.debug(
        `Global cleanup: ${expiredKeys.length}/${totalKeys} expired items removed`,
        {
          removedKeys: expiredKeys.slice(0, 10), // 只显示前10个
          totalKeys,
        },
      );
    }
  }
}

const cachePath = path.resolve(AppConfig.Process.ROOT, 'cache.json');
// 导出单例实例
const cache = createTypedCache();
export default cache;
