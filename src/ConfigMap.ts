import {SubConfigClass} from './decorators/class/SubConfigClass';
import {PropertyOptions} from './decorators/property/IPropertyState';
import {IConfigClassPrivateBase} from './decorators/class/base/IConfigClassBase';
import {GenericConfigType} from './GenericConfigType';

export interface IConfigMap<V> {
  [key: string]: V | Function;

  addProperty?<T, C, TAGS>(name: string, options: PropertyOptions<T, C, TAGS>, value: V): void;

  keys?(): string[];

  removeProperty?(name: string): void;
}

/**
 * This class is exactly the same as a GenericConfigType, only it exposes the addPropertyDynamically
 */
@SubConfigClass()
export class ConfigMap<V> extends GenericConfigType implements IConfigMap<V> {
  [key: string]: V | Function;

  constructor() {
    super();
  }

  public keys(): string[] {
    return (this as unknown as IConfigClassPrivateBase<unknown>).__keys();
  }

  public removeProperty(name: string): void {
    return (this as unknown as IConfigClassPrivateBase<unknown>).__removePropertyDynamically(name);
  }

  public addProperty<T, C, TAGS = {
    [key: string]: any
  }>(name: string, options: PropertyOptions<T, C, TAGS>, value: V): void {
    (this as unknown as IConfigClassPrivateBase<TAGS>).__addPropertyDynamically(name, options, value);
  }

}
