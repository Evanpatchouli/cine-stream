interface TagInfo {
  [key: string]: any;
  name?: string;
  value?: any;
  default?: any;
  required?: boolean;
  type?: any;
  description?: string;
  options?: any[];
  return?: any;
  quuery?: any;
  body?: any;
  path?: any;
  header?: any;
  params?: any;
  cookies?: any;
  files?: any;
  tags?: string[];
  summary?: string;
  deprecated?: boolean;
  todo?: string | boolean | string[];
  example?: any;
  see?: string;
  author?: string;
  version?: string | number;
  since?: string;
  status?: any;
  alias?: any;
}

type Text = (string & {}) | 'TODO' | 'EXAMPLE' | 'WARN';

export function Tag(text: Text | TagInfo = ''): any {
  return (...args: any[]) => {
    // 如果是方法装饰器，返回原始 descriptor
    if (args.length === 3 && typeof args[2] !== 'number') {
      return args[2];
    }
  };
}
