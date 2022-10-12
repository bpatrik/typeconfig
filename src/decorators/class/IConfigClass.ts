import {IConfigClassBase, IConfigClassPrivateBase} from './base/IConfigClassBase';
import {ConfigClassOptionsBase} from './base/AbstractRootConfigClass';
import * as fs from 'fs';
import {promises as fsp} from 'fs';


export interface ConfigCLIOptions {
  attachDescription?: boolean;
  attachState?: boolean;
  configPath?: boolean;
  saveIfNotExist?: boolean;
  rewriteCLIConfig?: boolean;
  rewriteENVConfig?: boolean;
  enumsAsString?: boolean;
  exitOnConfig?: boolean;
}

export interface ConfigClassOptions extends ConfigClassOptionsBase {
  attachDescription?: boolean;
  configPath?: string;
  saveIfNotExist?: boolean;
  rewriteCLIConfig?: boolean;
  rewriteENVConfig?: boolean;
  enumsAsString?: boolean;
  attachState?: boolean;
  disableMan?: boolean;
  exitOnConfig?: boolean;
  /**
   * If a property is set through cli or env variable, it becomes readonly
   */
  disableAutoReadonly?: boolean;
  /**
   * tracks readonly property, but do not uses it for validation
   */
  softReadonly?: boolean;

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

  fs?: typeof fs;
  fsPromise?: typeof fsp;
}

export interface IConfigClassPrivate extends IConfigClassPrivateBase, IConfigClass {
  __printMan(): string;
}


export interface IConfigClass extends IConfigClassBase {
  /**
   * Loads the config from file, cli and ENV synchronously. Does not reinit the object from class
   */
  loadSync(): void;

  /**
   * Loads the config from file, cli and ENV asynchronously. Does not reinit the object from class
   */
  load(): Promise<any>;

  save(): Promise<any>;

  saveSync(): void;
}
