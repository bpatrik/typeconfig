import {IConfigClass} from './IConfigClass';
import {ConfigClassFactory} from './ConfigClassFactory';
import {ConstraintError} from '../ConstraintError';
import {SubClassOptions} from './SubConfigClass';


export class ConfigClassMethods implements IConfigClass {
  __validateAll(): void {
  }

  toJSON(opt?: ToJSONOptions): { [key: string]: any } {
    return {};
  }

  load(): Promise<void> {
    return null;
  }

  save(): Promise<void> {
    return null;
  }

  ___printMan(): string {
    return '';
  }

}


export interface ConfigClassOptionsBase extends SubClassOptions {
  attachDescription?: boolean;
  attachDefaults?: boolean;
  configPath?: string;
  saveIfNotExist?: boolean;
  rewriteCLIConfig?: boolean;
  rewriteENVConfig?: boolean;
  envAlias?: string[][];
}


export interface ConfigCLIOptions extends ConfigClassOptionsBase {
  attachDescription?: boolean;
  attachDefaults?: boolean;
  configPath?: string;
  saveIfNotExist?: boolean;
  rewriteCLIConfig?: boolean;
  rewriteENVConfig?: boolean;
  envAlias?: string[][];
}

export interface ConfigClassOptions extends ConfigClassOptionsBase {
  attachDescription?: boolean;
  attachDefaults?: boolean;
  configPath?: string;
  saveIfNotExist?: boolean;
  rewriteCLIConfig?: boolean;
  rewriteENVConfig?: boolean;
  envAlias?: string[][];
  cli?: {
    prefix: string,
    enable: ConfigCLIOptions
  };
}


export interface ToJSONOptions {
  attachDescription?: boolean;
  attachDefaults?: boolean;
}

export function RootConfigClassFactory(constructorFunction: new (...args: any[]) => any, options: ConfigClassOptions = {}) {
  return class RootConfigClass extends ConfigClassFactory(constructorFunction, options) {
    constructor(...args: any[]) {
      super(...args);

      this.__setRootConfig(this);
      const exceptionStack: string[] = [];
      this.__rootConfig.__validateAll(exceptionStack);
      if (exceptionStack.length > 0) {
        throw new ConstraintError(exceptionStack.join(', '));
      }

    }
  };
}
