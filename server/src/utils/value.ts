// 核心函数
export const ifNullish = <T>(value: T | null | undefined, fallback: T): T => {
  return value ?? fallback;
};

export const ifFalsy = <T>(value: T, fallback: T): T => {
  return value || fallback;
};

// 特定默认值
export const orEmpty = <T>(value: T | null | undefined): T => {
  return value ?? ({} as T);
};

export const orEmptyArray = <T>(value: T[] | null | undefined): T[] => {
  return value ?? [];
};

export const orEmptyString = (value: string | null | undefined): string => {
  return value ?? '';
};

export const orBlank = (value: string | null | undefined): string => {
  return value ?? '';
};

export const orZero = (value: number | null | undefined): number => {
  return value ?? 0;
};

export const orFalse = (value: boolean | null | undefined): boolean => {
  return value ?? false;
};

export const orTrue = (value: boolean | null | undefined): boolean => {
  return value ?? true;
};

export const orNull = <T>(value: T | null | undefined): T | null => {
  return value ?? null;
};

// 函数工厂（更灵活）
export const withFallback = <T>(fallback: T) => {
  return (value: T | null | undefined): T => {
    return value ?? fallback;
  };
};

// 链式检查
export const firstNonNullish = <T>(...values: T[]): T => {
  for (const value of values) {
    if (value != null) {
      return value;
    }
  }
  throw new Error('All values are null or undefined');
};

export const firstTruthy = <T>(...values: T[]): T => {
  for (const value of values) {
    if (value) {
      return value;
    }
  }
  return values[values.length - 1];
};

/**
 * 严格类型的安全解包
 */
export const unwrapOr = <T>(value: T | undefined, fallback: T): T => {
  return value !== undefined ? value : fallback;
};

export const unwrapOrNull = <T>(value: T | undefined, fallback: T): T => {
  return value != null ? value : fallback;
};
