import {IPropertyMetadata, PropertyOptions} from './IPropertyState';
import {Utils} from '../../Utils';
import {checkIsConfigType} from '../checkIsConfigType';

export function ConfigProperty<T, C, TAGS  = { [key: string]: any }>(options: PropertyOptions<T, C, TAGS> = {}) {
  return (target: any, property: string): any => {
    let type = options.type;
    if (typeof type === 'undefined') {
      type = Reflect.getMetadata('design:type', target, property);
    }
    switch (type) {
      case Array:
        type = 'array';
        break;
      case Number:
        type = 'float';
        break;
      case String:
        type = 'string';
        break;
      case Boolean:
        type = 'boolean';
        break;
      case Object:
        type = 'object';
        break;
      case Date:
        type = 'date';
        break;
    }
    const state: { [key: string]: IPropertyMetadata<any, any, TAGS> } = target.__state || {};

    state[property] = <IPropertyMetadata<T, C, TAGS>>options;
    state[property].type = type;

    const isEnumType = Utils.isEnum(type);
    if (isEnumType) {
      state[property].isEnumType = isEnumType;
    }
    const isEnumArrayType = Utils.isEnum(state[property].arrayType);
    if (isEnumArrayType) {
      state[property].isEnumArrayType = isEnumArrayType;
    }
    const isConfigType = checkIsConfigType((<any>type).prototype);
    if (isConfigType) {
      state[property].isConfigType = isConfigType;
    }
    const isConfigArrayType = (<any>state[property].arrayType) &&
      (<any>state[property].arrayType).prototype
      && typeof (<any>state[property].arrayType).prototype.__loadJSONObject === 'function'
      && typeof (<any>state[property].arrayType).prototype.toJSON === 'function';
    if (isConfigArrayType) {
      state[property].isConfigArrayType = isConfigArrayType;
    }


    if (type === 'unsignedInt' || type === 'positiveFloat') {
      state[property].min = Math.max(state[property].min || 0, 0);
    }
    target.__state = state;

    return {
      set: function (value: T) {
        this.__setAndValidateFromRoot(property, this.__validate(property, value));
      },
      get: function (): T {
        return this.__state[property].value;
      },
      enumerable: true,
      configurable: true
    };
  };
}
