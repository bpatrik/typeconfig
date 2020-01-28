import {IPropertyMetadata, propertyTypes} from '../../property/IPropertyState';
import {SubClassOptions} from '../SubConfigClass';


export interface ToJSONOptions {
  attachDescription?: boolean;
  attachDefaults?: boolean;
  enumsAsString?: boolean;
}

export interface IConfigClassBase {

  toJSON(opt?: ToJSONOptions): { [key: string]: any };

  toStateString(): string;

  toStateStringWithDefaults(): string;


}

export interface IConfigClassPrivateBase extends IConfigClassBase {
  __state: { [key: string]: IPropertyMetadata<any, any> };
  __defaults: { [key: string]: any };
  __values: { [key: string]: any };
  __rootConfig: IConfigClassPrivateBase;
  __propPath: string;
  __options: SubClassOptions;

  toJSON(opt?: ToJSONOptions): { [key: string]: any };

  toStateString(): string;

  toStateStringWithDefaults(): string;

  __getENVAliases(): { key: string, alias: string }[];

  __setParentConfig(propertyPath: string, rootConf: IConfigClassPrivateBase): void;

  __validateAll(exceptionStack?: string[]): void;

  __setAndValidateFromRoot<T>(property: string, newValue: T): void;

  __validate<T>(property: string, newValue: T, _type?: propertyTypes, exceptionStack?: string[]): any;

  __validateConstrains<T>(property: string, newValue: T, exceptionStack?: string[]): void;

  __validateType<T>(property: string, newValue: T, _type?: propertyTypes): any;


  __getFulName(property: string, separator?: string): string;

  __getLongestOptionName(printENVAlias: boolean): number;

  ___printOption(prefix: string, printENVAlias: boolean, longestName?: number): string;


}
