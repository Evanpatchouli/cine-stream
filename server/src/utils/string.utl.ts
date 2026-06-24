import { Maybe } from '@cine-stream/common';

export const isEmpty = (str: string) => {
  if (typeof str !== 'string') {
    throw new Error('The argument must be a string');
  }
  return str.trim().length === 0;
};

export const isBlank = (str?: Maybe<string>) => {
  switch (typeof str) {
    case 'string':
      return str.trim().length === 0;
    case 'undefined':
      return true;
    case 'object':
      if (str === null) {
        return true;
      } else {
        throw new Error('The argument must be a string');
      }
    default:
      throw new Error('The argument must be a string');
  }
};
