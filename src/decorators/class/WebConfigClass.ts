import {ConfigClassOptionsBase, RootConfigClassFactory} from './RootConfigClassFactory';
import {WebConfigLoader} from '../../WebConfigLoader';


export interface WebConfigClassOptions extends ConfigClassOptionsBase {
  attachDescription?: boolean;
  attachDefaults?: boolean;
  enumsAsString?: boolean;
  loadQueryOptions?: boolean; // parses the query string and sets the to the config
}

export function WebConfigClass(options: WebConfigClassOptions = {}): any {
  return (constructorFunction: new (...args: any[]) => any) => {
    return class WebConfigClass extends RootConfigClassFactory(constructorFunction, options) {
      load(configJson: WebConfigClass): void {
        WebConfigLoader.loadFrontendConfig(this, configJson);
        if(options.loadQueryOptions){
          WebConfigLoader.loadUrlParams(this);
        }
      }
    };
  };
}

