export class Loader {

  public static flatToObjHierarchy(vars: { [key: string]: any }) {
    const cliArgsObj = {};

    Object.keys(vars).forEach((key) => {
      const keyArray = key.split('-');
      const value = vars[key];

      // recursive settings
      const setObject = (object: { [key: string]: any }, keyArr: string[], val: any): void => {
        const k = keyArr.shift();
        object[k] = object[k] || {};

        if (keyArr.length === 0) {
          // convert to boolean
          if (val.toLowerCase && val.toLowerCase() === 'false') {
            val = false;
          }
          if (val.toLowerCase && val.toLowerCase() === 'true') {
            val = true;
          }

          object[k] = val;
          return;
        }

        return setObject(object[k], keyArr, val);
      };
      setObject(cliArgsObj, keyArray, value);
    });
    return cliArgsObj;
  }

  public static processHierarchyVar(configObject: { [key: string]: any }, vars: { [key: string]: any }): boolean {
    return this.loadObject(configObject, Loader.flatToObjHierarchy(vars));
  }

  public static loadObject(targetObject: { [key: string]: any }, sourceObject: { [key: string]: any }): boolean {
    let changed = false;
    Object.keys(sourceObject).forEach((key) => {
      if (typeof targetObject[key] === 'undefined') {
        return;
      }
      if (Array.isArray(targetObject[key])) {
        if (targetObject[key] !== sourceObject[key]) {
          targetObject[key] = sourceObject[key];
          changed = true;
        }
        return;
      }
      if (typeof targetObject[key] === 'object' && targetObject[key] != null) {
        changed = this.loadObject(targetObject[key], sourceObject[key]) || changed;
        return;
      }

      if (targetObject[key] !== sourceObject[key]) {
        targetObject[key] = sourceObject[key];
        changed = true;
      }
      return;
    });
    return changed;
  }
}
