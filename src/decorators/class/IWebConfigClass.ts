import {IConfigClassBase, IConfigClassPrivateBase} from './base/IConfigClassBase.js';

export interface IWebConfigClassPrivate<TAGS> extends IConfigClassPrivateBase<TAGS>, IWebConfigClass<TAGS> {
}


export interface IWebConfigClass<TAGS = { [key: string]: any }> extends IConfigClassBase<TAGS> {
  /**
   * Loads config from JSON and from Url Params
   * It disregards {__defaults}
   * @param configJson
   */
  load(configJson?: any): void;

  /**
   * Resets the config to the state of a newly created instance (the defaults of the class definition).
   * Loaded values are dropped, readonly flags are cleared.
   * Sub config objects are kept, dynamically added properties are removed.
   */
  resetToDefaults(): void;

}
