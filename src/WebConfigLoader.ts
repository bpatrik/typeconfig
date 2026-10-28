import {Loader} from './Loader.js';

export class WebConfigLoader {

  public static loadUrlParams(targetObject: { [key: string]: any }): void {
    Loader.processHierarchyVar(targetObject, WebConfigLoader.getUrlParams());
  }

  public static loadFrontendConfig(targetObject: { [key: string]: any }, sourceObject: { [key: string]: any }): void {
    Object.keys(sourceObject).forEach((key) => {
      if (typeof targetObject[key] === 'undefined') {
        return;
      }
      if (Array.isArray(targetObject[key])) {
        return targetObject[key] = sourceObject[key];
      }

      if (typeof targetObject[key] === 'object') {
        WebConfigLoader.loadFrontendConfig(targetObject[key], sourceObject[key]);
      } else {
        targetObject[key] = sourceObject[key];
      }
    });
  }

  private static getUrlParams(): { [key: string]: any } {
    // '+' stands for a space in the query string
    const decode = (s: string) => decodeURIComponent(s.replace(/\+/g, ' '));
    const query = window.location.search.substring(1);

    const urlParams: { [key: string]: any } = {};
    for (const match of query.matchAll(/([^&=]+)=?([^&]*)/g)) {
      urlParams[decode(match[1])] = decode(match[2]);
    }
    return urlParams;
  }

}
