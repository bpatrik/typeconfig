export class WebConfigLoader {

   
    static loadFrontendConfig(targetObject, sourceObject) {
        Object.keys(sourceObject).forEach((key)=> {
            if (typeof targetObject[key] === "undefined") {
                return;
            }
            if (Array.isArray(targetObject[key])) {
                return targetObject[key] = sourceObject[key];
            }
            
            if (typeof targetObject[key] === "object") {
                WebConfigLoader.loadFrontendConfig(targetObject[key], sourceObject[key]);
            } else {
                targetObject[key] = sourceObject[key];
            }
        });
    }

}