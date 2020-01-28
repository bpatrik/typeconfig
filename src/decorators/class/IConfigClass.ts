import {IConfigClassBase, IConfigClassPrivateBase} from './base/IConfigClassBase';
import {ConfigClassOptionsBase} from './base/AbstractRootConfigClass';


export interface ConfigCLIOptions {
  attachDescription?: boolean;
  attachDefaults?: boolean;
  configPath?: boolean;
  saveIfNotExist?: boolean;
  rewriteCLIConfig?: boolean;
  rewriteENVConfig?: boolean;
  enumsAsString?: boolean;
  exitOnConfig?: boolean;
}

export interface ConfigClassOptions extends ConfigClassOptionsBase {
  attachDescription?: boolean;
  attachDefaults?: boolean;
  configPath?: string;
  saveIfNotExist?: boolean;
  rewriteCLIConfig?: boolean;
  rewriteENVConfig?: boolean;
  enumsAsString?: boolean;
  disableMan?: boolean;
  exitOnConfig?: boolean;

  cli?: {
    prefix?: string,
    enable?: ConfigCLIOptions,
    defaults?: {
      /**
       * Prefixes the default value overwrites
       */
      prefix?: string,
      /**
       * Enables overwriting the default values
       */
      enabled?: boolean
    }
  };
}

export interface IConfigClassPrivate extends IConfigClassPrivateBase, IConfigClass {
  __printMan(): string;
}


export interface IConfigClass extends IConfigClassBase {
  loadSync(): void;

  load(): Promise<any>;

  save(): Promise<any>;

  saveSync(): void;
}
