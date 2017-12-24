export class Loader{
    public static processHierarchyVar(configObject: object, vars: object): void {
        const config = {};

        Object.keys(vars).forEach((key) => {
            const keyArray = key.split("-");
            const value = vars[key];

            //recursive settings
            const setObject = (object, keyArray, value) => {
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

    public static loadObject(targetObject: object, sourceObject: object): void {
        Object.keys(sourceObject).forEach((key) => {
            if (typeof targetObject[key] === "undefined") {
                return;
            }
            if (Array.isArray(targetObject[key])) {
                return targetObject[key] = sourceObject[key];
            }
            if (typeof targetObject[key] === "object" && targetObject[key] != null) {
                return this.loadObject(targetObject[key], sourceObject[key]);
            }

            targetObject[key] = sourceObject[key];
        });
    }
}