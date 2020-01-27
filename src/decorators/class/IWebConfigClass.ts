import {IConfigClassBase, IConfigClassPrivateBase} from './base/IConfigClassBase';

export interface IWebConfigClassPrivate extends IConfigClassPrivateBase, IWebConfigClass {
}


export interface IWebConfigClass extends IConfigClassBase {
  load(configJson?: any): void;
}
