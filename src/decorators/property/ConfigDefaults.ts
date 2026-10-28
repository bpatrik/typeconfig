export function ConfigDefaults(): any {
  return (_target: any, _property: string): any => {
    return {
      get: function () {
        return this.__defaults;
      },
      enumerable: true,
      configurable: true
    };
  };
}
