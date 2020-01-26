import {ConfigClassFactory, ToJSONOptions} from './ConfigClassFactory';


export interface SubClassOptions extends ToJSONOptions {
  attachDescription?: boolean;
  attachDefaults?: boolean;
  enumsAsString?: boolean;
}

export function SubConfigClass(options?: SubClassOptions): any {
  return (constructorFunction: new (...args: any[]) => any) => {
    return class SubConfigClass extends ConfigClassFactory(constructorFunction, options) {
    };
  };
}
