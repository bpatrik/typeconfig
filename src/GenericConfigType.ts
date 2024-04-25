import {SubConfigClass} from './decorators/class/SubConfigClass';
import {PropertyOptions} from './decorators/property/IPropertyState';
import {ConfigProperty} from './decorators/property/ConfigPropoerty';
import {IConfigClassPrivateBase} from './decorators/class/base/IConfigClassBase';


@SubConfigClass()
export class GenericConfigType {

  constructor() {
    // this is a ConfigClassBase hack to prevent circular dependencies.
    // @ts-ignore
    this.__unknownObjectType = GenericConfigType;
    // @ts-ignore
    this.__isGenericConfigType = true;
  }


}
