import {IPropertyMetadata, PropertyOptions, propertyTypes} from '../../property/IPropertyState';
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
   * Do not attach default values.
   * When reconstructing the config, the loader already knows the value
   */
  skipDefaultValues?: boolean;
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
  __parentConfig: IConfigClassPrivateBase<TAGS>;
  __propPath: string;
  __options: SubClassOptions<TAGS>;

  clone<T>(): T & IConfigClassBase<TAGS>;


  /**
   * Adds a new property dynamically.
   * Intended to be used from the GenericConfigType
   * @param name
   * @param options
   * @param value
   */
  __addPropertyDynamically<T, C, TAGS = { [key: string]: any }>(name: string, options: PropertyOptions<T, C, TAGS>, value: any): void;

  __removePropertyDynamically(name: string): void;

  __keys(): string[];

  /**
   * Set up the default of a newly added property.
   * used in the base class ctor and in GenericConfigType
   * @param propertyName
   */
  __setDefFromValue(propertyName: string): void;

  __getNewInstance<T>(): T & IConfigClassPrivateBase<TAGS>;

  __cloneTo(to: IConfigClassPrivateBase<TAGS>): void;

  toJSON(opt?: ToJSONOptions<TAGS>): { [key: string]: any };

  __getENVAliases(): { key: string, alias: string }[];

  __setParentConfig(propertyPath: string, propertyName: string, rootConf: IConfigClassPrivateBase<TAGS>,
                    parentConf: IConfigClassPrivateBase<TAGS>): void;

  __validateAll(exceptionStack?: string[]): void;

  /**
   * Used for propagating defaults as the root knows them.
   * This is important for arrays to know their defaults.
   * @param defaults
   */
  __inheritDefaultsFromParent(defaults: { [key: string]: any }): void;

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

  __getHardDefault(): Record<PropertyKey, unknown>;

  __getPropertyHardDefault(property: string): unknown;

  __getDefault(): Record<PropertyKey, unknown>;

  __getPropertyDefault(property: string): unknown;

  __isDefault(): boolean;

  __isPropertyDefault(property: string): boolean;
}
