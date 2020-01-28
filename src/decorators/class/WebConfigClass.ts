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
    return class WebConfigClassType extends AbstractRootConfigClass(constructorFunction, options) implements IWebConfigClassPrivate {
      load(configJson: { __defaults?: any } = <any>{}): void {
        if (typeof configJson.__defaults !== 'undefined') {
          this.__loadDefaultsJSONObject(configJson.__defaults);
          delete configJson.__defaults;
        }
        this.__loadJSONObject(configJson);
        if (options.loadQueryOptions) {
          WebConfigLoader.loadUrlParams(this);
        }
      }
    };
  };
}

