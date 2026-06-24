export function Deprecated(text?: string): any {
  return (...args: any[]) => {
    // 如果是方法装饰器，返回原始 descriptor
    if (args.length === 3 && typeof args[2] !== 'number') {
      return args[2];
    }
  };
}
