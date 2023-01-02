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

export interface ConfigClassOptions<TAGS = { [key: string]: any }> extends ConfigClassOptionsBase<TAGS> {
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
   * tracks readonly property, but do not use it for validation
   */
  softReadonly?: boolean;
  /**
   Attaches the following tags to all properties
   */
  tags?: TAGS;
  /**
   Skips rendering (toJSON) properties with the following tags
   */
  skipTags?: TAGS;
  /**
   Keep properties with the following tags. If a tag is bot kept and skipped, it will be skipped.
   */
  keepTags?: TAGS;

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

export interface IConfigClassPrivate<TAGS> extends IConfigClassPrivateBase<TAGS>, IConfigClass<TAGS> {
  __printMan(): string;

  /**
   * Clones the Config
   */
  clone<T>(): T & IConfigClassPrivate<TAGS>;
}


export interface IConfigClass<TAGS = { [key: string]: any }> extends IConfigClassBase<TAGS> {
  /**
   * Loads the config from file, cli and ENV synchronously. Does not reinit the object from class
   * @param pathOverride - overrides the config path
   */
  loadSync(pathOverride?: string): void;

  /**
   * Loads the config from file, cli and ENV asynchronously. Does not reinit the object from class
   * @param pathOverride - overrides the config path
   */
  load(pathOverride?: string): Promise<any>;

  save(pathOverride?: string): Promise<any>;

  saveSync(pathOverride?: string): void;
}
