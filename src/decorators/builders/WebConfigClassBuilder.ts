import {IWebConfigClass, IWebConfigClassPrivate} from '../class/IWebConfigClass';

/**
 * This class is a syntactic helper to do the dynamic casting for typescript, so intellisense properly works with the decorators
 */
export class WebConfigClassBuilder {
  public static build<T>(ctor: new (...args: any[]) => T, ...args: any[]): IWebConfigClass & T {
    return <any>new ctor(args);
  }

  public static attachInterface<T>(cfg: T): IWebConfigClass & T {
    return <any>cfg;
  }

  public static buildPrivate<T>(ctor: new (...args: any[]) => T, ...args: any[]): IWebConfigClassPrivate & T {
    return <any>new ctor(args);
  }

  public static attachPrivateInterface<T>(cfg: T): IWebConfigClassPrivate & T {
    return <any>cfg;
  }
}
