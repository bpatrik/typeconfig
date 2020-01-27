import {IConfigClassBase, IConfigClassPrivateBase} from './base/IConfigClassBase';

export interface IConfigClassPrivate extends IConfigClassPrivateBase, IConfigClass {
  __printMan(): string;
}


export interface IConfigClass extends IConfigClassBase {
  load(): Promise<any>;

  save(): Promise<any>;
}
