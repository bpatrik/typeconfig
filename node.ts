// Node-only entry point: the root config class reads and writes files, CLI arguments and environment variables.
export {ConfigClassBuilder} from './src/decorators/builders/ConfigClassBuilder.js';
export {ConfigClass} from './src/decorators/class/ConfigClass.js';
export type {ConfigClassOptions, ConfigCLIOptions, IConfigClass, IConfigClassPrivate} from './src/decorators/class/IConfigClass.js';
