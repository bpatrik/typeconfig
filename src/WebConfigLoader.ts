import {Loader} from './Loader';

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
    let match;
    const pl = /\+/g,  // Regex for replacing addition symbol with a space
      search = /([^&=]+)=?([^&]*)/g,
      decode = (s: string) => {
        return decodeURIComponent(s.replace(pl, ' '));
      },
      query = window.location.search.substring(1);

    const urlParams: { [key: string]: any } = {};
    while (match = search.exec(query)) {
      urlParams[decode(match[1])] = decode(match[2]);
    }
    return urlParams;
  }

}
