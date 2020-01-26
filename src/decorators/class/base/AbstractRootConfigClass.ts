import {ConstraintError} from '../../exceptions/ConstraintError';
import {SubClassOptions} from '../SubConfigClass';
import {ConfigClassBase} from './ConfigClassBase';


export interface ConfigClassOptionsBase extends SubClassOptions {
  attachDescription?: boolean;
  attachDefaults?: boolean;
  configPath?: string;
  saveIfNotExist?: boolean;
  rewriteCLIConfig?: boolean;
  rewriteENVConfig?: boolean;
  enumsAsString?: boolean;
}


export function AbstractRootConfigClass(constructorFunction: new (...args: any[]) => any, options: ConfigClassOptionsBase = {}) {
  return class RootConfigClass extends ConfigClassBase(constructorFunction, options) {
    constructor(...args: any[]) {
      super(...args);

      this.__setParentConfig('', this);
      const exceptionStack: string[] = [];
      this.__rootConfig.__validateAll(exceptionStack);
      if (exceptionStack.length > 0) {
        throw new ConstraintError(exceptionStack.join(', '));
      }

    }
  };
}
