import {ToJSONOptions} from './ConfigClassFactory';

export interface IConfigClass {

  toJSON(opt?: ToJSONOptions): { [key: string]: any };

  toStateString(): string;

  toStateStringWithDefaults(): string;


}
