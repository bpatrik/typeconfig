import {IConfigClass, IConfigClassPrivate} from '../class/IConfigClass';

/**
 * This class is a syntactic helper to do the dynamic casting for typescript, so intellisense properly works with the decorators
 */
export class ConfigClassBuilder {
  public static build<T>(ctor: new (...args: any[]) => T, ...args: any[]): IConfigClass & T {
    return <any>new ctor(args);
  }

  public static attachInterface<T>(cfg: T):  IConfigClass & T  {
    return <any>cfg;
  }

  public static buildPrivate<T>(ctor: new (...args: any[]) => T, ...args: any[]): IConfigClassPrivate & T  {
    return <any>new ctor(args);
  }

  public static attachPrivateInterface<T>(cfg: T): IConfigClassPrivate & T  {
    return <any>cfg;
  }
}
