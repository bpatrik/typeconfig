// Environment-agnostic entry point: usable from Node and from the browser (no Node built-ins).
export type {IPropertyMetadata, PropertyOptions, PropertyConstraint, propertyTypes} from './src/decorators/property/IPropertyState.js';
export type {IConfigClass, IConfigClassPrivate, ConfigClassOptions, ConfigCLIOptions} from './src/decorators/class/IConfigClass.js';
export type {IWebConfigClass, IWebConfigClassPrivate} from './src/decorators/class/IWebConfigClass.js';
export type {IConfigClassBase, IConfigClassPrivateBase, ToJSONOptions} from './src/decorators/class/base/IConfigClassBase.js';
export type {SubClassOptions} from './src/decorators/class/SubClassOptions.js';
export type {WebConfigClassOptions} from './src/decorators/class/WebConfigClass.js';
export {ConfigProperty} from './src/decorators/property/ConfigPropoerty.js';
export {ConfigDefaults} from './src/decorators/property/ConfigDefaults.js';
export {ConfigState} from './src/decorators/property/ConfigState.js';
export {SubConfigClass} from './src/decorators/class/SubConfigClass.js';
export {ConstraintError} from './src/decorators/exceptions/ConstraintError.js';
export {GenericConfigType} from './src/GenericConfigType.js';
export {ConfigMap} from './src/ConfigMap.js';
export type {IConfigMap} from './src/ConfigMap.js';
