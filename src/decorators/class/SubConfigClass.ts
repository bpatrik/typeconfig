import {ConfigClassBase} from './base/ConfigClassBase';
import {SubClassOptions} from './SubClassOptions';


export function SubConfigClass<TAGS>(options: SubClassOptions<TAGS> = {}): any {
  return (constructorFunction: new (...args: any[]) => any) => {
    return class SubConfigClassType extends ConfigClassBase<TAGS>(constructorFunction, options) {
      __getNewInstance<T>(): T & SubConfigClassType {
        const ni = new SubConfigClassType();
        return ni as T & SubConfigClassType;
      }
    };
  };
}
