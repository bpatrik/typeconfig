import {IConfigClass} from './IConfigClass';
import {Enum, IPropertyState, propertyTypes} from '../IPropertyState';
import {ConstraintError} from '../ConstraintError';
import {SubClassOptions} from './SubConfigClass';

export interface ToJSONOptions {
  attachDescription?: boolean;
  attachDefaults?: boolean;
}

export function ConfigClassFactory(constructorFunction: new (...args: any[]) => any, options: SubClassOptions = {}) {
  return class ConfigClass extends constructorFunction implements IConfigClass {
    __state: { [key: string]: IPropertyState<any> };
    __defaults: { [key: string]: any } = {};
    __rootConfig: ConfigClass;
    __propPath: string = '';

    constructor(...args: any[]) {
      super(...args);

      this.__defaults = this.__defaults || {};
      this.__state = this.__state || {};
      for (let key of Object.keys(this.__state)) {
        if (typeof this.__state[key].value === 'undefined') {
          continue;
        }
        this.__defaults[key] = this.__state[key].value;
        if (typeof this.__state[key].value.__defaults !== 'undefined') {
          this.__defaults[key] = this.__state[key].value.__defaults;
        }
      }
    }


    __getENVAliases(): { key: string, alias: string }[] {
      let ret: { key: string, alias: string }[] = [];
      for (const key of Object.keys(this.__state)) {
        if (typeof this.__state[key].envAlias !== 'undefined') {
          ret.push({
            key: this.__getFulName(key).replace(new RegExp('\\.','gm'),'-'),
            alias: this.__state[key].envAlias
          });
        }

        if (typeof this.__state[key].value !== 'undefined' &&
          typeof this.__state[key].value.__getENVAliases !== 'undefined') {
          ret = ret.concat(this.__state[key].value.__getENVAliases());
        }
      }
      return ret;
    }

    __setParentConfig(propertyPath: string, rootConf: ConfigClass): void {
      this.__rootConfig = rootConf;
      this.__propPath = propertyPath;
      for (const key of Object.keys(this.__state)) {
        if (typeof this.__state[key].value === 'undefined' ||
          typeof this.__state[key].value.__setParentConfig === 'undefined') {
          continue;
        }
        const propPath = this.propertyPath ? this.propertyPath + '.' + key : key;
        this.__state[key].value.__setParentConfig(propPath, this.__rootConfig);
      }
    }

    __validateAll(exceptionStack?: string[]): void {
      for (const key of Object.keys(this.__state)) {
        this.__validate(key, this.__state[key].value, this.__state[key].type, exceptionStack);
        if (this.__state[key].value && this.__state[key].value.__validateAll) {
          this.__state[key].value.__validateAll(exceptionStack);
        }
      }
    }

    __setAndValidateFromRoot<T>(property: string, newValue: T) {
      if (this.__state[property].value === newValue) {
        return;
      }
      this.__state[property].value = newValue;
      if (this.__rootConfig) { // while sub config default value set, the root conf is not available yet.
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

    __validateType<T>(property: string, newValue: T, _type?: propertyTypes): any {
      const propState = this.__state[property];
      const type = _type ? _type : propState.type;
      const strValue = String(newValue);
      let floatValue: number = NaN;
      if (parseFloat(strValue).toString() === strValue) {
        floatValue = parseFloat(strValue);
      }
      let intValue: number = NaN;
      if (parseInt(strValue).toString() === strValue) {
        intValue = parseInt(strValue);
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
              newValue[i] = this.__validate(property, newValue[i], propState.arrayType);
            }
          }
          return newValue;
        case 'integer':
          if (intValue != floatValue) {
            throw new TypeError('Value should be an integer, got: ' + newValue);
          }
          return intValue;
      }
      if (isEnum(type)) {
        if (Number.isInteger(intValue) && typeof (<Enum<any>>type)[intValue] !== 'undefined') {
          return intValue;
        }
        if (typeof newValue === 'string' && typeof (<Enum<any>>type)[strValue] === 'number') {
          return (<Enum<any>>type)[strValue];
        }
        throw new TypeError(this.__getFulName(property) + ' should be an Enum from values: ' + Object.keys(type));
      }
      return newValue;
    }

    toJSON(opt?: ToJSONOptions): { [key: string]: any } {
      opt = opt || options;
      const ret: { [key: string]: any } = {};
      if (opt.attachDefaults === true) {
        ret['__defaults'] = this.__defaults;
      }
      for (const key of Object.keys(this.__state)) {
        if (this.__state[key].volatile === true ||
          typeof this.__state[key].value === 'undefined') {
          continue;
        }
        if (opt.attachDescription === true && typeof this.__state[key].description !== 'undefined') {
          ret['//' + key] = this.__state[key].description;
        }
        // if ConfigClass type?
        if (typeof this.__state[key].value.toJSON !== 'undefined' &&
          typeof this.__state[key].value.__defaults !== 'undefined') {
          ret[key] = this.__state[key].value.toJSON();
          continue;
        }
        ret[key] = this.__state[key].value;

      }
      return ret;
    };

    __getFulName(property: string): string {
      return this.__propPath ? this.__propPath + '.' + property : property;
    }

    ___printMan(): string {
      let ret = '';
      for (const key of Object.keys(this.__state)) {
        if (this.__state[key].volatile === true) {
          continue;
        }
        ret += '--' + this.__getFulName(key) + '\t | \t default:' + this.__defaults[key] + '\t | \t ' + this.__state[key].description + '\n';
      }
      return ret;
    }


  };
}

export function isEnum(instance: Object): boolean {
  let keys = Object.keys(instance);
  if (keys.length === 0) {
    return false;
  }
  for (let key of keys) {
    let value = (<Enum<any>>instance)[key];
    switch (typeof value) {
      case 'number':
        if ((<Enum<any>>instance)[value.toString()] !== key) {
          return false;
        }
        break;
      case 'string':
        if (typeof (<Enum<any>>instance)[value] === 'undefined' || (<Enum<any>>instance)[value].toString() !== key) {
          return false;
        }
        break;
      default:
        return false;
    }

  }


  return true;
}
