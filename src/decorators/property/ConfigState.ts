export function ConfigState(): any {
  return (_target: any, _property: string): any => {
    return {
      get: function () {
        return this.__getNavigatableState();
      },
      enumerable: true,
      configurable: true
    };
  };
}
