import {Loader} from "./Loader";

export class WebConfigLoader {

    static getUrlParams() {
        let match,
            pl = /\+/g,  // Regex for replacing addition symbol with a space
            search = /([^&=]+)=?([^&]*)/g,
            decode = (s) => {
                return decodeURIComponent(s.replace(pl, " "));
            },
            query = window.location.search.substring(1);

        let urlParams = {};
        while (match = search.exec(query))
            urlParams[decode(match[1])] = decode(match[2]);
        return urlParams;
    }

    static loadUrlParams(targetObject: object) {
        Loader.processHierarchyVar(targetObject, WebConfigLoader.getUrlParams());
    }

    static loadFrontendConfig(targetObject, sourceObject) {
        Object.keys(sourceObject).forEach((key) => {
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