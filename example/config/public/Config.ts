import {ConfigClass} from "./ConfigClass";
import {WebConfigLoader} from "../../../src/WebConfigLoader";


declare module ServerInject {
    export let ConfigInject;
}

export let Config = new ConfigClass();

if (typeof ServerInject !== "undefined" && typeof ServerInject.ConfigInject !== "undefined") {
    WebConfigLoader.loadFrontendConfig(Config.Public, ServerInject.ConfigInject);
}
 