// getter-setter.decorator.ts

// Getter 装饰器
export function Getter(target: any, propertyKey: string) {
  const getterName = `get${capitalizeFirstLetter(propertyKey)}`;
  
  // 检查是否已存在 getter 方法
  if (!target[getterName]) {
    Object.defineProperty(target, getterName, {
      value: function() {
        return this[propertyKey];
      },
      writable: false,
      enumerable: false,
      configurable: true
    });
  }
}

// Setter 装饰器
export function Setter(target: any, propertyKey: string) {
  const setterName = `set${capitalizeFirstLetter(propertyKey)}`;
  
  // 检查是否已存在 setter 方法
  if (!target[setterName]) {
    Object.defineProperty(target, setterName, {
      value: function(value: any) {
        this[propertyKey] = value;
        return this; // 支持链式调用
      },
      writable: false,
      enumerable: false,
      configurable: true
    });
  }
}

// 同时生成 getter 和 setter
export function GetterSetter(target: any, propertyKey: string) {
  Getter(target, propertyKey);
  Setter(target, propertyKey);
}

// 首字母大写辅助函数
function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}