import {Enum} from './decorators/IPropertyState';

export class Utils {
  static isEnum(instance: Object): boolean {
    let keys = Object.keys(instance);
    if (keys.length === 0) {
      return false;
    }
    for (let key of keys) {
      let value = (<Enum<any>>instance)[key];
      switch (typeof value) {
        case 'number':
          if ((<Enum<any>>instance)[value.toString()] !== key) {
            return false;
          }
          break;
        case 'string':
          if (typeof (<Enum<any>>instance)[value] === 'undefined' || (<Enum<any>>instance)[value].toString() !== key) {
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
