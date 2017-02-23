import * as fs from "fs";
import * as optimist from "optimist";

export class ConfigLoader {

    /**
     *
     * @param configObject Object to load
     * @param configFilePath Path to the config file. It will be created if not exist
     * @param envAlias Mapping environmental variables to config variables
     */
    static loadBackendConfig(configObject: any, configFilePath?: string, envAlias: Array<Array<string>> = []) {
        this.processConfigFile(configFilePath, configObject);
        this.processArguments(configObject);
        this.processEnvVariables(configObject, envAlias);
    }

    private static processEnvVariables(configObject: any, envAlias: Array<Array<string>>) {
        let varAliases = {};
        envAlias.forEach((alias) => {
            if (process.env[alias[0]]) {
                varAliases[alias[1]] = process.env[alias[0]];
            }
        });
        this.processHierarchyVar(configObject, varAliases);
        this.loadObject(configObject, process.env);
    };

    private static processArguments(configObject: any) {
        let argv = optimist.argv;
        delete(argv._);
        delete(argv.$0);
        this.processHierarchyVar(configObject, argv);
    };

    private static processHierarchyVar(configObject: any, vars: any) {
        let config = {};

        Object.keys(vars).forEach((key) => {
            let keyArray = key.split("-");
            let value = vars[key];

            //recursive settings
            let setObject = (object, keyArray, value) => {
                let key = keyArray.shift();
                object[key] = object[key] || {};

                if (keyArray.length == 0) {
                    //convert to boolean 
                    if (value.toLowerCase && value.toLowerCase() === "false") {
                        value = false;
                    }
                    if (value.toLowerCase && value.toLowerCase() === "true") {
                        value = true;
                    }

                    object[key] = value;
                    return;
                }

                return setObject(object[key], keyArray, value);
            };
            setObject(config, keyArray, value);

        });

        this.loadObject(configObject, config);
    }

    private static processConfigFile(configFilePath: string, configObject: any) {
        if (typeof configFilePath !== 'undefined') {
            if (ConfigLoader.loadConfigFile(configFilePath, configObject) === false) {
                ConfigLoader.saveConfigFile(configFilePath, configObject);
            }
        }
    };

    private static loadConfigFile(configFilePath, configObject): boolean {
        if (fs.existsSync(configFilePath) === false) {
            return false;
        }
        try {
            let config = JSON.parse(fs.readFileSync(configFilePath, 'utf8'));

            this.loadObject(configObject, config);
            return true;
        } catch (err) {

        }
        return false;
    }

    private static saveConfigFile(configFilePath, configObject) {
        try {
            fs.writeFileSync(configFilePath, JSON.stringify(configObject, null, 4));
        } catch (err) {

        }
    }

    private static loadObject(targetObject, sourceObject) {
        Object.keys(sourceObject).forEach((key) => {
            if (typeof targetObject[key] === "undefined") {
                return;
            }

            if (Array.isArray(targetObject[key])) {
                return targetObject[key] = sourceObject[key];
            }

            if (typeof targetObject[key] === "object") {
                return this.loadObject(targetObject[key], sourceObject[key]);
            }

            targetObject[key] = sourceObject[key];
        });
    }
}