export const checkIsConfigType = (type: { __loadJSONObject?: Function, toJSON?: Function }) => type
  && typeof type.__loadJSONObject === 'function'
  && typeof type.toJSON === 'function';
