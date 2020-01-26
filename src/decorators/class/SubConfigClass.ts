import {ToJSONOptions} from './base/IConfigClassBase';
import {ConfigClassBase} from './base/ConfigClassBase';

export interface SubClassOptions extends ToJSONOptions {
  attachDescription?: boolean;
  attachDefaults?: boolean;
  enumsAsString?: boolean;
}

export function SubConfigClass(options?: SubClassOptions): any {
  return (constructorFunction: new (...args: any[]) => any) => {
    return class SubConfigClass extends ConfigClassBase(constructorFunction, options) {

    };
  };
}
