export function ConfigState(): any {
  return (target: any, property: string): any => {
    return {
      get: function () {
        return this.__getNavigatableState();
      },
      enumerable: true,
      configurable: true
    };
  };
}
