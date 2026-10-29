import 'reflect-metadata';
import {ConfigProperty} from '../../src/decorators/property/ConfigPropoerty.js';
import {WebConfigClass} from '../../src/decorators/class/WebConfigClass.js';
import {WebConfigClassBuilder} from '../../src/decorators/builders/WebConfigClassBuilder.js';
import {SubConfigClass} from '../../src/decorators/class/SubConfigClass.js';
import {IConfigClassPrivateBase} from '../../src/decorators/class/base/IConfigClassBase.js';

import * as chaiModule from 'chai';

const chai: any = chaiModule;
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);

describe('WebConfigClass', () => {


  describe('should load', () => {

    it('should load', async () => {

      @WebConfigClass()
      class C {
        @ConfigProperty()
        num: number = 10;
      }

      const c = WebConfigClassBuilder.attachPrivateInterface(new C());
      chai.expect(c.toJSON()).to.deep.equal({num: 10});
      c.load({num: 7});
      chai.expect(c.toJSON()).to.deep.equal({num: 7});

    });
    it('should load defaults', async () => {

      @WebConfigClass()
      class C {
        @ConfigProperty()
        num: number = 10;
      }

      const c = WebConfigClassBuilder.attachPrivateInterface(new C());
      chai.expect(c.toJSON({attachState: true})).to.deep.equal({__state: {num: {default: 10}}, num: 10});
      c.load({num: 7});
      chai.expect(c.toJSON({attachState: true})).to.deep.equal({__state: {num: {default: 10}}, num: 7});
      c.load({__state: {num: {default: 15}}, num: 7});
      chai.expect(c.toJSON({attachState: true})).to.deep.equal({__state: {num: {default: 15}}, num: 7});

    });

    it('should load readonly', async () => {

      @WebConfigClass()
      class C {
        @ConfigProperty()
        num: number = 10;
      }

      const c = WebConfigClassBuilder.attachPrivateInterface(new C());
      chai.expect(c.toJSON({attachState: true})).to.deep.equal({__state: {num: {default: 10}}, num: 10});
      c.load({__state: {num: {readonly: true}}, num: 7});
      chai.expect(c.toJSON({attachState: true})).to.deep.equal({__state: {num: {default: 10, readonly: true}}, num: 7});

      chai.expect(() => {
        c.num = 11;
      }).to.throw(Error, 'readonly');
    });

    it('should load url params', async () => {

      @WebConfigClass({loadQueryOptions: true})
      class C {
        @ConfigProperty()
        num: number = 10;
      }

      const g = globalThis as { window?: unknown };
      const originalWindow = g.window;
      g.window = {location: {search: '?num=12'}};
      try {
        const c = WebConfigClassBuilder.attachPrivateInterface(new C());
        c.load({num: 7});
        chai.expect(c.toJSON()).to.deep.equal({num: 12});
      } finally {
        g.window = originalWindow;
      }
    });

    it('should not load irrelevat', async () => {

      @WebConfigClass()
      class C {
        @ConfigProperty()
        num: number = 10;
      }

      const c = WebConfigClassBuilder.attachPrivateInterface(new C());
      c.load({num2: 7});
      chai.expect(c.toJSON()).to.deep.equal({num: 10});

    });
    it('should load subconfig array as config obj', async () => {

      @SubConfigClass()
      class SA {
        @ConfigProperty()
        num: number = 5;

        @ConfigProperty()
        num2: number;

        constructor(n?: number) {
          this.num = n;
        }
      }

      @WebConfigClass()
      class S {
        @ConfigProperty({arrayType: SA})
        arr: SA[] = [];
      }

      @WebConfigClass()
      class C {
        @ConfigProperty()
        sub: S = new S();
      }

      const c = WebConfigClassBuilder.attachPrivateInterface(new C());
      chai.expect(c.toJSON()).to.deep.equal({sub: {arr: []}});
      c.load({sub: {arr: [{num: 1}, {num2: 2}]}});
      chai.expect((c.sub.arr[1] as any).toJSON({attachState: true})).to.deep.equal({
        __state: {num: {}, num2: {}}, num2: 2
      });
      c.sub.arr[1].num2 = 10;
      chai.expect((c.sub.arr[1] as any).toJSON({attachState: true})).to.deep.equal({
        __state: {num: {}, num2: {}}, num2: 10
      });
      chai.expect((c.sub.arr[1] as any).toJSON({attachState: true})).to.deep.equal({
        __state: {num: {}, num2: {}}, num2: 10
      });

    });

    it('should load sub config defaults', async () => {

      @SubConfigClass()
      class S {
        @ConfigProperty()
        num: number = 5;
      }

      @WebConfigClass()
      class C {
        @ConfigProperty()
        sub: S = new S();
      }

      const c = WebConfigClassBuilder.attachPrivateInterface(new C());
      chai.expect(c.toJSON({attachState: true})).to.deep.equal({__state: {sub: {num: {default: 5}}}, sub: {num: 5}});
      c.load({sub: {num: 99}});
      chai.expect(c.toJSON({attachState: true})).to.deep.equal({__state: {sub: {num: {default: 5}}}, sub: {num: 99}});
      c.load({__state: {sub: {num: {default: 77, readonly: true}}}, sub: {num: 66}});
      chai.expect(c.toJSON({attachState: true})).to.deep.equal({__state: {sub: {num: {default: 77, readonly: true}}}, sub: {num: 66}});

    });
  });


  describe('should clone', () => {

    it('config', async () => {

      @SubConfigClass()
      class S {

        @ConfigProperty()
        num: number = 5;

      }

      @WebConfigClass()
      class C {
        @ConfigProperty()
        sub: S = new S();
      }


      const c = WebConfigClassBuilder.attachPrivateInterface(new C());
      chai.expect(c.clone().toJSON()).to.deep.equal(c.toJSON());
      chai.expect(c.clone().toJSON({attachState: true})).to.deep.equal(c.toJSON({attachState: true}));
      c.load({sub: {num: 99}});
      chai.expect(c.clone().toJSON({attachState: true})).to.deep.equal(c.toJSON({attachState: true}));
      c.load({__state: {sub: {num: {default: 77, readonly: true}}}, sub: {num: 66}});
      chai.expect(c.clone().toJSON({attachState: true})).to.deep.equal(c.toJSON({attachState: true}));
      chai.expect(c.clone<C>().sub.num).to.equal(66);
    });

    it('subconfig array as config obj', async () => {

      @SubConfigClass()
      class SA {
        @ConfigProperty()
        num: number = 5;

        @ConfigProperty()
        num2: number;

        constructor(n?: number) {
          this.num = n;
        }
      }

      @WebConfigClass()
      class S {
        @ConfigProperty({arrayType: SA})
        arr: SA[] = [];
      }

      @WebConfigClass()
      class C {
        @ConfigProperty()
        sub: S = new S();
      }

      const _c = WebConfigClassBuilder.attachPrivateInterface(new C());
      _c.load({sub: {arr: [{num: 1}, {num2: 2}]}});
      const c = (_c.clone<C>() as (C & IConfigClassPrivateBase<C>));
      chai.expect((c.sub.arr[1] as any).toJSON({attachState: true})).to.deep.equal({
        __state: {num: {}, num2: {}}, num2: 2
      });
      c.sub.arr[1].num2 = 10;
      chai.expect((c.sub.arr[1] as any).toJSON({attachState: true})).to.deep.equal({
        __state: {num: {}, num2: {}}, num2: 10
      });
      chai.expect((c.clone<C>().sub.arr[1] as any).toJSON({attachState: true})).to.deep.equal({
        __state: {num: {}, num2: {}}, num2: 10
      });

    });
  });


});
