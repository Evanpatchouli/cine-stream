import { cloneDeep } from 'es-toolkit';

/**
 * 数据库实体转VO工具函数
 * @param data 要转换的数据（数组或对象）
 * @param options 配置选项
 * @returns 转换后的VO数据
 */
export const vofy = <T = any, R = any>(
  data: T,
  options?: {
    /** 是否转换蛇形到驼峰，默认true */
    snakeToCamel?: boolean;
    /** 要排除的字段，默认包含常见审计字段 */
    excludeFields?: string[];
    /** 是否排除默认的审计字段，默认true */
    excludeAuditFields?: boolean;
    /** 深度转换（递归处理嵌套对象），默认true */
    deep?: boolean;
    /** 自定义字段映射，key为原字段名，value为目标字段名 */
    fieldMapping?: Record<string, string>;
  },
): R => {
  const {
    snakeToCamel = true,
    excludeFields = [],
    excludeAuditFields = true,
    deep = true,
    fieldMapping = {},
  } = options || {};

  // 默认审计字段
  const defaultAuditFields = ['created_at', 'updated_at', 'deleted_at'];

  // 合并排除字段
  const allExcludeFields = [
    ...excludeFields,
    ...(excludeAuditFields ? defaultAuditFields : []),
  ];

  // 处理单个对象
  const processObject = (obj: any): any => {
    if (!obj || typeof obj !== 'object') return obj;

    const result: any = {};

    for (const [key, value] of Object.entries(obj)) {
      // 检查是否应该排除该字段
      if (allExcludeFields.includes(key)) {
        continue;
      }

      // 确定目标字段名
      let targetKey = key;

      // 应用自定义映射
      if (fieldMapping[key]) {
        targetKey = fieldMapping[key];
      }
      // 蛇形转驼峰
      else if (snakeToCamel) {
        targetKey = snakeToCamelCase(key);
      }

      // 处理值
      if (deep && value !== null && typeof value === 'object') {
        // 递归处理嵌套对象（包括数组）
        if (Array.isArray(value)) {
          result[targetKey] = value.map((item) =>
            typeof item === 'object' ? processObject(item) : item,
          );
        } else {
          result[targetKey] = processObject(value);
        }
      } else {
        result[targetKey] = value;
      }
    }

    return result;
  };

  // 蛇形转驼峰辅助函数
  const snakeToCamelCase = (str: string): string => {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  };

  // 处理输入数据
  if (data === null || data === undefined) {
    return data as any;
  }

  // 处理数组
  if (Array.isArray(data)) {
    return data.map((item) => processObject(item)) as any;
  }

  // 处理对象
  return processObject(data);
};

/**
 * @alias vofy
 */
export const vo = vofy;

/**
 * 驼峰转蛇形（如果需要逆向转换）
 */
export const camelToSnakeCase = (str: string): string => {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
};

/**
 * 创建自定义转换器，预设配置
 */
export const createVofy = (defaultOptions?: Parameters<typeof vofy>[1]) => {
  return <T = any, R = any>(data: T, options?: Parameters<typeof vofy>[1]) => {
    const mergedOptions = { ...defaultOptions, ...options };
    return vofy<T, R>(data, mergedOptions);
  };
};

// 预定义的一些常用转换器
export const vofyWithoutAudit = createVofy({ excludeAuditFields: true });
export const vofyWithAllFields = createVofy({ excludeAuditFields: false });
export const vofyNoCamel = createVofy({ snakeToCamel: false });

// 类型定义（可选）
export interface VofyOptions {
  snakeToCamel?: boolean;
  excludeFields?: string[];
  excludeAuditFields?: boolean;
  deep?: boolean;
  fieldMapping?: Record<string, string>;
}
