import {IWebConfigClass, IWebConfigClassPrivate} from '../class/IWebConfigClass';

/**
 * This class is a syntactic helper to do the dynamic casting for typescript, so intellisense properly works with the decorators
 */
export class WebConfigClassBuilder {
  public static build<T, TAGS>(ctor: new (...args: any[]) => T, ...args: any[]): IWebConfigClass<TAGS> & T {
    return <any>new ctor(args);
  }

  public static attachInterface<T, TAGS>(cfg: T): IWebConfigClass<TAGS> & T {
    return <any>cfg;
  }

  public static buildPrivate<T, TAGS>(ctor: new (...args: any[]) => T, ...args: any[]): IWebConfigClassPrivate<TAGS> & T {
    return <any>new ctor(args);
  }

  public static attachPrivateInterface<T, TAGS>(cfg: T): IWebConfigClassPrivate<TAGS> & T {
    return <any>cfg;
  }
}
