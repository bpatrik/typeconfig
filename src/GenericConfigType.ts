import {SubConfigClass} from './decorators/class/SubConfigClass.js';


@SubConfigClass()
export class GenericConfigType {

  constructor() {
    // this is a ConfigClassBase hack to prevent circular dependencies.
    // @ts-expect-error the field is declared on the ConfigClassBase mixin
    this.__unknownObjectType = GenericConfigType;
    // @ts-expect-error the field is declared on the ConfigClassBase mixin
    this.__isGenericConfigType = true;
  }


}
