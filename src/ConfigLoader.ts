import * as fs from 'fs';
import * as optimist from 'optimist';
import {Loader} from './Loader';

export class ConfigLoader {

  /**
   *
   * @param configObject Object to load
   * @param configFilePath Path to the config file. It will be created if not exist
   * @param envAlias Mapping environmental variables to config variables
   * @param forceRewrite applies cli and env variables to the config an writes the config to file
   */
  public static loadBackendConfig(configObject: object,
                                  configFilePath?: string,
                                  envAlias: string[][] = [],
                                  forceRewrite = false): void {
    ConfigLoader.processConfigFile(configFilePath, configObject);

    let changed = false;
    changed = ConfigLoader.processArguments(configObject) || changed;
    changed = ConfigLoader.processEnvVariables(configObject, envAlias) || changed;

    if (changed && forceRewrite && typeof configFilePath !== 'undefined') {
      ConfigLoader.saveConfigFile(configFilePath, configObject);
    }
  }

  public static saveConfigFile(configFilePath: string, configObject: object): void {
    fs.writeFileSync(configFilePath, JSON.stringify(configObject, null, 4));
  }

  private static processEnvVariables(configObject: object, envAlias: string[][]): boolean {
    const varAliases = {};
    let changed = false;
    envAlias.forEach((alias) => {
      if (process.env[alias[0]] && varAliases[alias[1]] !== process.env[alias[0]]) {
        changed = true;
        varAliases[alias[1]] = process.env[alias[0]];
      }
    });
    changed = Loader.processHierarchyVar(configObject, varAliases) || changed;
    changed = Loader.processHierarchyVar(configObject, process.env) || changed;

    return changed;
  };

  private static processArguments(configObject: object): boolean {
    const argv = optimist.argv;
    delete (argv._);
    delete (argv.$0);
    return Loader.processHierarchyVar(configObject, argv);
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


}
