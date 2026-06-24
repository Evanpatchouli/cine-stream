import { Types } from 'mongoose';

export const toString = (value: any): string => {
  if (value === undefined || value === null) {
    return '';
  }
  return value.toString();
};

export const v2String = ({ value }: { value: any }): string => {
  return toString(value);
};

export const toNumber = (value: any): number => {
  if (value === undefined || value === null) {
    return 0;
  }
  return Number(value);
};

export const v2Number = ({ value }: { value: any }): number => {
  return toNumber(value);
};

export const toBoolean = (value: any): boolean => {
  if (value === undefined || value === null) {
    return false;
  }
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }
  if (typeof value === 'number') {
    return value === 1;
  }
  return Boolean(value);
};

export const v2Boolean = ({ value }: { value: any }): boolean => {
  return toBoolean(value);
};

/**
 * @param value 不少于24字符
 */
export const toObjectId = (value: any): Types.ObjectId => {
  if (['string', 'number'].includes(typeof value)) {
    return Types.ObjectId.createFromHexString(value.toString());
  }
  return value;
};

export const v2ObjectId = ({ value }: { value: any }): Types.ObjectId => {
  return toObjectId(value);
};

export const toObject = (value: any): object => {
  if (value === undefined || value === null) {
    return {};
  }
  return value;
};

export const v2Object = ({ value }: { value: any }): object => {
  return toObject(value);
};

export const toArray = (value: any): Array<unknown> => {
  if (value === undefined || value === null) {
    return [];
  }
  return value;
};

export const v2Array = ({ value }: { value: any }): Array<unknown> => {
  return toArray(value);
};

export const toEnum = (value: any, enumType: any) => {
  if (value === undefined || value === null) {
    return enumType[0];
  }
  return enumType[value];
};

export const v2Enum = ({
  value,
  enumType,
}: {
  value: any;
  enumType: any;
}): any => {
  return toEnum(value, enumType);
};

export const toDateTime = (value: any) => {
  if (value === undefined || value === null) {
    return new Date();
  }
  return new Date(value);
};

export const v2DateTime = ({ value }: { value: any }): Date => {
  return toDateTime(value);
};

export const toDateString = (value: any) => {
  if (value === undefined || value === null) {
    return new Date().toDateString();
  }
  return new Date(value).toDateString();
};

export const v2DateString = ({ value }: { value: any }): string => {
  return toDateString(value);
};

export const toTime = (value: any) => {
  if (value === undefined || value === null) {
    return new Date().toLocaleTimeString();
  }
  return new Date(value).toLocaleTimeString();
};

export const v2Time = ({ value }: { value: any }): string => {
  return toTime(value);
};

export const toTimestamp = (value: any) => {
  if (value === undefined || value === null) {
    return new Date().getTime();
  }
  return new Date(value).getTime();
};

export const v2Timestamp = ({ value }: { value: any }): number => {
  return toTimestamp(value);
};

export const toUppercase = (value: any) => {
  if (value === undefined || value === null) {
    return '';
  }
  return value.toUpperCase();
};

export const v2Uppercase = ({ value }: { value: any }): string => {
  return toUppercase(value);
};

export const toLowercase = (value: any) => {
  if (value === undefined || value === null) {
    return '';
  }
  return value.toLowerCase();
};

export const v2Lowercase = ({ value }: { value: any }): string => {
  return toLowercase(value);
};
