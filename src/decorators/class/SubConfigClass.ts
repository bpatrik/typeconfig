import {ConfigClassBase} from './base/ConfigClassBase';
import {SubClassOptions} from './SubClassOptions';


export function SubConfigClass(options: SubClassOptions = {}): any {
  return (constructorFunction: new (...args: any[]) => any) => {
    return class SubConfigClassType extends ConfigClassBase(constructorFunction, options) {

    };
  };
}
