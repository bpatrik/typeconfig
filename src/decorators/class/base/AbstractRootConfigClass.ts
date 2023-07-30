import {ConstraintError} from '../../exceptions/ConstraintError';
import {ConfigClassBase} from './ConfigClassBase';
import {SubClassOptions} from '../SubClassOptions';


export interface ConfigClassOptionsBase<TAGS> extends SubClassOptions<TAGS> {
  attachDescription?: boolean;
  configPath?: string;
  crateConfigPathIfNotExists?: boolean;
  saveIfNotExist?: boolean;
  rewriteCLIConfig?: boolean;
  rewriteENVConfig?: boolean;
  enumsAsString?: boolean;
  /**
   * Attaches property state (tags, default values) to JSON
   */
  attachState?: boolean;
  /**
   * If a property is set through cli or env variable, it becomes readonly
   */
  disableAutoReadonly?: boolean;
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


export function AbstractRootConfigClass<TAGS>(constructorFunction: new (...args: any[]) => any,
                                              options: ConfigClassOptionsBase<TAGS>) {
  return class RootConfigClass extends ConfigClassBase<TAGS>(constructorFunction, options) {
    constructor(...args: any[]) {
      super(...args);

      this.__setParentConfig('', this);
      const exceptionStack: string[] = [];
      this.__rootConfig.__validateAll(exceptionStack);
      if (exceptionStack.length > 0) {
        throw new ConstraintError(exceptionStack.join(', '));
      }

    }
  };
}
