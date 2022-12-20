import {IPropertyMetadata, propertyTypes} from '../../property/IPropertyState';
import {SubClassOptions} from '../SubClassOptions';


export interface ToJSONOptions<TAGS extends { [key: string]: any }> {
  attachDescription?: boolean;
  attachState?: boolean;
  /**
   * Forces to attach volatile variables
   */
  attachVolatile?: boolean;
  enumsAsString?: boolean;
  /**
   Skips properties with the following tags. If a tag is bot kept and skipped, it will be skipped.
   */
  skipTags?: TAGS;
  /**
   Keep properties with the following tags. If a tag is bot kept and skipped, it will be skipped.
   */
  keepTags?: TAGS;
}

export interface IConfigClassBase<TAGS> {

  toJSON(opt?: ToJSONOptions<TAGS>): { [key: string]: any };

}

export interface IConfigClassPrivateBase<TAGS> extends IConfigClassBase<TAGS> {
  __state: { [key: string]: IPropertyMetadata<any, any, TAGS> };
  __defaults: { [key: string]: any };
  __rootConfig: IConfigClassPrivateBase<TAGS>;
  __propPath: string;
  __options: SubClassOptions<TAGS>;

  toJSON(opt?: ToJSONOptions<TAGS>): { [key: string]: any };

  __getENVAliases(): { key: string, alias: string }[];

  __setParentConfig(propertyPath: string, rootConf: IConfigClassPrivateBase<TAGS>): void;

  __validateAll(exceptionStack?: string[]): void;

  __setAndValidateFromRoot<T>(property: string, newValue: T): void;

  __validate<T>(property: string, newValue: T, _type?: propertyTypes, exceptionStack?: string[]): any;

  __validateConstrains<T>(property: string, newValue: T, exceptionStack?: string[]): void;

  __validateType<T>(property: string, newValue: T, _type?: propertyTypes): any;

  __getFulName(property: string, separator?: string): string;

  __getLongestOptionName(printENVAlias: boolean): number;

  ___printOption(prefix: string, printENVAlias: boolean, longestName?: number): string;

  __loadDefaultsJSONObject(sourceObject: { [key: string]: any }): void;

  __getNavigatableState(): any;

  __loadStateJSONObject(sourceObject: { [key: string]: IPropertyMetadata<any, any, TAGS> | any }): void;

  __loadJSONObject(sourceObject: { [key: string]: any }): boolean;
}
