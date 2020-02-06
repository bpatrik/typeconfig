import {WebConfigLoader} from '../../WebConfigLoader';
import {AbstractRootConfigClass, ConfigClassOptionsBase} from './base/AbstractRootConfigClass';
import {IWebConfigClassPrivate} from './IWebConfigClass';


export interface WebConfigClassOptions extends ConfigClassOptionsBase {
  attachDescription?: boolean;
  attachState?: boolean;
  enumsAsString?: boolean;
  loadQueryOptions?: boolean; // parses the query string and sets the to the config
  /**
   * tracks readonly property, but do not uses it for validation
   */
  softReadonly?: boolean;
}

export function WebConfigClass(options: WebConfigClassOptions = {}): any {
  return (constructorFunction: new (...args: any[]) => any) => {
    return class WebConfigClassType extends AbstractRootConfigClass(constructorFunction, options) implements IWebConfigClassPrivate {
      load(configJson: { __defaults?: any, __state?: { [key: string]: { readonly?: boolean } } } = <any>{}): void {

        // postpone readonly loading
        const __state = configJson.__state;
        delete configJson.__state;

        this.__loadJSONObject(configJson);
        if (options.loadQueryOptions) {
          WebConfigLoader.loadUrlParams(this);
        }


        // postponed readonly loading
        if (typeof __state !== 'undefined') {
          this.__loadStateJSONObject(__state);
        }
      }
    };
  };
}

