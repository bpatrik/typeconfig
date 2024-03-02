import {SubConfigClass} from './decorators/class/SubConfigClass';


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
