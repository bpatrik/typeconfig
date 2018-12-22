import * as fs from 'fs';
import * as optimist from 'optimist';
import {Loader} from './Loader';

export class ConfigLoader {

  /**
   *
   * @param configObject Object to load
   * @param configFilePath Path to the config file. It will be created if not exist
   * @param envAlias Mapping environmental variables to config variables
   */
  static loadBackendConfig(configObject: object, configFilePath?: string, envAlias: Array<Array<string>> = []): void {
    ConfigLoader.processConfigFile(configFilePath, configObject);
    ConfigLoader.processArguments(configObject);
    ConfigLoader.processEnvVariables(configObject, envAlias);
  }

  private static processEnvVariables(configObject: object, envAlias: Array<Array<string>>): void {
    const varAliases = {};
    envAlias.forEach((alias) => {
      if (process.env[alias[0]]) {
        varAliases[alias[1]] = process.env[alias[0]];
      }
    });
    Loader.processHierarchyVar(configObject, varAliases);
    Loader.processHierarchyVar(configObject, process.env);
  };

  private static processArguments(configObject: object): void {
    const argv = optimist.argv;
    delete (argv._);
    delete (argv.$0);
    Loader.processHierarchyVar(configObject, argv);
  };


  private static processConfigFile(configFilePath: string, configObject: object): void {
    if (typeof configFilePath !== 'undefined') {
      if (ConfigLoader.loadConfigFile(configFilePath, configObject) === false) {
        ConfigLoader.saveConfigFile(configFilePath, configObject);
      }
    }
  };

  private static loadConfigFile(configFilePath: string, configObject: object): boolean {
    if (fs.existsSync(configFilePath) === false) {
      return false;
    }
    try {
      const config = JSON.parse(fs.readFileSync(configFilePath, 'utf8'));
      Loader.loadObject(configObject, config);
      return true;
    } catch (err) {
    }
    return false;
  }

  public static saveConfigFile(configFilePath: string, configObject: object): void {
    fs.writeFileSync(configFilePath, JSON.stringify(configObject, null, 4));
  }


}
