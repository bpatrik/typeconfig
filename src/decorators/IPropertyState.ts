export interface PropertyConstraint<U, T> {
  assert: (value: U, config?: T) => boolean;
  fallBackValue?: U;
  assertReason?: string;
}

export type Enum<E> = Record<keyof E, number | string> & { [k: number]: string };
export declare type ObjectType<T> = {
  new(): T;
} | Function;

export type propertyTypes = 'integer' | typeof Number | typeof Boolean | typeof String | typeof Date | typeof Array
  | ObjectType<any> | Enum<any>;


export interface PropertyOptions<T> {
  value?: T;
  type?: propertyTypes;
  arrayType?: propertyTypes;
  volatile?: boolean;
  description?: string;
  envAlias?: string;
  constraint?: PropertyConstraint<T, any>;
}

export interface IPropertyState<T> extends PropertyOptions<T> {
  value?: T;
  type: propertyTypes;
  arrayType?: propertyTypes;
  volatile?: boolean;
  description?: string;
  envAlias?: string;
  constraint?: PropertyConstraint<T, any>

}
