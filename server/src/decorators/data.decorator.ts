export function Data<T extends { new (...args: any[]): object }>(constructor: T) {
  return class extends constructor {
    constructor(...args: any[]) {
      super(...args);

      // 遍历所有属性
      const properties = Object.getOwnPropertyNames(this);

      for (const property of properties) {
        // 跳过方法和以 _ 开头的私有属性
        if (
          typeof (this as any)[property] === 'function' ||
          property.startsWith('_')
        ) {
          continue;
        }

        const capitalized =
          property.charAt(0).toUpperCase() + property.slice(1);
        const getterName = `get${capitalized}`;
        const setterName = `set${capitalized}`;

        // 添加 getter
        if (!(this as any)[getterName]) {
          Object.defineProperty(this, getterName, {
            value: function () {
              return (this)[property];
            },
            writable: false,
            enumerable: false,
            configurable: true,
          });
        }

        // 添加 setter
        if (!(this as any)[setterName]) {
          Object.defineProperty(this, setterName, {
            value: function (value: any) {
              (this)[property] = value;
              return this;
            },
            writable: false,
            enumerable: false,
            configurable: true,
          });
        }
      }
    }
  };
}
