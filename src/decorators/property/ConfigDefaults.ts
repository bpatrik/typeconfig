export function ConfigDefaults(): any {
  return (target: any, property: string): any => {
    return {
      get: function () {
        return this.__defaults;
      },
      enumerable: true,
      configurable: true
    };
  };
}
