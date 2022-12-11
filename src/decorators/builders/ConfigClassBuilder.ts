import {IConfigClass, IConfigClassPrivate} from '../class/IConfigClass';

/**
 * This class is a syntactic helper to do the dynamic casting for typescript, so intellisense properly works with the decorators
 */
export class ConfigClassBuilder {
  public static build<TAGS, T>(ctor: new (...args: any[]) => T, ...args: any[]): IConfigClass<TAGS> & T {
    return <any>new ctor(args);
  }

  public static attachInterface<TAGS, T>(cfg: T): IConfigClass<TAGS> & T {
    return <any>cfg;
  }

  public static buildPrivate<TAGS, T>(ctor: new (...args: any[]) => T, ...args: any[]): IConfigClassPrivate<TAGS> & T {
    return <any>new ctor(args);
  }

  public static attachPrivateInterface<TAGS, T>(cfg: T): IConfigClassPrivate<TAGS> & T {
    return <any>cfg;
  }
}
