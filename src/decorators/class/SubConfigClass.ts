import {ConfigClassFactory} from './ConfigClassFactory';
import {ToJSONOptions} from './RootConfigClassFactory';


export interface SubClassOptions extends ToJSONOptions {
  attachDescription?: boolean;
  attachDefaults?: boolean;
}

export function SubConfigClass(options?: SubClassOptions): any {
  return (constructorFunction: new (...args: any[]) => any) => {
    return class SubConfigClass extends ConfigClassFactory(constructorFunction, options) {
    };
  };
}
