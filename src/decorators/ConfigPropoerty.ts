import {IPropertyState, PropertyOptions} from './IPropertyState';

export function ConfigProperty<T>(options: PropertyOptions<T> = {}) {
  return (target: any, property: string): any => {
    let type = options.type;
    if (typeof type === 'undefined') {
      type = Reflect.getMetadata('design:type', target, property);
    }
    const state: { [key: string]: IPropertyState<any> } = target.__state || {};
    state[property] = state[property] || <IPropertyState<any>>{};
    state[property].type = type;
    state[property].arrayType = options.arrayType;
    state[property].constraint = options.constraint;
    state[property].description = options.description;
    state[property].volatile = options.volatile;
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
