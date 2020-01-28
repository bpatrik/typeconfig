import {Enum} from './decorators/property/IPropertyState';

export class Utils {
  static isEnum(instance: Object): boolean {
    if (!instance) {
      return false;
    }
    const keys = Object.keys(instance);
    if (keys.length === 0) {
      return false;
    }
    for (const key of keys) {
      const value = (<Enum>instance)[key];
      switch (typeof value) {
        case 'number':
          if ((<Enum>instance)[value.toString()] !== key) {
            return false;
          }
          break;
        case 'string':
          if (typeof (<Enum>instance)[value] === 'undefined' || (<Enum>instance)[value].toString() !== key) {
            return false;
          }
          break;
        default:
          return false;
      }

    }


    return true;
  }

}
