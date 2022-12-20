export interface PropertyConstraint<T, C> {
  assert: (value: T, config?: C) => boolean;
  fallBackValue?: T;
  assertReason?: string;
}

export type Enum = { [k: string]: any } & { [k: number]: string };
export declare type ObjectType<T> = (new() => T) | Function;

export type numberTypes =
  'positiveFloat'
  | 'unsignedInt'
  | 'ratio'
  | 'integer'
  | 'float';

export type nonNumberTypes =
  'boolean'
  | 'object'
  | 'string'
  | 'password'
  | 'date'
  | 'array'
  | ObjectType<any>
  | Enum;


export type propertyTypes = numberTypes | nonNumberTypes;


export interface PropertyOptions<T, C, TAGS extends { [key: string]: any }> {

  /**
   * List of tags attached to the property
   */
  tags?: TAGS;

  /**
   * Can be manual set, but annotation can also infer.
   * It determines the value validation
   */
  type?: propertyTypes;

  min?: number;
  max?: number;
  /**
   * If both type and typeBuilder is present, typeBuilder will be used
   * @param value
   * @param config
   */
  typeBuilder?: (value: T, config?: C) => propertyTypes;
  /**
   * If the value changes, this function will be called
   * @param value
   * @param config
   */
  onNewValue?: (value: T, config?: C) => void;
  /**
   * If type is Array, this should be set manually.
   */
  arrayType?: propertyTypes;
  /**
   * If both arrayType and arrayTypeBuilder is present, arrayTypeBuilder will be used
   * @param value
   * @param config
   */
  arrayTypeBuilder?: (value: T, config?: C) => propertyTypes;
  volatile?: boolean;
  readonly?: boolean;
  description?: string;
  envAlias?: string;
  constraint?: PropertyConstraint<T, any>;
}

export interface IPropertyMetadata<T, C, TAGS extends { [key: string]: any }> extends PropertyOptions<T, C, TAGS> {
  value: T;
  default: T;
  tags?: TAGS;

  min?: number;
  max?: number;
  /**
   * Can be manual set, but annotation can also infer.
   * It determines the value validation
   */
  type?: propertyTypes;
  isEnumType?: boolean;
  isConfigType?: boolean;
  /**
   * If both type and typeBuilder is present, typeBuilder will be used
   * @param value
   * @param config
   */
  typeBuilder?: (value: T, config?: C) => propertyTypes;
  /**
   * If the value changes, this function will be called
   * @param value
   * @param config
   */
  onNewValue?: (value: T, config?: C) => void;
  /**
   * If type is Array, this should be set manually.
   */
  arrayType?: propertyTypes;
  isEnumArrayType?: boolean;
  isConfigArrayType?: boolean;
  /**
   * If both arrayType and arrayTypeBuilder is present, arrayTypeBuilder will be used
   * @param value
   * @param config
   */
  arrayTypeBuilder?: (value: T, config?: C) => propertyTypes;
  volatile?: boolean;
  readonly?: boolean;
  description?: string;
  envAlias?: string;
  constraint?: PropertyConstraint<T, C>;
}
