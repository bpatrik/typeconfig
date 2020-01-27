export interface SecondLevelSettings {
    bSettings: string;
}

export interface PublicConfig {
    aSettings: number;
    subSettings: SecondLevelSettings;
}

/**
 * These configuration will be available at frontend and backend too
 */
export class ConfigClass {

    public Public: PublicConfig = {
        aSettings: 4,
        subSettings: {
            bSettings: "test"
        }
    };
}

