import { isEqual } from 'es-toolkit';
import { minimatch } from 'minimatch';

type FilterFn<T> = (item: T) => boolean;

type FilterFnWrapped<T> = (item: T) => FilterFn<T>;

export const Eq = function <T>(value: T): FilterFn<T> {
  return (item: T) => isEqual(item, value);
};

export const In =
  <T>(items: T[]) =>
  (value: T) =>
    items.some(Eq(value));

export const Not =
  <T>(item: T) =>
  (value: T) =>
    !isEqual(item, value);

export const And =
  <T>(...fns: FilterFn<T>[]) =>
  (item: T) =>
    fns.every((fn) => fn(item));

export const Or =
  <T>(...fns: FilterFn<T>[]) =>
  (item: T) =>
    fns.some((fn) => fn(item));

export const NotIn =
  <T>(items: T[]) =>
  (value: T) =>
    !items.some(Eq(value));

export const Match = function <T>(pattern: RegExp | RegExp[]): FilterFn<T> {
  if (Array.isArray(pattern)) {
    return (item: T) => pattern.some((p) => p.test(String(item)));
  } else {
    return (item: T) => pattern.test(String(item));
  }
};

export const MiniMatch = function <T extends string = string>(
  value: T | T[],
): FilterFn<T> {
  if (Array.isArray(value) && value.length > 0) {
    return (item: T) => value.some((v) => minimatch(item, v));
  } else if (typeof value === 'string') {
    return (item: T) => minimatch(item, value);
  } else {
    return (item: T) => false;
  }
};
