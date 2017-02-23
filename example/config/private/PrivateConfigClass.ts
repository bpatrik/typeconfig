import {ConfigClass} from "../public/ConfigClass";

export interface subPrivateConfig {
    a: number;
    b: number;
}


export interface PrivateConfig {
    aPrivateConfig: string;
    subConfig: subPrivateConfig;
}

/**
 * This confugration will be only at backend
 */
export class PrivateConfigClass extends ConfigClass {

    public Private: PrivateConfig = {
        aPrivateConfig: "config",
        subConfig: {
            a: 4,
            b: 10
        }
    };

}

