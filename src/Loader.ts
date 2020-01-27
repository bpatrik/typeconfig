export class Loader {

  public static flatToObjHierarchy(vars: { [key: string]: any }) {
    const cliArgsObj = {};

    Object.keys(vars).forEach((key) => {
      const keyArray = key.split('-');
      const value = vars[key];

      //recursive settings
      const setObject = (object: { [key: string]: any }, keyArray: string[], value: any): void => {
        let key = keyArray.shift();
        object[key] = object[key] || {};

        if (keyArray.length == 0) {
          //convert to boolean
          if (value.toLowerCase && value.toLowerCase() === 'false') {
            value = false;
          }
          if (value.toLowerCase && value.toLowerCase() === 'true') {
            value = true;
          }

          object[key] = value;
          return;
        }

        return setObject(object[key], keyArray, value);
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
        if (targetObject[key] != sourceObject[key]) {
          targetObject[key] = sourceObject[key];
          changed = true;
        }
        return;
      }
      if (typeof targetObject[key] === 'object' && targetObject[key] != null) {
        changed = this.loadObject(targetObject[key], sourceObject[key]) || changed;
        return;
      }

      if (targetObject[key] != sourceObject[key]) {
        targetObject[key] = sourceObject[key];
        changed = true;
      }
      return;
    });
    return changed;
  }
}
