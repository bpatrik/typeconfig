import {IConfigClassBase, IConfigClassPrivateBase} from './base/IConfigClassBase';
import {ConfigClassOptionsBase} from './base/AbstractRootConfigClass';
import * as fs from 'fs';
import {promises as fsp} from 'fs';
import * as path from 'path';


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

export interface ConfigClassOptions<C, TAGS = { [key: string]: any }> extends ConfigClassOptionsBase<TAGS> {
  attachDescription?: boolean;
  configPath?: string;
  crateConfigPathIfNotExists?: boolean;
  saveIfNotExist?: boolean;
  rewriteCLIConfig?: boolean;
  rewriteENVConfig?: boolean;
  enumsAsString?: boolean;
  skipDefaultValues?: boolean;
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

  path?: typeof path;
  fs?: typeof fs;
  fsPromise?: typeof fsp;

  /**
   * Runs this function after async loading the config
   */
  onLoaded?: (config: C) => Promise<void>;

  /**
   * Runs after async or sync loading the config
   * It only runs after async loading if async onLoaded is not present
   */
  onLoadedSync?: (config: C) => void;
}

export interface IConfigClassPrivate<TAGS> extends IConfigClassPrivateBase<TAGS>, IConfigClass<TAGS> {
  __printMan(): string;
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
