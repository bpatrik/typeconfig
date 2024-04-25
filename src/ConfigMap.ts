import {SubConfigClass} from './decorators/class/SubConfigClass';
import {PropertyOptions} from './decorators/property/IPropertyState';
import {IConfigClassPrivateBase} from './decorators/class/base/IConfigClassBase';
import {GenericConfigType} from './GenericConfigType';

export interface IConfigMap {
  [key: string]: any;
  addPropertyDynamically?<T, C, TAGS>(name: string, options: PropertyOptions<T, C, TAGS>, value: any): void;
}

/**
 * This class is exactly the same as a GenericConfigType, only it exposes the addPropertyDynamically
 */
@SubConfigClass()
export class ConfigMap extends GenericConfigType implements IConfigMap {
  [key: string]: any;

  constructor() {
    super();
  }

  public addPropertyDynamically<T, C, TAGS = {
    [key: string]: any
  }>(name: string, options: PropertyOptions<T, C, TAGS>, value: any): void {
    (this as unknown as IConfigClassPrivateBase<TAGS>).__addPropertyDynamically(name, options, value);
  }

}
