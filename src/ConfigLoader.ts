import * as minimist from 'minimist';
import {Loader} from './Loader';
import {promises as fsp} from 'fs';

export class ConfigLoader {

  /**
   *
   * @param configObject Object to load
   * @param configFilePath Path to the config file. It will be created if not exist
   * @param envAlias Mapping environmental variables to config variables
   * @param forceRewrite applies cli and env variables to the config an writes the config to file
   * @deprecated
   */
  public static async loadBackendConfig(configObject: { [kes: string]: any },
                                        configFilePath?: string,
                                        envAlias: { key: string, alias: string }[] = [],
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
   * @param configObject: object
   * @param envAlias: string[][]
   * @return true if the object changed (env variables changed the config)
   */
  public static processEnvVariables(configObject: { [kes: string]: any }, envAlias: { key: string, alias: string }[] = []): boolean {
    const config = ConfigLoader.getENVArgsAsObject();
    return Loader.loadObject(configObject, config);
  }

  public static getCLIArgsAsObject(): { [key: string]: any } {
    const argv = minimist(process.argv.slice(2));
    delete (argv._);
    delete (argv.$0);

    return Loader.flatToObjHierarchy(argv);
  }

  public static getENVArgsAsObject(envAlias: { key: string, alias: string }[] = []): { [key: string]: any } {
    const varAliases: { [key: string]: any } = {};
    let changed = false;
    envAlias.forEach((alias) => {
      if (process.env[alias.alias] && varAliases[alias.key] !== process.env[alias.alias]) {
        changed = true;
        varAliases[alias.key] = process.env[alias.alias];
      }
    });

    return Loader.flatToObjHierarchy({...process.env, ...varAliases});
  }

  public static processCLIArguments(configObject: { [kes: string]: any }): boolean {
    const config = ConfigLoader.getCLIArgsAsObject();
    return Loader.loadObject(configObject, config);
  }

  public static async saveJSONConfigFile(configFilePath: string,
                                         configObject: { [kes: string]: any },
                                         _fsp: typeof fsp = fsp): Promise<void> {
    await _fsp.writeFile(configFilePath, JSON.stringify(configObject, null, 4));
  }


  public static async loadJSONConfigFile(configFilePath: string,
                                         configObject: { [kes: string]: any },
                                         _fsp: typeof fsp = fsp): Promise<boolean> {
    try {
      await _fsp.access(configFilePath);
    } catch (e) {
      return false;
    }
    try {
      const config = JSON.parse(await _fsp.readFile(configFilePath, 'utf8'));
      Loader.loadObject(configObject, config);
      return true;
    } catch (err) {
    }
    return false;
  }


}
