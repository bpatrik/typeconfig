import {IPropertyState, propertyTypes} from '../../property/IPropertyState';


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
  __state: { [key: string]: IPropertyState<any, any> };
  __defaults: { [key: string]: any };
  __rootConfig: IConfigClassPrivateBase;
  __propPath: string;

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

  __getLongestSwitchName(): number;

  ___printSwitches(longestName?: number): string;


}
