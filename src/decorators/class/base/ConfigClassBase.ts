import {IConfigClassPrivateBase, ToJSONOptions} from './IConfigClassBase';
import {Enum, IPropertyMetadata, propertyTypes} from '../../property/IPropertyState';
import {ConstraintError} from '../../exceptions/ConstraintError';
import {Utils} from '../../../Utils';
import {Loader} from '../../../Loader';
import {SubClassOptions} from '../SubClassOptions';


export function ConfigClassBase(constructorFunction: new (...args: any[]) => any, options: SubClassOptions) {
  if (typeof options === 'undefined') {
    throw new Error('options not set');
  }
  return class ConfigClassBaseType extends constructorFunction implements IConfigClassPrivateBase {
    __state: { [key: string]: IPropertyMetadata<any, any> };
    __defaults: { [key: string]: any } = {};
    __values: { [key: string]: any };
    __rootConfig: ConfigClassBaseType;
    __propPath = '';
    __created = false;

    constructor(...args: any[]) {
      super(...args);
      this.__state = this.__state || {};
      this.__values = this.__values || {};

      for (const key of Object.keys(this.__values)) {
        if (typeof this.__values[key] === 'undefined') {
          continue;
        }
        this.__defaults[key] = this.__values[key];
        if (this.__values[key] &&
          typeof this.__values[key].__defaults !== 'undefined') {
          this.__defaults[key] = this.__values[key].__defaults;
        }
      }
      this.__created = true;
    }

    get __options(): SubClassOptions {
      return options;
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

    __loadStateJSONObject(sourceObject: { [key: string]: { readonly?: boolean } | any }): void {
      if (sourceObject === null || typeof sourceObject === 'undefined') {
        return;
      }
      Object.keys(sourceObject).forEach((key) => {
        if (typeof this.__state[key] === 'undefined') {
          return;
        }
        if (this.__values[key] &&
          typeof this.__values[key].__loadStateJSONObject !== 'undefined') {
          this[key].__loadStateJSONObject(sourceObject[key]);
          return;
        }
        if (sourceObject[key].readonly) {
          this.__state[key].readonly = sourceObject[key].readonly;
        }
      });
    }

    __loadDefaultsJSONObject(sourceObject: { [key: string]: any }): void {
      Loader.loadObject(this.__defaults, sourceObject);
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
        if (this.__state[key].type === Array) {
          if (this.__values[key] !== sourceObject[key]) {
            this[key] = sourceObject[key];
            changed = true;
          }

        } else if (this.__values[key] &&
          typeof this.__values[key].__loadJSONObject !== 'undefined') {
          changed = this[key].__loadJSONObject(sourceObject[key]) || changed;

        } else if (this.__values[key] && // unknown object
          this.__state[key].type === Object) {
          this[key] = sourceObject[key];
          changed = true;

        } else if (this.__values[key] !== sourceObject[key]) {
          this[key] = sourceObject[key];
          changed = true;
        }

        if (setToReadonly === true && options.disableAutoReadonly !== true) {
          this.__state[key].readonly = true;
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

        if (this.__values[key] !== null &&
          typeof this.__values[key] !== 'undefined' &&
          typeof this.__values[key].__getENVAliases !== 'undefined') {
          ret = ret.concat(this.__values[key].__getENVAliases());
        }
      }
      return ret;
    }

    __setParentConfig(propertyPath: string, rootConf: ConfigClassBaseType): void {
      this.__rootConfig = rootConf;
      this.__propPath = propertyPath;
      for (const key of Object.keys(this.__state)) {
        if (this.__values[key] === null ||
          typeof this.__values[key] === 'undefined' ||
          typeof this.__values[key].__setParentConfig === 'undefined') {
          continue;
        }
        const propPath = propertyPath.length > 0 ? (propertyPath + '.' + key) : key;
        this.__values[key].__setParentConfig(propPath, this.__rootConfig);
      }
    }

    __validateAll(exceptionStack?: string[]): void {
      for (const key of Object.keys(this.__state)) {
        this.__validate(key, this.__values[key], this.__state[key].type, exceptionStack);
        if (this.__values[key] && this.__values[key].__validateAll) {
          this.__values[key].__validateAll(exceptionStack);
        }
      }
    }

    __setAndValidateFromRoot<T>(property: string, newValue: T): void {
      // during setting default value, this variable is not exist yet
      this.__values = this.__values || {};
      if (this.__values[property] === newValue) {
        return;
      }

      // skip readonly if we are setting the default value
      if (this.__state[property].readonly === true && this.__created === true) {
        throw new Error(property + ' is readonly');
      }
      this.__values[property] = newValue;
      if (this.__rootConfig) { // while sub config default value set, the root conf is not available yet.

        if (typeof this.__state[property].onNewValue !== 'undefined') {
          this.__state[property].onNewValue(this.__values[property], this.__rootConfig);
        }

        const exceptionStack: string[] = [];
        this.__rootConfig.__validateAll(exceptionStack);
        if (exceptionStack.length > 0) {
          throw new ConstraintError(exceptionStack.join(', '));
        }

      }
    }

    __validate<T>(property: string, newValue: T, _type?: propertyTypes, exceptionStack?: string[]): any {
      if (typeof this.__rootConfig === 'undefined') {
        return newValue;
      }
      newValue = this.__validateType(property, newValue, _type);
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
     * @param _type
     * @private
     */
    __validateType<T>(property: string, newValue: T, _type?: propertyTypes): any {
      if (typeof newValue === 'undefined' || newValue == null) {
        return newValue;
      }
      const propState = this.__state[property];
      const type = typeof _type !== 'undefined' ? _type :
        (propState.typeBuilder ? propState.typeBuilder(newValue, this.__rootConfig) :
          propState.type);

      const strValue = String(newValue);
      let floatValue = NaN;
      if (parseFloat(strValue).toString() === strValue) {
        floatValue = parseFloat(strValue);
      }
      let intValue = NaN;
      if (parseInt(strValue, 10).toString() === strValue) {
        intValue = parseInt(strValue, 10);
      }

      switch (type) {
        case String:
          return strValue;
        case Number:
          return floatValue;
        case Date:
          if (typeof intValue === 'undefined' && isNaN(Date.parse(<any>newValue))) {
            throw new TypeError(this.__getFulName(property) + ' should be a Date, got:' + newValue);
          }
          return new Date(<any>newValue);
        case Boolean:
          if (strValue.toLowerCase() === 'false' || <any>newValue === false) {
            return false;
          }
          if (strValue.toLowerCase() === 'true' || <any>newValue === true) {
            return true;
          }
          throw new TypeError(this.__getFulName(property) + ' should be a boolean');
        case Array:
          if (!Array.isArray(newValue)) {
            throw new TypeError(this.__getFulName(property) + ' should be an array');
          }
          if (propState.arrayType !== Array) {
            for (let i = 0; i < newValue.length; ++i) {
              const t = propState.arrayTypeBuilder ? propState.arrayTypeBuilder(newValue[i], this.__rootConfig) :
                (propState.arrayType ? propState.arrayType : null);
              newValue[i] = this.__validate(property, newValue[i], t);
            }
          }
          return newValue;
        case 'integer':
          if (intValue !== floatValue) {
            throw new TypeError('Value should be an integer, got: ' + newValue);
          }
          return intValue;
        case 'ratio':
          if (floatValue < 0 || floatValue > 1) {
            throw new TypeError('Value should be an ratio, got: ' + newValue);
          }
          return floatValue;
        case 'unsignedInt':
          if (intValue !== floatValue || intValue < 0) {
            throw new TypeError('Value should be an unsigned integer, got: ' + newValue);
          }
          return intValue;

        case 'positiveFloat':
          if (floatValue < 0) {
            throw new TypeError('Value should be an positive float, got: ' + newValue);
          }
          return floatValue;
      }
      if (Utils.isEnum(type)) {
        if (Number.isInteger(intValue) && typeof (<Enum>type)[intValue] !== 'undefined') {
          return intValue;
        }
        if (typeof newValue === 'string' && typeof (<Enum>type)[strValue] === 'number') {
          return (<Enum>type)[strValue];
        }
        throw new TypeError(this.__getFulName(property) + ' should be an Enum from values: ' + Object.keys(type) + ', got: ' + newValue);
      }

      if (ConfigClassBaseType.isConfigClassBaseCtor(type) && !ConfigClassBaseType.isConfigClassBase(newValue)) {
        const o: ConfigClassBaseType = new (<any>type)();
        o.__loadJSONObject(newValue);
        newValue = <any>o;
      }


      return newValue;
    }


    toJSON(opt?: ToJSONOptions): { [key: string]: any } {
      opt = JSON.parse(JSON.stringify(typeof opt === 'object' ? opt : options));
      const ret: { [key: string]: any } = {};

      // Attach defaults
      if (opt.attachDefaults === true) {
        ret['__defaults'] = this.__defaults;
      }

      // Attach __state
      if (opt.attachState === true) {
        ret['__state'] = {};
        const loadState = (from: ConfigClassBaseType, to: any) => {
          for (const key of Object.keys(from.__state)) {
            if (typeof this.__state[key] === 'undefined') {
              continue;
            }
            to[key] = {};
            if (from.__state[key].readonly) {
              to[key] = {readonly: from.__state[key].readonly};
            }
            if (from.__values[key] &&
              typeof from.__values[key].__state !== 'undefined') {
              loadState(from.__values[key], to[key]);
            } else if (from.__defaults[key] &&
              typeof from.__defaults[key].__state !== 'undefined') {
              loadState(from.__defaults[key], to[key]);
            }
          }

        };
        loadState(this, ret['__state']);
      }


      opt.attachDefaults = false; // do not cascade defaults, root already knows it.
      opt.attachState = false; // do not cascade defaults, root already knows it.

      for (const key of Object.keys(this.__state)) {
        if (this.__state[key].volatile === true ||
          typeof this.__values[key] === 'undefined') {
          continue;
        }
        if (opt.attachDescription === true && typeof this.__state[key].description !== 'undefined') {
          ret['//[' + key + ']'] = this.__state[key].description;
        }

        const isConfigType = (value: any): boolean => {
          return value &&
            typeof value.toJSON !== 'undefined' &&
            typeof value.__defaults !== 'undefined';
        };

        // if ConfigClass type?
        if (isConfigType(this.__values[key])) {
          ret[key] = this.__values[key].toJSON(opt);
          continue;
        }

        if (Array.isArray(this.__values[key])) {
          ret[key] = this.__values[key].map((v: any) => {
            if (isConfigType(v)) {
              return v.toJSON(opt);
            }
            return v;
          });
          continue;
        }

        if (opt.enumsAsString === true && Utils.isEnum(this.__state[key].type)) {
          ret[key] = (<any>this.__state[key].type)[this.__values[key]];
        } else {
          ret[key] = this.__values[key];
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
        const value = this.__values[key];
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
        const value = this.__values[key];
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
