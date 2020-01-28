export interface PropertyConstraint<T, C> {
  assert: (value: T, config?: C) => boolean;
  fallBackValue?: T;
  assertReason?: string;
}

export type Enum<E> = Record<keyof E, number | string> & { [k: number]: string };
export declare type ObjectType<T> = {
  new(): T;
} | Function;

export type propertyTypes =
  'positiveFloat'
  | 'unsignedInt'
  | 'ratio'
  | 'integer'
  | typeof Number
  | typeof Boolean
  | typeof String
  | typeof Object
  | typeof Date
  | typeof Array
  | ObjectType<any>
  | Enum<any>;


export interface PropertyOptions<T, C> {
  /**
   * Can be manual set, but annotation can also infer.
   * It determines the value validation
   */
  type?: propertyTypes;
  /**
   * If both type and typeBuilder is present, typeBuilder will be used
   * @param value
   * @param config
   */
  typeBuilder?: (value: T, config?: C) => propertyTypes
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
  description?: string;
  envAlias?: string;
  constraint?: PropertyConstraint<T, any>;
}

export interface IPropertyMetadata<T, C> extends PropertyOptions<T, C> {
  type: propertyTypes;
  arrayType?: propertyTypes;
  volatile?: boolean;
  description?: string;
  envAlias?: string;
  constraint?: PropertyConstraint<T, C>

}
