import {IConfigClassPrivateBase, ToJSONOptions} from './IConfigClassBase';
import {Enum, IPropertyMetadata, PropertyOptions, propertyTypes} from '../../property/IPropertyState';
import {ConstraintError} from '../../exceptions/ConstraintError';
import {Utils} from '../../../Utils';
import {SubClassOptions} from '../SubClassOptions';
import {Loader} from '../../../Loader';
import {checkIsConfigType} from '../../checkIsConfigType';
import {ConfigProperty} from '../../property/ConfigPropoerty';


export function ConfigClassBase<TAGS extends { [key: string]: any }>(constructorFunction: new (...args: any[]) => any,
                                                                     options: SubClassOptions<TAGS>) {
  if (typeof options === 'undefined') {
    throw new Error('options not set');
  }
  return class ConfigClassBaseType extends constructorFunction implements IConfigClassPrivateBase<TAGS> {
    __state: { [key: string]: IPropertyMetadata<any, any, TAGS> };
    __rootConfig: ConfigClassBaseType;
    __parentConfig: ConfigClassBaseType;
    __propPath = '';
    __propName = '';
    __created = false;
    __prototype = constructorFunction.prototype;
    __unknownObjectType: unknown;
    __isGenericConfigType: boolean;

    constructor(...args: any[]) {
      super(...args);
      const tmpState = this.__state || {};
      this.__state = {};
      for (const key of Object.keys(tmpState)) {
        if (typeof tmpState[key] === 'undefined') {
          continue;
        }
        this.__state[key] = {...tmpState[key]};
      }
      // Only add tags to the current class prototype
      if (options.tags) {
        for (const key of Object.keys(this.__prototype)) {
          if (typeof this.__state[key] === 'undefined') {
            continue;
          }
          this.__state[key].tags = (this.__state[key].tags || {} as TAGS);
          Object.assign(this.__state[key].tags, options.tags);
        }
      }
      for (const propertyName of Object.keys(this.__state)) {
        this.__setDefFromValue(propertyName);
      }
      this.__created = true;
    }

    get __options(): SubClassOptions<TAGS> {
      return options;
    }

    get __defaults() {
      const ret: { [key: string]: any } = {};

      for (const key of Object.keys(this.__state)) {
        if (typeof this.__state[key].default === 'undefined') {
          continue;
        }
        ret[key] = this.__state[key].default;
      }
      return ret;
    }

    static isConfigClassBaseCtor(ctor: any) {
      return ctor
        && ctor.prototype
        && typeof ctor.prototype.__loadJSONObject === 'function'
        && typeof ctor.prototype.toJSON === 'function';
    }

    static isConfigClassBase(value: any) {
      return value
        && typeof value.__loadJSONObject === 'function'
        && typeof value.toJSON === 'function';
    }

    __addPropertyDynamically<T, C, TGS = { [key: string]: any }>(name: string, opts: PropertyOptions<T, C, TGS>, value: any): void {
      if (!this.__isGenericConfigType) {
        throw new Error('Unintended use. Use it from Generic config classes.');
      }
      Object.defineProperty(this, name, ConfigProperty(opts)(this, name));
      (this as any)[name] = value;
      // (this as unknown as IConfigClassPrivateBase<TAGS>).__setDefFromValue(name);
    }

    __removePropertyDynamically(name: string): void {
      if (!this.__isGenericConfigType) {
        throw new Error('Unintended use. Use it from Generic config classes.');
      }
      delete this.__state[name];
      delete this[name];
    }

    __keys(): string[] {
      return Object.keys(this.__state);
    }

    __setDefFromValue(propertyName: string): void {

      if (typeof this.__state[propertyName].value === 'undefined') {
        return;
      }
      this.__state[propertyName].default = this.__state[propertyName].value;
      this.__state[propertyName].hardDefault = this.__state[propertyName].value;
      if (this.__state[propertyName].value) {
        if (typeof this.__state[propertyName].value.__defaults !== 'undefined') {
          this.__state[propertyName].default = this.__state[propertyName].value.__defaults;
          this.__state[propertyName].hardDefault = this.__state[propertyName].value.__defaults;
        } else {
          try {
            // defaults should only be plain jsons, no config classes
            if (this.__state[propertyName].value.toJSON) {
              this.__state[propertyName].default = this.__state[propertyName].value.toJSON();
              this.__state[propertyName].hardDefault = this.__state[propertyName].value.toJSON();
            } else {
              this.__state[propertyName].default = JSON.parse(JSON.stringify(this.__state[propertyName].value));
              this.__state[propertyName].hardDefault = JSON.parse(JSON.stringify(this.__state[propertyName].value));
            }
          } catch (e) {
            throw new Error('Error setting default value for ' + propertyName + ': ' + e);
          }
        }
      }
    }

    __getNavigatableState() {

      const ret: { [key: string]: any } = {};

      for (const key of Object.keys(this.__state)) {
        if (this.__state[key].value && this.__state[key].value.__getNavigatableState) {
          Object.defineProperty(ret, key, {
            get: () => this.__state[key].value.__getNavigatableState(),
            enumerable: true,
            configurable: true
          });
          continue;
        }
        ret[key] = this.__state[key];
      }
      return ret;
    }

    __loadStateJSONObject(sourceObject: { [key: string]: IPropertyMetadata<any, any, TAGS> | any }): void {
      if (sourceObject === null || typeof sourceObject === 'undefined') {
        return;
      }
      Object.keys(sourceObject).forEach((key) => {
        if (typeof this.__state[key] === 'undefined') {
          return;
        }
        if (this.__state[key].value &&
          typeof this.__state[key].value.__loadStateJSONObject !== 'undefined') {
          this[key].__loadStateJSONObject(sourceObject[key]);
          return;
        }
        if (sourceObject[key].readonly) {
          this.__state[key].readonly = sourceObject[key].readonly;
        }
        if (sourceObject[key].default) {
          this.__state[key].default = sourceObject[key].default;
        }
        if (sourceObject[key].volatile) {
          this.__state[key].volatile = sourceObject[key].volatile;
        }

        if (sourceObject[key].tags) {
          this.__state[key].tags = this.__state[key].tags || {} as TAGS;
          this.__state[key].tags = {...(sourceObject[key].tags || {} as TAGS), ...(this.__state[key].tags || {} as TAGS)};
        }
        if (sourceObject[key].description) {
          this.__state[key].description = this.__state[key].description || sourceObject[key].description;
        }
      });
    }

    __loadDefaultsJSONObject(sourceObject: { [key: string]: any }) {
      if (sourceObject === null || typeof sourceObject === 'undefined') {
        return;
      }
      Object.keys(sourceObject).forEach((key) => {
        if (typeof this.__state[key] === 'undefined' ||
          typeof sourceObject[key] === 'undefined') {
          return;
        }


        if (this.__state[key].isConfigType) {
          if (this.__state[key].default &&
            typeof this.__state[key].default.__loadDefaultsJSONObject !== 'undefined') {
            this.__state[key].default.__loadDefaultsJSONObject(sourceObject[key]);
          }
          if (typeof this.__state[key].value !== 'undefined') {
            this[key].__loadDefaultsJSONObject(sourceObject[key]);
          }

          Loader.loadObject(this.__state[key].default, sourceObject[key]);
          return;
        }

        this.__state[key].default = sourceObject[key];
      });
    }


    __populateGenericTypeFromState(sourceObject: { [key: string]: any }) {
      // if this sub object has a state then it is GenericConfigType
      if (sourceObject.__state && !sourceObject.__prototype) {
        // prepare __state for this property
        Object.keys(sourceObject.__state).forEach((key) => {
          // use known type (coming from the class def) if available
          const type = this?.__state[key]?.type || sourceObject.__state[key].type || this.__unknownObjectType || 'object';

          if (typeof this.__state[key] === 'undefined') {
            Object.defineProperty(this, key,
              ConfigProperty({type: type})(this, key));
            if (typeof this[key] === 'undefined' &&
              sourceObject?.__state?.[key]?.default) {
              this[key] = sourceObject.__state[key].default;
            }
          }
        });
        this.__loadStateJSONObject(sourceObject.__state);
      }
    }

    __loadJSONObject(sourceObject: { [key: string]: any }, setToReadonly: boolean = false, skipValidation: boolean = false): boolean {
      let changed = false;
      if (sourceObject === null || typeof sourceObject === 'undefined') {
        return false;
      }


      Object.keys(sourceObject).forEach((key) => {
        if (key === '__state' || typeof this.__state[key] === 'undefined') {
          return;
        }

        const set = () => {
          if (skipValidation) {
            this.__state[key].value = this.__validateType(key, sourceObject[key]);
          } else {
            this[key] = sourceObject[key];
          }
          changed = true;
          if (setToReadonly === true && options.disableAutoReadonly !== true) {
            this.__state[key].readonly = true;
          }
        };

        if (this.__state[key].type === 'array') {
          if (this.__state[key].value !== sourceObject[key]) {
            try {
              if (typeof sourceObject[key] === 'string' && Array.isArray(JSON.parse(sourceObject[key]))) {
                sourceObject[key] = JSON.parse(sourceObject[key]);
              }
            } catch (e) {
            }
            set();
          }

        } else if (this.__state[key].value &&
          typeof this.__state[key].value.__loadJSONObject !== 'undefined') {
          // if we load a GenericType into an already existing genereic type
          // NOTE: __state is removed if it's not a Generic type
          if ((sourceObject[key] as { __state: unknown }).__state) {
            this.__state[key].value.__populateGenericTypeFromState(sourceObject[key]);
          }
          changed = this[key].__loadJSONObject(sourceObject[key], setToReadonly, skipValidation) || changed;

        } else if (this.__state[key].type === 'object') {
          set();

        } else if (this.__state[key].value !== sourceObject[key]) {
          this[key] = sourceObject[key];
          set();
        }

      });
      return changed;
    }

    __getENVAliases(): { key: string, alias: string }[] {
      let ret: { key: string, alias: string }[] = [];
      for (const key of Object.keys(this.__state)) {
        if (typeof this.__state[key].envAlias !== 'undefined') {
          ret.push({
            key: this.__getFulName(key).replace(new RegExp('\\.', 'gm'), '-'),
            alias: this.__state[key].envAlias
          });
        }

        if (this.__state[key].value !== null &&
          typeof this.__state[key].value !== 'undefined' &&
          typeof this.__state[key].value.__getENVAliases !== 'undefined') {
          ret = ret.concat(this.__state[key].value.__getENVAliases());
        }
      }
      return ret;
    }

    __setParentConfig(propertyPath: string, propName: string, rootConf: ConfigClassBaseType, parentConf: ConfigClassBaseType): void {
      this.__rootConfig = rootConf;
      this.__parentConfig = parentConf;
      this.__propPath = propertyPath;
      this.__propName = propName;
      for (const key of Object.keys(this.__state)) {
        if (this.__state[key].value === null ||
          typeof this.__state[key].value === 'undefined' ||
          typeof this.__state[key].value.__setParentConfig === 'undefined') {
          continue;
        }
        const propPath = this.__propPath.length > 0 ? (this.__propPath + '.' + key) : key;
        this.__state[key].value.__setParentConfig(propPath, key, this.__rootConfig, this);
      }
    }

    __validateAll(exceptionStack?: string[]): void {
      for (const key of Object.keys(this.__state)) {
        this.__validate(key, this.__state[key].value, this.__state[key], exceptionStack);

        if (this.__state[key].value && this.__state[key].value.__validateAll) {
          this.__state[key].value.__validateAll(exceptionStack);
        }
      }
    }

    __inheritDefaultsFromParent(defaults: { [key: string]: any }) {

      if (this.__isGenericConfigType) {
        // TODO: setting default from parent is not supported for generic config type
        return;
      }

      for (const property of Object.keys(this.__state)) {
        const def = defaults?.[property];
        // propagate def value from top to bottom
        if (this.__state[property].value) {

          if (this.__state[property].isConfigType) {
            this.__state[property].value.__inheritDefaultsFromParent(def);
          } else if (this.__state[property].isConfigArrayType) {
            for (let i = 0; i < this.__state[property].value.length; ++i) {
              this.__state[property].value[i].__inheritDefaultsFromParent(def?.[i]);
            }
          }
          if (isNaN(def) && !def) {
            delete this.__state[property].default;
          } else {
            this.__state[property].default = def;
          }
        }
      }
    }

    __setAndValidateFromRoot<T>(property: string, newValue: T): void {
      // during setting default value, this variable is not exist yet
      if (this.__state[property].value === newValue) {
        return;
      }

      // skip readonly if we are setting the default value
      if (this.__state[property].readonly === true && this.__created === true && options.softReadonly !== true) {
        throw new Error(property + ' is readonly');
      }
      this.__state[property].value = newValue;


      if (this.__rootConfig) { // while sub config default value set, the root conf is not available yet.


        if (typeof this.__state[property].onNewValue !== 'undefined') {
          this.__state[property].onNewValue(this.__state[property].value, this.__rootConfig);
        }

        const exceptionStack: string[] = [];
        this.__rootConfig.__validateAll(exceptionStack);
        if (exceptionStack.length > 0) {
          throw new ConstraintError(exceptionStack.join(', '));
        }

      }
    }

    __validate<T>(property: string, newValue: T, _typeState?: {
                    type?: propertyTypes, isEnumType?: boolean, isConfigType?: boolean
                  },
                  exceptionStack?: string[]): any {
      if (typeof this.__rootConfig === 'undefined') {
        return newValue;
      }
      newValue = this.__validateType(property, newValue, _typeState);
      this.__validateConstrains(property, newValue, exceptionStack);
      return newValue;
    }

    __validateConstrains<T>(property: string, newValue: T, exceptionStack?: string[]): void {
      if (typeof this.__state[property].constraint !== 'undefined') {
        if (this.__state[property].constraint.assert(newValue, this.__rootConfig) !== true) {
          let exStr = this.__state[property].constraint.assertReason;
          if (typeof this.__state[property].constraint.fallBackValue !== 'undefined') {
            this.__setAndValidateFromRoot(property, this.__state[property].constraint.fallBackValue);
            if (!exStr) {
              exStr = 'Constraint failed for ' + property + ' falling back to value: ' + this.__state[property].constraint.fallBackValue;
            }
          }
          if (!exStr) {
            exStr = 'Constraint failed for ' + property;
          }
          if (exceptionStack) {
            exceptionStack.push(exStr);
          } else {
            throw new ConstraintError(exStr);
          }
        }
      }
    }

    /**
     * Checks if the value is valid with the given type.
     * Makes basic casting and conversion
     * @param property
     * @param newValue
     * @param _typeState
     * @private
     */
    __validateType<T>(property: string, newValue: T,
                      _typeState?: {
                        build?: () => ConfigClassBaseType,
                        type?: propertyTypes,
                        isEnumType?: boolean, isConfigType?: boolean
                      }): any {
      if (typeof newValue === 'undefined' || newValue == null) {
        return newValue;
      }
      const propState = this.__state[property];
      const type: propertyTypes = typeof _typeState !== 'undefined' ? _typeState.type :
        (propState.typeBuilder ? propState.typeBuilder(newValue, this.__rootConfig) :
          propState.type);
      // TODO make it work with type based builder
      const build = () => {
        return (_typeState?.build ? _typeState.build : (propState?.value?.clone ? propState?.value?.clone : () => new (<any>type)()))();
      };
      const isEnumType = typeof _typeState !== 'undefined' ? _typeState.isEnumType : propState.isEnumType;
      const isConfigType = typeof _typeState !== 'undefined' ? _typeState.isConfigType : propState.isConfigType;


      const strValue = String(newValue);
      let floatValue = NaN;
      if (parseFloat(strValue).toString() === strValue) {
        floatValue = parseFloat(strValue);
      }
      let intValue = NaN;
      if (parseInt(strValue, 10).toString() === strValue) {
        intValue = parseInt(strValue, 10);
      }

      const checkRange = () => {
        if (typeof propState.min !== 'undefined' && floatValue < propState.min) {
          throw new Error(newValue + ' should be greater than ' + propState.min);
        }
        if (typeof propState.max !== 'undefined' && floatValue > propState.max) {
          throw new Error(newValue + ' should be less than ' + propState.max);
        }
      };
      switch (type) {
        case 'string':
          return strValue;
        case 'float':
          checkRange();
          return floatValue;
        case 'date':
          if (typeof intValue === 'undefined' && isNaN(Date.parse(<any>newValue))) {
            throw new TypeError(this.__getFulName(property) + ' should be a Date, got:' + newValue);
          }
          return new Date(<any>newValue);
        case 'boolean':
          if (strValue.toLowerCase() === 'false' || <any>newValue === false) {
            return false;
          }
          if (strValue.toLowerCase() === 'true' || <any>newValue === true) {
            return true;
          }
          throw new TypeError(this.__getFulName(property) + ' should be a boolean');
        case 'array':
          if (!Array.isArray(newValue)) {
            throw new TypeError(this.__getFulName(property) + ' should be an array');
          }
          if (propState.arrayType !== 'array') {
            const tmpNewValue = [];
            for (let i = 0; i < newValue.length; ++i) {
              const t: propertyTypes = propState.arrayTypeBuilder ? propState.arrayTypeBuilder(newValue[i], this.__rootConfig) :
                (propState.arrayType ? propState.arrayType : null);

              const factory = (t === propState.arrayType && propState?.value?.[i]?.clone) ? {build: () => propState.value[i].clone()} : {};
              tmpNewValue[i] = this.__validate(property, newValue[i], {
                type: t,
                isEnumType: propState.isEnumArrayType,
                isConfigType: propState.isConfigArrayType,
                // add custom builder if there is no type based builder
                // TODO make it work with type based builder
                ...(factory)
              });
            }
            return tmpNewValue;
          }
          return newValue;
        case 'integer':
          checkRange();
          if (intValue !== floatValue) {
            throw new TypeError('Value should be an integer, got: ' + newValue);
          }
          return intValue;
        case 'ratio':
          checkRange();
          if (floatValue < 0 || floatValue > 1) {
            throw new TypeError('Value should be an ratio, got: ' + newValue);
          }
          return floatValue;
        case 'unsignedInt':
          checkRange();
          if (intValue !== floatValue || intValue < 0) {
            throw new TypeError('Value should be an unsigned integer, got: ' + newValue);
          }
          return intValue;

        case 'positiveFloat':
          checkRange();
          if (floatValue < 0) {
            throw new TypeError('Value should be an positive float, got: ' + newValue);
          }
          return floatValue;
      }
      if (isEnumType === true) {
        if (Number.isInteger(intValue) && typeof (<Enum>type)[intValue] !== 'undefined') {
          return intValue;
        }
        if (typeof newValue === 'string' && typeof (<Enum>type)[strValue] === 'number') {
          return (<Enum>type)[strValue];
        }
        throw new TypeError(this.__getFulName(property) + ' should be an Enum from values: ' + Object.keys(type) + ', got: ' + newValue);
      }

      if (isConfigType === true) {
        if (propState && propState.value &&
          (!propState.typeBuilder || propState.typeBuilder(propState.value) === type) &&
          typeof propState.value.__loadJSONObject !== 'undefined') {
          propState.value.__loadJSONObject(newValue);
          return propState.value;
        }

        if (!ConfigClassBaseType.isConfigClassBase(newValue)) { // it's not an object, but a json
          const o: ConfigClassBaseType = build();
          if (typeof propState.value === 'undefined' &&
            o.__isGenericConfigType &&
            !(newValue as { __state: unknown }).__state) {
            return; // do not set anything if we cannot set the state of generic type
          }
          const propPath = this.__propPath.length > 0 ? (this.__propPath + '.' + property) : property;
          o.__setParentConfig(propPath, property, this.__rootConfig, this);
          if ((newValue as { __state: unknown }).__state) {
            o.__populateGenericTypeFromState(newValue);
          }
          o.__loadJSONObject(newValue);
          return o;
        }

        // if the default value of a ConfigObject is undefined root and parent will be never set
        if (!(newValue as ConfigClassBaseType).__rootConfig && (newValue as ConfigClassBaseType).__setParentConfig) {
          const propPath = this.__propPath.length > 0 ? (this.__propPath + '.' + property) : property;
          (newValue as ConfigClassBaseType).__setParentConfig(propPath, property, this.__rootConfig, this);
        }
      }
      return newValue;
    }


    __getNewInstance<T>(): T & ConfigClassBaseType {
      throw new Error('Not implemented in ConfigClassBase');
    }

    /**
     * Clones its state to the to object
     * @param to config object to clone its state to
     */
    __cloneTo(to: ConfigClassBaseType): void {
      const configJson = this.toJSON({attachState: true, attachDescription: false, attachVolatile: true, enumsAsString: false});
      // postpone readonly loading
      const __state = configJson.__state;
      delete configJson.__state;

      to.__loadJSONObject(configJson, false, true);
      to.__loadStateJSONObject(__state);

    }

    /**
     * Clones the Config
     */
    clone<T>(): T & ConfigClassBaseType {
      const cloned = this.__getNewInstance();
      this.__cloneTo(cloned);
      return cloned as T & ConfigClassBaseType;
    }

    toJSON(opt?: ToJSONOptions<TAGS>, lazyAttach = false): { [key: string]: any } {
      opt = JSON.parse(JSON.stringify(typeof opt === 'object' ? opt : options, function (this: any, key: string, value: any) {
        if (!['path', 'fs', 'psPromise'].includes(key)) {
          return value;
        }
      }));

      const skipDefaultValues = opt.skipDefaultValues;
      delete opt.skipDefaultValues;
      const ret: { [key: string]: any } = {};

      // Attach __state
      if (opt.attachState === true) {
        const loadState = (from: ConfigClassBaseType): Record<string, unknown> => {
          const retState: Record<string, unknown> = {};
          for (const key of Object.keys(from.__state)) {
            if (typeof from.__state[key] === 'undefined') {
              continue;
            }

            if (from.__state[key].value &&
              typeof from.__state[key].value.__state !== 'undefined') {
              const r = loadState(from.__state[key].value);
              if (r) {
                retState[key] = r;
              }
            } else if (from.__state[key].default &&
              typeof from.__state[key].default.__state !== 'undefined') {
              const r = loadState(from.__state[key].default);
              if (r) {
                retState[key] = r;
              }
            } else {


              let knownState = false;

              const isRootConfig = (!!from.__rootConfig && from.__parentConfig === null);
              const parentKnowsSameDef =
                // maybe no def. value exist
                // make sure that the state exists and the two values are not only the same as they both can't be fined
                from.__parentConfig &&
                typeof from.__prototype.__state?.[key] !== 'undefined' &&
                JSON.stringify((from.__parentConfig.__getPropertyHardDefault(from.__propName) as Record<string, unknown>)?.[key])
                === JSON.stringify(from.__getPropertyHardDefault(key));

              if (isRootConfig || parentKnowsSameDef) {
                knownState = true;
              }
              if (!lazyAttach || !knownState) {
                if (knownState) {
                  const {
                    value, type, arrayType, tags,
                    description, max, min, volatile,
                    typeBuilder, arrayTypeBuilder, onNewValue,
                    isConfigType, isEnumType, isEnumArrayType, isConfigArrayType,
                    hardDefault, constraint, envAlias, ...noValue
                  } = from.__state[key];
                  retState[key] = noValue;
                } else {
                  const {
                    value,
                    typeBuilder, arrayTypeBuilder, onNewValue,
                    isConfigType, isEnumType, isEnumArrayType, isConfigArrayType,
                    hardDefault, constraint, envAlias, ...noValue
                  } = from.__state[key];
                  retState[key] = noValue;
                }
              }

            }
          }
          if (Object.keys(retState).length === 0) {
            return null;
          }
          return retState;
        };

        const rs = loadState(this);
        if (rs) {
          ret['__state'] = rs;
        }
      }


      for (const key of Object.keys(this.__state)) {
        if (
          // skip volatile
          (this.__state[key].volatile === true && opt.attachVolatile !== true) ||
          // skip if not set
          typeof this.__state[key].value === 'undefined' ||
          // skip if tag as skip
          (opt.skipTags && this.__state[key].tags &&
            Object.keys(opt.skipTags).findIndex((k) => opt.skipTags[k] === this.__state[key].tags[k]) !== -1) ||
          // skip if if not tag as skip
          (opt.keepTags && this.__state[key].tags &&
            Object.keys(opt.keepTags).findIndex((k) => opt.keepTags[k] === this.__state[key].tags[k]) === -1)
        ) {
          continue;
        }
        if (opt.attachDescription === true && typeof this.__state[key].description !== 'undefined') {
          ret['//[' + key + ']'] = this.__state[key].description;
        }


        // if ConfigClass type?
        if (checkIsConfigType(this.__state[key].value)) { // check is config type dynamically
          ret[key] = this.__state[key].value.toJSON(opt, true);
          continue;
        }

        if (Array.isArray(this.__state[key].value)) {
          ret[key] = this.__state[key].value.map((v: any) => {
            if (v?.toJSON) {
              return v.toJSON(opt, true);
            }
            return v;
          });
          continue;
        }

        if (opt.enumsAsString === true && Utils.isEnum(this.__state[key].type)) {
          ret[key] = (<any>this.__state[key].type)[this.__state[key].value];
        } else {
          ret[key] = this.__state[key].value;
        }
      }
      // preserve extreme numbers
      const jsonRet = JSON.parse(JSON.stringify(ret, (key, value) => {
        if (value !== value) {
          return 'NaN';
        }

        if (value === Infinity) {
          return 'Infinity';
        }

        if (value === -Infinity) {
          return '-Infinity';
        }

        return value;
      }), (key, value) => {
        if (value === 'NaN') {
          return NaN;
        }

        if (value === 'Infinity') {
          return Infinity;
        }

        if (value === '-Infinity') {
          return -Infinity;
        }

        if (typeof value === 'string' &&
          JSON.stringify(new Date(value)) === JSON.stringify(value)) {
          return new Date(value);
        }


        return value;
      });
      if (skipDefaultValues === true) {
        const knownJson = (this.__getNewInstance()).toJSON(opt);
        const removeSame = (obj: Record<string, any>, ref: Record<string, any>) => {
          if (typeof obj === 'undefined' || typeof ref === 'undefined') {
            return;
          }
          const isArr = Array.isArray(obj);
          const remove = (key: string | number) => {
            if (isArr) {
              (obj as unknown[]).splice(key as number, 1);
            }
            delete obj[key];
          };

          for (const key of Object.keys(obj).reverse()) { // make sure it also works for arrays
            if (typeof ref[key] === 'undefined') {
              continue;
            }
            if (obj[key] === ref[key]) {
              remove(key);
              continue;
            }
            if (typeof obj[key] === 'object') {
              removeSame(obj[key], ref[key]);
              if (Object.keys(obj[key]).length === 0) {
                remove(key);
              }
            }
          }
        };
        removeSame(jsonRet, knownJson);
      }
      return jsonRet;
    }

    __getFulName(property: string, separator = '.'): string {
      return (this.__propPath ? this.__propPath + '.' + property : property).replace(new RegExp('\\.', 'gm'), separator);
    }


    /**
     * Hard default is the default from the implementation itself,
     * before any default value override
     */
    __getHardDefault(): Record<PropertyKey, unknown> {
      const m: Record<PropertyKey, unknown> = {};
      Object.keys(this.__state).forEach(k => {
        const d = this.__getPropertyHardDefault(k);
        if (typeof d !== 'undefined') {
          m[k] = this.__getPropertyHardDefault(k);
        }
      });
      return m;
    }

    /**
     * Hard default is the default from the implementation itself,
     * before any default value override
     */
    __getPropertyHardDefault(property: string): unknown {
      if (!this.__state[property]) {
        return;
      }
      if (this.__state[property]?.hardDefault) {
        if (this.__state[property].hardDefault.__getDefault) {
          return this.__state[property].hardDefault.__getHardDefault();
        }
        if (Array.isArray(this.__state[property].hardDefault)) {
          const a = [];
          for (let i = 0; i < this.__state[property].hardDefault.length; ++i) {
            if (this.__state[property].hardDefault[i].__getDefault) {
              a.push(this.__state[property].hardDefault[i].__getHardDefault());
            } else {
              a.push(this.__state[property].hardDefault?.[i]);
            }
          }
          return a;
        }
      }
      return this.__state[property].hardDefault;
    }

    __getDefault(): Record<PropertyKey, unknown> {
      const m: Record<PropertyKey, unknown> = {};
      Object.keys(this.__state).forEach(k => m[k] = this.__getPropertyDefault(k));
      return m;
    }

    __getPropertyDefault(property: string): unknown {
      if (!this.__state[property]) {
        throw new Error('Unknown property "' + property + '"');
      }
      if (this.__state[property]?.value) {
        if (this.__state[property].value.__getDefault) {
          return this.__state[property].value.__getDefault();
        }
        if (Array.isArray(this.__state[property].value)) {
          const a = [];
          for (let i = 0; i < this.__state[property].value.length; ++i) {
            if (this.__state[property].value[i].__getDefault) {
              a.push(this.__state[property].value[i].__getDefault());
            } else {
              a.push(this.__state[property].default?.[i]);
            }
          }
          return a;
        }
      }
      return this.__state[property].default;
    }


    __isDefault(): boolean {
      for (const property of Object.keys(this.__state)) {
        if (!this.__isPropertyDefault(property)) {
          return false;
        }
      }
      return true;
    }

    __isPropertyDefault(property: string): boolean {
      if (!this.__state[property]) {
        throw new Error('Unknown property "' + property + '"');
      }
      if (this.__state[property]?.value) {
        if (this.__state[property].value.__isDefault) {
          return this.__state[property].value.__isDefault();
        }
        if (Array.isArray(this.__state[property].value)) {
          for (let i = 0; i < this.__state[property].value.length; ++i) {
            if (this.__state[property].value[i].__isDefault && !this.__state[property].value[i].__isDefault()) {
              return false;
            } else if (this.__state[property].default?.[i] !== this.__state[property].value) {
              return false;
            }
          }
          return true;
        }
      }
      return this.__state[property].default === this.__state[property].value;
    }

    __getLongestOptionName(printENVAlias: boolean): number {

      let max = 0;

      for (const key of Object.keys(this.__state)) {
        const state = this.__state[key];
        const value = this.__state[key].value;
        if (state.volatile === true) {
          continue;
        }

        max = Math.max(max, this.__getFulName(key).length);
        if (printENVAlias && typeof state.envAlias !== 'undefined') {
          max = Math.max(max, state.envAlias.length);

        }
        if (value && typeof value.__getLongestOptionName === 'function') {
          max = Math.max(max, value.__getLongestOptionName());
        }
      }
      return max;
    }


    ___printOption(prefix: string, printENVAlias: boolean, longestName: number = 0): string {
      let ret = '';
      const padding = '  ';
      // get longest switch name
      longestName = Math.max(longestName, this.__getLongestOptionName(printENVAlias));

      for (const key of Object.keys(this.__state)) {
        const state = this.__state[key];
        const value = this.__state[key].value;
        if (state.volatile === true) {
          continue;
        }

        if (value && typeof value.___printOption === 'function') {
          ret += value.___printOption(prefix, printENVAlias, longestName);
          continue;
        }

        let def = this.__defaults[key];
        if (Utils.isEnum(this.__state[key].type) && typeof def !== 'undefined') {
          def = (<any>this.__state[key].type)[this.__defaults[key]];
        }
        if (typeof def === 'string') {
          def = '\'' + def + '\'';
        }
        if (typeof def === 'object') {
          def = JSON.stringify(def);
        }
        ret += padding + prefix + this.__getFulName(key, '-').padEnd(longestName + prefix.length + padding.length);
        if (this.__state[key].description) {
          ret += this.__state[key].description;
        }
        if (typeof def !== 'undefined') {
          ret += ' (default: ' + def + ')';
        }
        ret += '\n';
        if (typeof this.__state[key].envAlias !== 'undefined' && printENVAlias === true) {
          ret += padding + this.__state[key].envAlias.padEnd(longestName + prefix.length + padding.length) +
            ' same as ' + prefix + this.__getFulName(key, '-') + '\n';
        }
      }
      return ret;
    }

  };
}
