interface TodoInfo {
  [key: string]: any;
  type?: TodoType;
  level?: TodoLevel;
  description?: string;
  dueDate?: Date;
  alias?: any;
}

type TodoLevel = (string & {}) | 'LOW' | 'MEDIUM' | 'HIGH' | 'L' | 'M' | 'H';

type TodoType =
  | (string & {})
  | 'FEAT'
  | 'REFACTOR'
  | 'FIX'
  | 'DOCS'
  | 'STYLE'
  | 'TEST'
  | 'CHORE'
  | 'PERF'
  | 'BUILD'
  | 'CI'
  | 'IMPROVE'
  | 'SECURITY'
  | 'UPDATE'
  | 'DEPRECATED'
  | 'BREAKING-CHANGE';

/**
 * ### TODO：未竟之事
 *
 * - 如果不想看到警告，就传入第二个参数 `dontpass`，如 `@Todo('FEAT', "off")`
 */
export function Todo(
  type: TodoType | TodoInfo = '',
  dontpass: 'off' | 'no' | 'ignore' | false | 0,
): any {
  return (...args: any[]) => {
    // 如果是方法装饰器，返回原始 descriptor
    if (args.length === 3 && typeof args[2] !== 'number') {
      return args[2];
    }
  };
}
