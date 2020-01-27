import {WebConfigLoader} from '../../WebConfigLoader';
import {AbstractRootConfigClass, ConfigClassOptionsBase} from './base/AbstractRootConfigClass';
import {IWebConfigClassPrivate} from './IWebConfigClass';


export interface WebConfigClassOptions extends ConfigClassOptionsBase {
  attachDescription?: boolean;
  attachDefaults?: boolean;
  enumsAsString?: boolean;
  loadQueryOptions?: boolean; // parses the query string and sets the to the config
}

export function WebConfigClass(options: WebConfigClassOptions = {}): any {
  return (constructorFunction: new (...args: any[]) => any) => {
    return class WebConfigClass extends AbstractRootConfigClass(constructorFunction, options) implements IWebConfigClassPrivate {
      load(configJson: any = <any>{}): void {
        WebConfigLoader.loadFrontendConfig(this, configJson);
        if (options.loadQueryOptions) {
          WebConfigLoader.loadUrlParams(this);
        }
      }
    };
  };
}

