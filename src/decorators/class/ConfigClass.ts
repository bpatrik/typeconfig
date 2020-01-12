import {ConfigClassOptions, RootConfigClassFactory} from './RootConfigClassFactory';
import {ConfigLoader} from '../../ConfigLoader';


export function ConfigClass(options: ConfigClassOptions = {}): any {
  options.saveIfNotExist = typeof options.saveIfNotExist !== 'undefined' ? options.saveIfNotExist : true;
  return (constructorFunction: new (...args: any[]) => any) => {
    return class ConfigClass extends RootConfigClassFactory(constructorFunction, options) {
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
          shouldSave = ConfigLoader.processEnvVariables(this, options.envAlias) || shouldSave;
          envParsed = true;
        }

        if (options.saveIfNotExist === true || shouldSave) {
          this.save();
        }

        if (cliParsed === false) {
          ConfigLoader.processCLIArguments(this);
        }
        if (envParsed === false) {
          ConfigLoader.processEnvVariables(this, options.envAlias);
        }

      }

      async save(): Promise<any> {
        if (options.configPath) {
          await ConfigLoader.saveJSONConfigFile(options.configPath, this);
        }
      }


    };
  };
}

