import {IConfigClassBase, IConfigClassPrivateBase} from './base/IConfigClassBase';

export interface IWebConfigClassPrivate<TAGS> extends IConfigClassPrivateBase<TAGS>, IWebConfigClass<TAGS> {
}


export interface IWebConfigClass<TAGS = { [key: string]: any }> extends IConfigClassBase<TAGS> {
  /**
   * Loads config from JSON and from Url Params
   * It disregards {__defaults}
   * @param configJson
   */
  load(configJson?: any): void;

}
