import type {IPropertyMetadata, PropertyOptions, propertyTypes} from './IPropertyState.js';
import {Utils} from '../../Utils.js';
import {checkIsConfigType} from '../checkIsConfigType.js';

/**
 * Reflect, as extended by the reflect-metadata polyfill. The polyfill is optional,
 * it is only needed if a property's type is inferred from the decorator metadata.
 */
type MetadataReflect = typeof Reflect & {
  getMetadata?: (metadataKey: string, target: object, propertyKey: string) => unknown
};

/**
 * Infers the type of the property from the 'design:type' metadata that TypeScript emits with emitDecoratorMetadata
 */
const inferType = (target: any, property: string): propertyTypes => {
  const reflect = Reflect as MetadataReflect;
  const name = (target?.constructor?.name || '<anonymous>') + '.' + property;
  if (typeof reflect.getMetadata !== 'function') {
    throw new Error('typeconfig: cannot infer the type of "' + name + '", Reflect.getMetadata is not available. ' +
      'Set the "type" option of @ConfigProperty, or import \'reflect-metadata\' before the config classes ' +
      'and enable "emitDecoratorMetadata".');
  }
  const type = reflect.getMetadata('design:type', target, property);
  if (typeof type === 'undefined') {
    throw new Error('typeconfig: cannot infer the type of "' + name + '", there is no "design:type" metadata. ' +
      'Set the "type" option of @ConfigProperty, or enable "emitDecoratorMetadata".');
  }
  return type as propertyTypes;
};

export function ConfigProperty<T, C, TAGS = { [key: string]: any }>(options: PropertyOptions<T, C, TAGS> = {}) {
  return (target: any, property: string): any => {
    let type: propertyTypes = options.type;
    if (typeof type === 'undefined') {
      type = inferType(target, property);
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
    const isConfigArrayType = checkIsConfigType((<any>state[property].arrayType)?.prototype);
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
