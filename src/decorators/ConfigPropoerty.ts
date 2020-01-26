import {IPropertyState, PropertyOptions} from './IPropertyState';

export function ConfigProperty<T, C>(options: PropertyOptions<T, C> = {}) {
  return (target: any, property: string): any => {
    let type = options.type;
    if (typeof type === 'undefined') {
      type = Reflect.getMetadata('design:type', target, property);
    }
    const state: { [key: string]: IPropertyState<any, any> } = target.__state || {};

    state[property] = <IPropertyState<T, C>>options;
    state[property].type = type;
    target.__state = state;

    return {
      set: function (value: any) {
        this.__setAndValidateFromRoot(property, this.__validate(property, value));
      },
      get: function () {
        return this.__state[property].value;
      },
      enumerable: true,
      configurable: true
    };
  };
}
