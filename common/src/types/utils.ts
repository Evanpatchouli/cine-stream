export type NonNull<T> = T extends null ? never : T;
export type Nullable<T> = T | null;
export type Maybe<T> = T | null | undefined;

export type NullableArray<T> = T[] | null;
export type MaybeArray<T> = T[] | null | undefined;

export type NullableString = string | null;
export type MaybeString = string | null | undefined;

export type NullableNumber = number | null;
export type MaybeNumber = number | null | undefined;

export type NullableBoolean = boolean | null;
export type MaybeBoolean = boolean | null | undefined;

export type NullableObject<T> = T | null;
export type MaybeObject<T> = T | null | undefined;

export type NullableFunction<T> = T | null;
export type MaybeFunction<T> = T | null | undefined;

export type Hintable<S> = S | (string & {});

export type HintableArray<S> = S[] | (string & {})[];

export type HintableObject<S, V = any> = S & { [key: string]: V };

export type ValuesOf<T> = T[keyof T];

export type KeysOf<T> = Extract<keyof T, string>;

export type ValuesOfUnion<T> = T extends (infer U)[] ? U : never;

export type ValuesOfIntersection<T> = T extends infer U & infer V
  ? U & V
  : never;

export type ValuesOfTuple<T> = T extends (infer U)[] ? U : never;

export type ValuesOfObject<T> = T extends infer U & {} ? U : never;

export type ValuesOfRecord<T> = T extends infer U & Record<string, any>
  ? U
  : never;

export type ValuesOfMap<T> = T extends Map<infer K, infer V> ? V : never;

export type ValuesOfSet<T> = T extends Set<infer U> ? U : never;

export type ValuesOfPromise<T> = T extends Promise<infer U> ? U : never;

export type ValuesOfFunction<T> = T extends (...args: any[]) => infer U
  ? U
  : never;

export type ValuesOfClass<T> = T extends new (...args: any[]) => infer U
  ? U
  : never;

export type RecordOf<T, V> = { [K in keyof T]: V };

export type StringRecord = Record<string, string>;

export type NumberRecord = Record<string, number>;

export type BooleanRecord = Record<string, boolean>;

export type ObjectRecord = Record<string, object>;

export type FunctionRecord = Record<string, Function>;

// 基础类类型
export type Class<T = any, Args extends any[] = any[]> = new (
  ...args: Args
) => T;

// 抽象类类型
export type AbstractClass<T = any, Args extends any[] = any[]> = abstract new (
  ...args: Args
) => T;

// 类或抽象类
export type AnyClass<T = any> = Class<T> | AbstractClass<T>;

// 类记录（字符串映射到类）
export type ClassRecord<T = any> = Record<string, AnyClass<T>>;

// 类实例记录
export type InstanceRecord<T = any> = Record<string, T>;

// 带配置的类记录
export interface ClassWithConfig<T = any> {
  class: AnyClass<T>;
  config?: {
    singleton?: boolean;
    scope?: 'REQUEST' | 'TRANSIENT' | 'DEFAULT';
    dependencies?: AnyClass[];
  };
}

export type ClassConfigRecord = Record<string, ClassWithConfig>;

// 用于 NestJS 提供者的类型
export type ProviderClass = Class<any>;

export type ProviderRecord = Record<string, ProviderClass>;

// 动态模块注册
export interface ModuleClass<T = any> {
  new(...args: any[]): T;
  $inject?: string[];
}

export type ModuleRecord = Record<string, ModuleClass>;

export type AsyncReturnType<T extends (...args: any[]) => Promise<any>> = ReturnType<T> extends Promise<infer U> ? U : ReturnType<T>;

type Unit =
  | 'Years'
  | 'Year'
  | 'Yrs'
  | 'Yr'
  | 'Y'
  | 'Weeks'
  | 'Week'
  | 'W'
  | 'Days'
  | 'Day'
  | 'D'
  | 'Hours'
  | 'Hour'
  | 'Hrs'
  | 'Hr'
  | 'H'
  | 'Minutes'
  | 'Minute'
  | 'Mins'
  | 'Min'
  | 'M'
  | 'Seconds'
  | 'Second'
  | 'Secs'
  | 'Sec'
  | 's'
  | 'Milliseconds'
  | 'Millisecond'
  | 'Msecs'
  | 'Msec'
  | 'Ms';

export type TimeUnitAnyCase = Unit | Uppercase<Unit> | Lowercase<Unit>;

export type TimeUnitString =
  | `${number}`
  | `${number}${TimeUnitAnyCase}`
  | `${number} ${TimeUnitAnyCase}`;

export type TimeUnit = number | TimeUnitString;
