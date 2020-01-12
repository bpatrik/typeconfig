import {ToJSONOptions} from './RootConfigClassFactory';


export interface IConfigClass {
  toJSON(opt?: ToJSONOptions): { [key: string]: any };

  ___printMan(): string;
  __validateAll(exceptionStack?: string[]): void;

}
