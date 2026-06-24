import { Transform, TransformFnParams } from 'class-transformer';

// 布尔值转换
export function ToBoolean(defaultValue: boolean = false): PropertyDecorator {
  return Transform(({ value }: TransformFnParams) => {
    if (value === undefined || value === null) return defaultValue;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const lower = value.toLowerCase().trim();
      if (['true', '1', 'yes', 'on'].includes(lower)) return true;
      if (['false', '0', 'no', 'off'].includes(lower)) return false;
    }
    return Boolean(value);
  });
}

// 数字转换
export function ToNumber(defaultValue: number = 0): PropertyDecorator {
  return Transform(({ value }: TransformFnParams) => {
    if (value === undefined || value === null) return defaultValue;
    const num = Number(value);
    return isNaN(num) ? defaultValue : num;
  });
}

// 数组转换
export function ToArray(separator: string = ','): PropertyDecorator {
  return Transform(({ value }: TransformFnParams) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      return value.split(separator).map(item => item.trim());
    }
    return [value];
  });
}

// 日期转换
export function ToDate(): PropertyDecorator {
  return Transform(({ value }: TransformFnParams) => {
    if (!value) return null;
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  });
}

// 通用转换装饰器
export function TransformValue(
  transformFn: (value: any, obj: any) => any,
): PropertyDecorator {
  return Transform((params: TransformFnParams) => {
    return transformFn(params.value, params.obj);
  });
}