import {IPropertyMetadata, PropertyOptions} from './IPropertyState';

export function ConfigProperty<T, C>(options: PropertyOptions<T, C> = {}) {
  return (target: any, property: string): any => {
    let type = options.type;
    if (typeof type === 'undefined') {
      type = Reflect.getMetadata('design:type', target, property);
    }
    const state: { [key: string]: IPropertyMetadata<any, any> } = target.__state || {};

    state[property] = <IPropertyMetadata<T, C>>options;
    state[property].type = type;
    target.__state = state;

    return {
      set: function (value: T) {
        this.__setAndValidateFromRoot(property, this.__validate(property, value));
      },
      get: function (): T {
        return this.__values[property];
      },
      enumerable: true,
      configurable: true
    };
  };
}
