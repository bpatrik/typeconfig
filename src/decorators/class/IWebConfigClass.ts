import {IConfigClassBase, IConfigClassPrivateBase} from './base/IConfigClassBase';

export interface IWebConfigClassPrivate<TAGS> extends IConfigClassPrivateBase<TAGS>, IWebConfigClass<TAGS> {
}


export interface IWebConfigClass<TAGS = string> extends IConfigClassBase<TAGS> {
  load(configJson?: any): void;
}
