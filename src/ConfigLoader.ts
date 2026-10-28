import minimist from 'minimist';
import {Loader} from './Loader.js';
import {promises as fsp} from 'fs';

export interface EnvAlias {
  key: string;
  alias: string;
}

export class ConfigLoader {

  /**
   *
   * @param configObject Object to load
   * @param configFilePath Path to the config file. It will be created if not exist
   * @param envAlias Mapping environmental variables to config variables
   * @param forceRewrite applies cli and env variables to the config an writes the config to file
   * @deprecated
   */
  public static async loadBackendConfig(configObject: { [key: string]: any },
                                        configFilePath?: string,
                                        envAlias: EnvAlias[] = [],
                                        forceRewrite = false): Promise<void> {

    if (configFilePath && await ConfigLoader.loadJSONConfigFile(configFilePath, configObject) === false) {
      await ConfigLoader.saveJSONConfigFile(configFilePath, configObject);
    }

    let changed = false;
    changed = ConfigLoader.processCLIArguments(configObject) || changed;
    changed = ConfigLoader.processEnvVariables(configObject, envAlias) || changed;

    if (changed && forceRewrite && typeof configFilePath !== 'undefined') {
      await ConfigLoader.saveJSONConfigFile(configFilePath, configObject);
    }
  }

  /**
   *
   * @param configObject object to load the variables into
   * @param envAlias maps environmental variable names (alias) to config keys (key)
   * @return true if the object changed (env variables changed the config)
   */
  public static processEnvVariables(configObject: { [key: string]: any }, envAlias: EnvAlias[] = []): boolean {
    const config = ConfigLoader.getENVArgsAsObject(envAlias);
    return Loader.loadObject(configObject, config);
  }

  public static getCLIArgsAsObject(argv: string[] = process.argv): { [key: string]: any } {
    const args = minimist(argv.slice(2));
    delete (args._);
    delete (args.$0);

    return Loader.flatToObjHierarchy(args);
  }

  public static getENVArgsAsObject(envAlias: EnvAlias[] = []): { [key: string]: any } {
    const varAliases: { [key: string]: any } = {};
    envAlias.forEach((alias) => {
      if (process.env[alias.alias]) {
        varAliases[alias.key] = process.env[alias.alias];
      }
    });

    return Loader.flatToObjHierarchy({...process.env, ...varAliases});
  }

  public static processCLIArguments(configObject: { [key: string]: any }): boolean {
    const config = ConfigLoader.getCLIArgsAsObject();
    return Loader.loadObject(configObject, config);
  }

  public static async saveJSONConfigFile(configFilePath: string,
                                         configObject: { [key: string]: any },
                                         _fsp: typeof fsp = fsp): Promise<void> {
    await _fsp.writeFile(configFilePath, JSON.stringify(configObject, null, 4));
  }


  public static async loadJSONConfigFile(configFilePath: string,
                                         configObject: { [key: string]: any },
                                         _fsp: typeof fsp = fsp): Promise<boolean> {
    try {
      await _fsp.access(configFilePath);
    } catch {
      return false;
    }
    try {
      const config = JSON.parse(await _fsp.readFile(configFilePath, 'utf8'));
      Loader.loadObject(configObject, config);
      return true;
    } catch {
      return false;
    }
  }


}
