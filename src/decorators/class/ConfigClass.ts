import {ConfigLoader} from '../../ConfigLoader.js';
import minimist from 'minimist';
import {AbstractRootConfigClass} from './base/AbstractRootConfigClass.js';
import type {ConfigClassOptions, ConfigCLIOptions, IConfigClassPrivate} from './IConfigClass.js';
import * as fs from 'fs';
import {promises as fsp} from 'fs';
import * as path from 'path';

const debugMode = process.env.NODE_ENV === 'debug';

const debugLog = (message: string): void => {
  if (debugMode === true) {
    console.log('[Typeconfig] ' + message);
  }
};

const cliMap: Required<{ [key in keyof ConfigCLIOptions]: string }> = {
  attachDescription: 'attachDesc',
  attachState: 'attachState',
  configPath: 'path',
  saveIfNotExist: 'save-if-not-exist',
  rewriteCLIConfig: 'rewrite-cli',
  rewriteENVConfig: 'rewrite-env',
  enumsAsString: 'string-enum',
  exitOnConfig: 'save-and-exist',
};

/**
 * Meta cli switches in the order they are printed by --help
 */
const cliManual: [keyof ConfigCLIOptions, string][] = [
  ['configPath', 'sets the config file location'],
  ['attachState', 'prints the value state (default, readonly, volatile, etc..) to the config file'],
  ['attachDescription', 'prints description to the config file'],
  ['rewriteCLIConfig', 'updates the config file with the options from cli switches'],
  ['rewriteENVConfig', 'updates the config file with the options from environmental variables'],
  ['enumsAsString', 'enums are stored as string in the config file (instead of numbers)'],
  ['saveIfNotExist', 'creates config file if not exist'],
  ['exitOnConfig', 'creates config file and terminates'],
];

function parseCLIOptions<C, TAGS>(options: ConfigClassOptions<C, TAGS>) {
  const argv = minimist(process.argv);
  for (const key of Object.keys(cliMap) as (keyof ConfigCLIOptions)[]) {
    const cliSwitch = options.cli.prefix + '-' + cliMap[key];
    if (options.cli.enable[key] === true && typeof argv[cliSwitch] !== 'undefined') {
      const value = argv[cliSwitch];
      (<any>options)[key] = value === 'true' ? true : (value === 'false' ? false : value);
    }
  }

  return options;
}

/**
 * Logs (and rethrows TypeErrors) when the config file cannot be read or parsed.
 * A missing file is normal, a broken file is reported.
 */
function handleReadError(message: string, e: unknown, rethrowTypeError: boolean): void {
  if (debugMode === true || e instanceof SyntaxError) {
    console.log('[Typeconfig] ' + message);
    console.error(e);
  }
  if (rethrowTypeError && e instanceof TypeError) {
    throw e;
  }
}

interface LoadOptions {
  pathOverride?: string;
  preventSaving?: boolean;
}

/**
 * Tracks which of the cli and env inputs were already applied while loading
 */
interface ParsedInputs {
  shouldSave: boolean;
  cliParsed: boolean;
  envParsed: boolean;
}

export function ConfigClass<C, TAGS = { [key: string]: any }>(options: ConfigClassOptions<C, TAGS> = {}): any {
  options.saveIfNotExist = typeof options.saveIfNotExist !== 'undefined' ? options.saveIfNotExist : true;
  options.cli = options.cli || <any>{};
  options.cli.enable = options.cli.enable || {};
  options.cli.prefix = options.cli.prefix || 'config';
  options.cli.defaults = options.cli.defaults || {};
  options.cli.defaults.prefix = options.cli.defaults.prefix || 'default';
  options.fs = options.fs || fs;
  options.path = options.path || path;
  options.fsPromise = options.fsPromise || fsp;
  options = parseCLIOptions(options);
  return (constructorFunction: new (...args: any[]) => any) => {
    return class ConfigClassType extends AbstractRootConfigClass(constructorFunction, options) implements IConfigClassPrivate<TAGS> {


      constructor(...args: any[]) {
        super(...args);

        if (minimist(process.argv)['help']) {
          console.log(this.__printMan());
          process.exit(0);
        }
      }


      __loadCLIENVDefaults() {
        const cliConfig = ConfigLoader.getCLIArgsAsObject();
        const envConfig = ConfigLoader.getENVArgsAsObject(this.__getENVAliases());
        const prefix = options.cli.defaults.prefix;
        if (debugMode === true) {
          debugLog('Loading defaults, def prefix: ' + prefix);
          if (cliConfig[prefix]) {
            debugLog('from cli: ' + JSON.stringify(cliConfig[prefix], null, '\t'));
          } else {
            debugLog('no default cli found among these: ' + JSON.stringify(cliConfig, null, '\t'));
          }
          if (envConfig[prefix]) {
            debugLog('from env: ' + JSON.stringify(envConfig[prefix], null, '\t'));
          } else {
            debugLog('no default env found among these: ' + JSON.stringify(envConfig, null, '\t'));
          }
        }
        if (options.cli.defaults.enabled === true && cliConfig[prefix]) {
          this.__loadDefaultsJSONObject(cliConfig[prefix]);
          this.__loadJSONObject(cliConfig[prefix]);
        }
        if (options.cli.defaults.enabled === true && envConfig[prefix]) {
          this.__loadDefaultsJSONObject(envConfig[prefix]);
          this.__loadJSONObject(envConfig[prefix]);
        }
      }

      /**
       * Loads the optional, hand-written __defaults block of the config file
       */
      __loadDefaultsFromFileContent(content: string): void {
        const config: { __defaults?: any } = JSON.parse(content);
        if (debugMode === true) {
          debugLog('Loading defaults from file: ' + JSON.stringify(config.__defaults, null, '\t'));
        }
        if (typeof config.__defaults !== 'undefined') {
          this.__loadDefaultsJSONObject(config.__defaults);
          this.__loadJSONObject(config.__defaults);
        }
      }

      async __loadDefaults(pathOverride?: string): Promise<any> {
        const configPath = pathOverride || options.configPath;
        if (configPath) {
          try {
            this.__loadDefaultsFromFileContent(await options.fsPromise.readFile(configPath, 'utf8'));
          } catch (e) {
            handleReadError('cannot read defaults from file', e, false);
          }
        }
        this.__loadCLIENVDefaults();
      }

      __loadDefaultsSync(pathOverride?: string): void {
        const configPath = pathOverride || options.configPath;
        if (configPath) {
          try {
            this.__loadDefaultsFromFileContent(options.fs.readFileSync(configPath, 'utf8'));
          } catch (e) {
            handleReadError('cannot read defaults from file', e, false);
          }
        }
        this.__loadCLIENVDefaults();
      }

      /**
       * Loads the values of the config file (without the __defaults block)
       */
      __loadConfigFromFileContent(content: string): void {
        const config: { __defaults?: any } = JSON.parse(content);
        delete config.__defaults;
        this.__loadJSONObject(config);
      }

      __processOptions(config: { [p: string]: any }) {

        // process values only
        if (options.cli.defaults.enabled === true && config[options.cli.defaults.prefix]) {
          delete config[options.cli.defaults.prefix];
        }
        debugLog('Processing cli and ENV inputs: ' + JSON.stringify(config, null, '\t'));
        return this.__loadJSONObject(config, true);
      }

      /**
       * Applies the cli and env inputs that should also be written back to the config file
       */
      __processRewritableInputs(): ParsedInputs {
        const parsed: ParsedInputs = {shouldSave: false, cliParsed: false, envParsed: false};
        if (options.rewriteCLIConfig === true) {
          parsed.shouldSave = this.__processOptions(ConfigLoader.getCLIArgsAsObject()) || parsed.shouldSave;
          parsed.cliParsed = true;
        }
        if (options.rewriteENVConfig === true) {
          parsed.shouldSave = this.__processOptions(ConfigLoader.getENVArgsAsObject(this.__getENVAliases())) || parsed.shouldSave;
          parsed.envParsed = true;
        }
        return parsed;
      }

      __shouldSaveAfterLoad(exists: boolean, parsed: ParsedInputs, opt?: LoadOptions): boolean {
        if (exists === false) {
          debugLog('config file does not exists yet. This can be normal');
        }
        return !opt?.preventSaving && ((options.saveIfNotExist === true && exists === false) || parsed.shouldSave);
      }

      /**
       * Applies the remaining cli and env inputs (they override the file, but are not saved to it)
       * and propagates the defaults
       */
      __finishLoading(parsed: ParsedInputs): void {
        if (parsed.cliParsed === false) {
          this.__processOptions(ConfigLoader.getCLIArgsAsObject());
        }
        if (parsed.envParsed === false) {
          this.__processOptions(ConfigLoader.getENVArgsAsObject(this.__getENVAliases()));
        }

        this.__rootConfig.__inheritDefaultsFromParent(this.__rootConfig.__defaults);
      }

      loadSync(opt?: LoadOptions): void {
        const configPath = opt?.pathOverride || options.configPath;
        if (configPath) {
          debugLog('Loading config. Path: ' + configPath);
        }
        this.__loadDefaultsSync(configPath);

        if (configPath) {
          try {
            this.__loadConfigFromFileContent(options.fs.readFileSync(configPath, 'utf8'));
          } catch (e) {
            handleReadError('cannot read config from file', e, true);
          }
        }
        const parsed = this.__processRewritableInputs();

        let exists = false;
        try {
          options.fs.accessSync(configPath);
          exists = true;
        } catch {
          // the file does not exist yet
        }
        if (this.__shouldSaveAfterLoad(exists, parsed, opt)) {
          this.saveSync(configPath);
          if (options.exitOnConfig === true) {
            process.exit(0);
          }
        }

        this.__finishLoading(parsed);
        // running postprocessing hook
        if (options.onLoadedSync) {
          options.onLoadedSync(this as any);
        }
      }


      async load(opt?: LoadOptions): Promise<any> {
        const configPath = opt?.pathOverride || options.configPath;
        if (configPath) {
          debugLog('Loading config. Path: ' + configPath);
        }
        await this.__loadDefaults(configPath);

        if (configPath) {
          try {
            this.__loadConfigFromFileContent(await options.fsPromise.readFile(configPath, 'utf8'));
          } catch (e) {
            handleReadError('cannot read config from file', e, true);
          }
        }
        const parsed = this.__processRewritableInputs();

        let exists = false;
        try {
          await options.fsPromise.access(configPath);
          exists = true;
        } catch {
          // the file does not exist yet
        }
        if (this.__shouldSaveAfterLoad(exists, parsed, opt)) {
          await this.save(configPath);
          if (options.exitOnConfig === true) {
            process.exit(0);
          }
        }

        this.__finishLoading(parsed);
        // running postprocessing hook
        if (options.onLoaded) {
          await options.onLoaded(this as any);
        } else if (options.onLoadedSync) {
          options.onLoadedSync(this as any);
        }
      }

      saveSync(pathOverride?: string): void {
        const configPath = pathOverride || options.configPath;

        if (options.crateConfigPathIfNotExists) {
          const dir = options.path.dirname(configPath);
          if (!options.fs.existsSync(dir)) {
            options.fs.mkdirSync(dir, {recursive: true});
          }
        }
        if (configPath) {
          options.fs.writeFileSync(configPath, JSON.stringify(this, null, 4));
        }
      }

      async save(pathOverride?: string): Promise<any> {
        const configPath = pathOverride || options.configPath;

        if (options.crateConfigPathIfNotExists) {
          const dir = options.path.dirname(configPath);
          try {
            await options.fsPromise.access(dir);
          } catch {
            await options.fsPromise.mkdir(dir, {recursive: true});
          }
        }
        if (configPath) {
          await ConfigLoader.saveJSONConfigFile(configPath, this, options.fsPromise);
        }
      }


      __printMan(): string {
        let ret = 'Usage: <appname> [options] \n';

        const pad: number = options.cli.prefix.length + 26;
        ret += '\nMeta cli options: \n';
        ret += '--help'.padEnd(pad) + ' prints this manual \n';
        for (const [key, description] of cliManual) {
          if (options.cli.enable[key] === true) {
            ret += ('--' + options.cli.prefix + '-' + cliMap[key]).padEnd(pad) + ' ' + description + ' \n';
          }
        }

        ret += '\n<appname> can be configured through the configuration file, cli switches and environmental variables. \n';
        ret += 'All settings are case-sensitive. \n';
        ret += 'Example for setting config MyConf through cli: \'<appname> --MyConf=5\' \n';
        ret += 'and through env variable: \'SET MyConf=5\' . \n';

        if (options.cli.defaults.enabled) {
          ret += '\nDefault values can be also overwritten by prefixing the options with \'' + options.cli.defaults.prefix + '-\', \n';
          ret += ' like \'<appname> --' + options.cli.defaults.prefix + '-MyConf=5\' and  \'SET ' +
            options.cli.defaults.prefix + '-MyConf=5\'\n';
        }
        ret += '\nApp CLI options: \n' + this.___printOption('--', false);
        ret += '\nEnvironmental variables: \n' + this.___printOption('', true);
        return ret;
      }

      __getNewInstance<T>(): T & ConfigClassType {
        const ni = new ConfigClassType();
        return ni as T & ConfigClassType;
      }


    };
  };

}
