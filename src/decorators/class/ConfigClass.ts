import {ConfigClassOptionsBase, RootConfigClassFactory} from './RootConfigClassFactory';
import {ConfigLoader} from '../../ConfigLoader';
import * as optimist from 'optimist';


export interface ConfigCLIOptions {
  attachDescription?: boolean;
  attachDefaults?: boolean;
  configPath?: boolean;
  saveIfNotExist?: boolean;
  rewriteCLIConfig?: boolean;
  rewriteENVConfig?: boolean;
  enumsAsString?: boolean;
  exitOnConfig?: boolean;
}

export interface ConfigClassOptions extends ConfigClassOptionsBase {
  attachDescription?: boolean;
  attachDefaults?: boolean;
  configPath?: string;
  saveIfNotExist?: boolean;
  rewriteCLIConfig?: boolean;
  rewriteENVConfig?: boolean;
  enumsAsString?: boolean;
  disableMan?: boolean;
  exitOnConfig?: boolean;

  cli?: {
    prefix?: string,
    enable: ConfigCLIOptions
  };
}

function parseCLIOptions(options: ConfigClassOptions) {
  if (options.cli.enable.configPath === true && optimist.argv[('--' + options.cli.prefix + 'path')]) {
    options.configPath = optimist.argv[('--' + options.cli.prefix + 'path')];
  }
  if (options.cli.enable.attachDefaults === true &&
    typeof optimist.argv[('--' + options.cli.prefix + 'attachDefs')] !== 'undefined') {
    options.attachDefaults = optimist.argv[('--' + options.cli.prefix + 'attachDefs')];
  }
  if (options.cli.enable.attachDescription === true &&
    typeof optimist.argv[('--' + options.cli.prefix + 'attachDefs')] !== 'undefined') {
    options.attachDescription = optimist.argv[('--' + options.cli.prefix + 'attachDefs')];
  }
  if (options.cli.enable.rewriteCLIConfig === true &&
    typeof optimist.argv[('--' + options.cli.prefix + 'rewrite-cli')] !== 'undefined') {
    options.rewriteCLIConfig = optimist.argv[('--' + options.cli.prefix + 'rewrite-cli')];
  }
  if (options.cli.enable.rewriteENVConfig === true &&
    typeof optimist.argv[('--' + options.cli.prefix + 'rewrite-env')] !== 'undefined') {
    options.rewriteENVConfig = optimist.argv[('--' + options.cli.prefix + 'rewrite-env')];
  }
  if (options.cli.enable.enumsAsString === true &&
    typeof optimist.argv[('--' + options.cli.prefix + 'string-enum')] !== 'undefined') {
    options.enumsAsString = optimist.argv[('--' + options.cli.prefix + 'string-enum')];
  }
  if (options.cli.enable.saveIfNotExist === true &&
    typeof optimist.argv[('--' + options.cli.prefix + 'save-if-not-exist')] !== 'undefined') {
    options.saveIfNotExist = optimist.argv[('--' + options.cli.prefix + 'save-if-not-exist')];
  }
  if (options.cli.enable.exitOnConfig === true &&
    typeof optimist.argv[('--' + options.cli.prefix + 'save-and-exist')] !== 'undefined') {
    options.exitOnConfig = optimist.argv[('--' + options.cli.prefix + 'save-and-exist')];
  }
  return options;
}

export function ConfigClass(options: ConfigClassOptions = {}): any {
  options.saveIfNotExist = typeof options.saveIfNotExist !== 'undefined' ? options.saveIfNotExist : true;
  options.cli = options.cli || {enable: {}};
  options.cli.prefix = options.cli.prefix || 'config-';
  options = parseCLIOptions(options);
  return (constructorFunction: new (...args: any[]) => any) => {
    return class ConfigClass extends RootConfigClassFactory(constructorFunction, options) {


      constructor(...args: any[]) {
        super(args);

        if(optimist.argv['--help']){
          console.log(this.__printMan());
        }
      }

      async load(): Promise<any> {
        if (options.configPath) {
          await ConfigLoader.loadJSONConfigFile(options.configPath, this);
        }
        let shouldSave = false;
        let cliParsed = false;
        let envParsed = false;
        if (options.rewriteCLIConfig === true) {
          shouldSave = ConfigLoader.processCLIArguments(this) || shouldSave;
          cliParsed = true;
        }
        if (options.rewriteENVConfig === true) {

          shouldSave = ConfigLoader.processEnvVariables(this, this.__getENVAliases()) || shouldSave;
          envParsed = true;
        }

        if (options.saveIfNotExist === true || shouldSave) {
          await this.save();
          if (options.exitOnConfig === true) {
            process.exit(0);
          }
        }

        if (cliParsed === false) {
          ConfigLoader.processCLIArguments(this);
        }
        if (envParsed === false) {
          ConfigLoader.processEnvVariables(this, this.__getENVAliases());
        }
      }

      async save(): Promise<any> {
        if (options.configPath) {
          await ConfigLoader.saveJSONConfigFile(options.configPath, this);
        }
      }


      __printMan(): string {
        let ret = 'Usage: <appname> [options] \n';

        const pad: number = options.cli.prefix.length + 25;
        ret += '\nMeta options: \n';
        ret += '--help'.padEnd(pad) + ' prints this manual \n';
        if (options.cli.enable.configPath === true) {
          ret += ('--' + options.cli.prefix + 'path').padEnd(pad) + ' sets the config file location \n';
        }
        if (options.cli.enable.attachDefaults === true) {
          ret += ('--' + options.cli.prefix + 'attachDefs').padEnd(pad) + ' prints the defaults to the config file \n';
        }
        if (options.cli.enable.attachDescription === true) {
          ret += ('--' + options.cli.prefix + 'attachDesc').padEnd(pad) + ' prints description to the config file \n';
        }
        if (options.cli.enable.rewriteCLIConfig === true) {
          ret += ('--' + options.cli.prefix + 'rewrite-cli').padEnd(pad) + ' updates the config file with the options from cli switches \n';
        }
        if (options.cli.enable.rewriteENVConfig === true) {
          ret += ('--' + options.cli.prefix + 'rewrite-env').padEnd(pad) + ' updates the config file with the options from environmental variables \n';
        }
        if (options.cli.enable.enumsAsString === true) {
          ret += ('--' + options.cli.prefix + 'string-enum').padEnd(pad) + ' enums are stored as string in the config file (instead of numbers) \n';
        }
        if (options.cli.enable.saveIfNotExist === true) {
          ret += ('--' + options.cli.prefix + 'save-if-not-exist').padEnd(pad) + ' creates config file if not exist \n';
        }
        if (options.cli.enable.exitOnConfig === true) {
          ret += ('--' + options.cli.prefix + 'save-and-exist').padEnd(pad) + ' creates config file and terminates \n';
        }

        ret += '\n<appname> can be configured through the configuration file, cli switches and environmental variables. \n';
        ret += 'All settings are case sensitive. \n';
        ret += 'Example for setting config MyConf through cli: \'<appname> --MyConf=5\' \n';
        ret += 'and through env variable: \'SET MyConf=5\' . \n';

        ret += '\nApp options: \n' + this.___printSwitches();
        return ret;
      }


    };
  };
}

