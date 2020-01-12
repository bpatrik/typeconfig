import {ToJSONOptions} from './ConfigClassFactory';

export interface IConfigClass {

  toJSON(opt?: ToJSONOptions): { [key: string]: any };

  ___printMan(): string;

}
