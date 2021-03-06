import {IConfigClassPrivateBase, ToJSONOptions} from './IConfigClassBase';
import {Enum, IPropertyMetadata, propertyTypes} from '../../property/IPropertyState';
import {ConstraintError} from '../../exceptions/ConstraintError';
import {Utils} from '../../../Utils';
import {SubClassOptions} from '../SubClassOptions';
import {Loader} from '../../../Loader';


export function ConfigClassBase(constructorFunction: new (...args: any[]) => any, options: SubClassOptions) {
  if (typeof options === 'undefined') {
    throw new Error('options not set');
  }
  return class ConfigClassBaseType extends constructorFunction implements IConfigClassPrivateBase {
    __state: { [key: string]: IPropertyMetadata<any, any> };
    __rootConfig: ConfigClassBaseType;
    __propPath = '';
    __created = false;

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

      for (const key of Object.keys(this.__state)) {
        if (typeof this.__state[key].value === 'undefined') {
          continue;
        }
        this.__state[key].default = this.__state[key].value;
        if (this.__state[key].value &&
          typeof this.__state[key].value.__defaults !== 'undefined') {
          this.__state[key].default = this.__state[key].value.__defaults;
        }
      }
      this.__created = true;
    }

    get __options(): SubClassOptions {
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

    __loadStateJSONObject(sourceObject: { [key: string]: IPropertyMetadata<any, any> | any }): void {
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


    __loadJSONObject(sourceObject: { [key: string]: any }, setToReadonly: boolean = false): boolean {
      let changed = false;
      if (sourceObject === null || typeof sourceObject === 'undefined') {
        return false;
      }
      Object.keys(sourceObject).forEach((key) => {
        if (typeof this.__state[key] === 'undefined') {
          return;
        }

        const set = () => {
          this[key] = sourceObject[key];
          changed = true;
          if (setToReadonly === true && options.disableAutoReadonly !== true) {
            this.__state[key].readonly = true;
          }
        };

        if (this.__state[key].type === 'array') {
          if (this.__state[key].value !== sourceObject[key]) {
            set();
          }

        } else if (this.__state[key].value &&
          typeof this.__state[key].value.__loadJSONObject !== 'undefined') {
          changed = this[key].__loadJSONObject(sourceObject[key], setToReadonly) || changed;

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

    __setParentConfig(propertyPath: string, rootConf: ConfigClassBaseType): void {
      this.__rootConfig = rootConf;
      this.__propPath = propertyPath;
      for (const key of Object.keys(this.__state)) {
        if (this.__state[key].value === null ||
          typeof this.__state[key].value === 'undefined' ||
          typeof this.__state[key].value.__setParentConfig === 'undefined') {
          continue;
        }
        const propPath = this.__propPath.length > 0 ? (this.__propPath + '.' + key) : key;
        this.__state[key].value.__setParentConfig(propPath, this.__rootConfig);
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
              const t = propState.arrayTypeBuilder ? propState.arrayTypeBuilder(newValue[i], this.__rootConfig) :
                (propState.arrayType ? propState.arrayType : null);
              tmpNewValue[i] = this.__validate(property, newValue[i], {
                type: t,
                isEnumType: propState.isEnumArrayType,
                isConfigType: propState.isConfigArrayType
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

      if (isConfigType === true && propState.value &&
        typeof propState.value.__loadJSONObject !== 'undefined') {
        propState.value.__loadJSONObject(newValue);
        return propState.value;
      }

      if (isConfigType === true && !ConfigClassBaseType.isConfigClassBase(newValue)) {
        const o: ConfigClassBaseType = new (<any>type)();
        const propPath = this.__propPath.length > 0 ? (this.__propPath + '.' + property) : property;
        o.__setParentConfig(propPath, this.__rootConfig);
        o.__loadJSONObject(newValue);
        return o;
      }


      return newValue;
    }


    toJSON(opt?: ToJSONOptions): { [key: string]: any } {
      opt = JSON.parse(JSON.stringify(typeof opt === 'object' ? opt : options));
      const ret: { [key: string]: any } = {};

      // Attach __state
      if (opt.attachState === true) {
        ret['__state'] = {};
        const loadState = (from: ConfigClassBaseType, to: any) => {
          for (const key of Object.keys(from.__state)) {
            if (typeof from.__state[key] === 'undefined') {
              continue;
            }
            to[key] = {};
            if (from.__state[key].value &&
              typeof from.__state[key].value.__state !== 'undefined') {
              loadState(from.__state[key].value, to[key]);
            } else if (from.__state[key].default &&
              typeof from.__state[key].default.__state !== 'undefined') {
              loadState(from.__state[key].default, to[key]);
            } else {
              const {
                value, type, arrayType,
                typeBuilder, arrayTypeBuilder, onNewValue,
                isConfigType, isEnumType, isEnumArrayType, isConfigArrayType,
                constraint, envAlias, description, ...noValue
              } = from.__state[key];
              to[key] = noValue;
            }
          }

        };
        loadState(this, ret['__state']);
      }


      opt.attachState = false; // do not cascade defaults, root already knows it.

      for (const key of Object.keys(this.__state)) {
        if ((this.__state[key].volatile === true && opt.attachVolatile !== true) ||
          typeof this.__state[key].value === 'undefined') {
          continue;
        }
        if (opt.attachDescription === true && typeof this.__state[key].description !== 'undefined') {
          ret['//[' + key + ']'] = this.__state[key].description;
        }


        // if ConfigClass type?
        if (this.__state[key].isConfigType === true && this.__state[key].value) {
          ret[key] = this.__state[key].value.toJSON(opt);
          continue;
        }

        if (Array.isArray(this.__state[key].value)) {
          ret[key] = this.__state[key].value.map((v: any) => {
            if (this.__state[key].isConfigArrayType === true) {
              return v.toJSON(opt);
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
      return ret;
    }

    __getFulName(property: string, separator = '.'): string {
      return (this.__propPath ? this.__propPath + '.' + property : property).replace(new RegExp('\\.', 'gm'), separator);
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
