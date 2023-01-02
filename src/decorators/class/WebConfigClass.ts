import {WebConfigLoader} from '../../WebConfigLoader';
import {AbstractRootConfigClass, ConfigClassOptionsBase} from './base/AbstractRootConfigClass';
import {IWebConfigClassPrivate} from './IWebConfigClass';


export interface WebConfigClassOptions<TAGS extends { [key: string]: any }> extends ConfigClassOptionsBase<TAGS> {
  attachDescription?: boolean;
  attachState?: boolean;
  enumsAsString?: boolean;
  loadQueryOptions?: boolean; // parses the query string and sets the to the config
  /**
   * tracks readonly property, but do not use it for validation
   */
  softReadonly?: boolean;
  /**
   Attaches the following tags to all properties
   */
  tags?: TAGS;
  /**
   Skips rendering (toJSON) properties with the following tags
   */
  skipTags?: TAGS;
  /**
   Keep properties with the following tags. If a tag is bot kept and skipped, it will be skipped.
   */
  keepTags?: TAGS;
}

export function WebConfigClass<TAGS>(options: WebConfigClassOptions<TAGS> = {}): any {
  return (constructorFunction: new (...args: any[]) => any) => {
    return class WebConfigClassType extends AbstractRootConfigClass(constructorFunction, options) implements IWebConfigClassPrivate<TAGS> {

      /**
       * Loads config from JSON and from Url Params
       * It disregards {__defaults}
       * @param configJson
       */
      load(configJson: { __defaults?: never, __state?: { [key: string]: { readonly?: boolean } } } = <any>{}): void {

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

      /**
       * Clones the Config
       */
      clone<T>(): T & WebConfigClassType {
        const cloned = new WebConfigClassType();
        this.__cloneTo(cloned);
        return cloned as T & WebConfigClassType;
      }
    };
  };
}

