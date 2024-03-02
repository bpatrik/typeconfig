/* tslint:disable:no-inferrable-types */
import 'reflect-metadata';
import {ConfigClass} from '../src/decorators/class/ConfigClass';
import {ConfigProperty} from '../src/decorators/property/ConfigPropoerty';
import {ConfigClassBuilder} from '../src/decorators/builders/ConfigClassBuilder';
import {SubConfigClass} from '../src/decorators/class/SubConfigClass';
import {GenericConfigType} from '../src/GenericConfigType';
import {WebConfigClassBuilder} from '../src/decorators/builders/WebConfigClassBuilder';
import {WebConfigClass} from '../src/decorators/class/WebConfigClass';
import {TestHelper} from './TestHelper';
import {promises as fsp} from 'fs';

const chai: any = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

describe('GenericConfigType', () => {

  it('should update through json load', () => {
    @SubConfigClass()
    class Sub {
      @ConfigProperty()
      b: string = 'inner string';
    }

    @ConfigClass()
    class C {
      @ConfigProperty()
      a: number = 3;

      @ConfigProperty({type: GenericConfigType})
      inner: GenericConfigType;
    }

    @WebConfigClass()
    class WC {
      @ConfigProperty()
      a: number = 3;
      @ConfigProperty({type: GenericConfigType})
      inner: GenericConfigType;
    }

    const c = ConfigClassBuilder.attachPrivateInterface(new C());
    c.loadSync();
    chai.expect(c.a).to.deep.equal(3);
    chai.expect(c.__isDefault()).to.deep.equal(true);

    c.inner = new Sub();
    chai.expect((c.inner as Sub).b).to.deep.equal('inner string');

    const wc = WebConfigClassBuilder.attachPrivateInterface(new WC());
    chai.expect(wc.a).to.deep.equal(3);
    // tslint:disable-next-line:no-unused-expression
    chai.expect((wc.inner as Sub)).to.be.undefined;

    wc.load(JSON.parse(JSON.stringify(c.toJSON({attachState: true}))));
    chai.expect(wc.a).to.deep.equal(3);
    chai.expect((wc.inner as Sub).b).to.deep.equal('inner string');

    c.a = 10;
    (c.inner as Sub).b = 'test';
    wc.load(JSON.parse(JSON.stringify(c.toJSON({attachState: true}))));
    chai.expect(wc.a).to.deep.equal(10);
    chai.expect((wc.inner as Sub).b).to.deep.equal('test');
  });

  it('should use setter getter properly', () => {

    @SubConfigClass()
    class Sub {
      @ConfigProperty()
      b: string = 'inner string';
    }


    @ConfigClass()
    class C {

      @ConfigProperty()
      a: number = 3;

      @ConfigProperty({type: GenericConfigType})
      inner: GenericConfigType;
    }


    @WebConfigClass()
    class WC {
      @ConfigProperty()
      a: number = 3;

      @ConfigProperty({type: GenericConfigType})
      inner: GenericConfigType;
    }

    const c = ConfigClassBuilder.attachPrivateInterface(new C());
    c.loadSync();
    c.inner = new Sub();
    c.a = 10;
    (c.inner as Sub).b = 'test';

    const wc = WebConfigClassBuilder.attachPrivateInterface(new WC());
    wc.load(JSON.parse(JSON.stringify(c.toJSON({attachState: true}))));
    chai.expect(wc.__state['a'].value).to.deep.equal(10);
    chai.expect((wc.inner as any).__state['b']?.value).to.deep.equal('test');
    chai.expect((wc.inner as any).b).to.deep.equal('test');
  });


  it('should load sub sub GenericConfigType properly from direct assignment', () => {

    @SubConfigClass()
    class SubSub1 {
      @ConfigProperty({
        tags: {
          testTag: 'my value'
        },
        description: 'just a description'
      })
      c: string = 'SubSub string';
    }

    @SubConfigClass()
    class SubSub2 {
      @ConfigProperty({
        tags: {
          testTag: 'my value'
        },
        description: 'just a description'
      })
      c2: string = 'SubSub2 string';
    }


    @SubConfigClass()
    class Sub {
      @ConfigProperty()
      b: string = 'Sub string';

      @ConfigProperty({type: GenericConfigType})
      sub: GenericConfigType;
    }


    @SubConfigClass()
    class Main {

      @ConfigProperty({arrayType: Sub})
      arr: Sub[] = [];
    }

    @ConfigClass()
    class C {

      @ConfigProperty()
      a: number = 3;

      @ConfigProperty({type: Main})
      main: Main = new Main();
    }

    const c = ConfigClassBuilder.attachPrivateInterface(new C());
    c.loadSync();

    c.main.arr.push(new Sub());
    c.main.arr.push(new Sub());
    c.main.arr[0].sub = new SubSub1();
    c.main.arr[1].sub = new SubSub2();

    chai.expect(c.toJSON()).to.deep.equal({
      a: 3,
      main: {
        arr: [
          {b: 'Sub string', sub: {c: 'SubSub string'}},
          {b: 'Sub string', sub: {c2: 'SubSub2 string'}}
        ]
      }
    });

    c.main = {
      arr: [
        {b: 'test1', sub: {c: 'new SubSub string'}},
        {b: 'test2', sub: {c2: 'new SubSub2 string'}}
      ]
    };

    chai.expect(c.toJSON()).to.deep.equal({
      a: 3,
      main: {
        arr: [
          {b: 'test1', sub: {c: 'new SubSub string'}},
          {b: 'test2', sub: {c2: 'new SubSub2 string'}}
        ]
      }
    });

  });

  it('should load sub sub GenericConfigType properly', () => {


    @SubConfigClass()
    class SubSub {
      @ConfigProperty({
        tags: {
          testTag: 'my value'
        },
        description: 'just a description'
      })
      c: string = 'SubSub string';
    }

    @SubConfigClass()
    class Sub {
      @ConfigProperty()
      b: string = 'Sub string';

      @ConfigProperty({type: GenericConfigType})
      subSub: GenericConfigType;
    }


    @ConfigClass()
    class C {

      @ConfigProperty()
      a: number = 3;

      @ConfigProperty({type: GenericConfigType})
      inner: GenericConfigType;
    }


    @WebConfigClass()
    class WC {
      @ConfigProperty()
      a: number = 3;

      @ConfigProperty({type: GenericConfigType})
      inner: GenericConfigType;
    }

    const c = ConfigClassBuilder.attachPrivateInterface(new C());
    c.loadSync();
    c.inner = new Sub();
    c.a = 10;
    (c.inner as Sub).b = 'test';
    (c.inner as Sub).subSub = new SubSub();
    ((c.inner as Sub).subSub as SubSub).c = 'test2';

    const wc = WebConfigClassBuilder.attachPrivateInterface(new WC());

    wc.load(JSON.parse(JSON.stringify(c.toJSON({attachState: true}))));
    chai.expect(wc.__isDefault()).to.deep.equal(false);
    chai.expect((wc.inner as any).subSub.__state['c'].value).to.deep.equal('test2');
    chai.expect((wc.inner as any).subSub.c).to.deep.equal('test2');
    chai.expect((wc.inner as any).subSub.__isDefault()).to.deep.equal(false);

    chai.expect((wc.inner as any).subSub.__state['c'].tags).to.deep.equal({
        testTag: 'my value'
      }
    );
    chai.expect((wc.inner as any).subSub.__state['c'].description).to.deep.equal('just a description');
  });


  describe('config file', () => {

    const filePath = TestHelper.getFilePath('testConf.json');
    beforeEach(async () => {
      await TestHelper.cleanTempFolder();
    });
    afterEach(async () => {
      await TestHelper.removeTempFolder();
    });

    it('should load', async () => {


      @SubConfigClass()
      class SubSub {
        @ConfigProperty({
          tags: {
            testTag: 'my value'
          },
          description: 'just a description'
        })
        c: string = 'SubSub string';
      }

      @SubConfigClass()
      class Sub {
        @ConfigProperty()
        b: string = 'Sub string';

        @ConfigProperty({type: GenericConfigType})
        subSub: GenericConfigType;
      }


      @ConfigClass({configPath: filePath})
      class C {

        @ConfigProperty()
        a: number = 5;


        @ConfigProperty({type: GenericConfigType})
        inner: GenericConfigType;

      }


      const c = ConfigClassBuilder.attachPrivateInterface(new C());
      const c2 = ConfigClassBuilder.attachPrivateInterface(new C());
      c.inner = new Sub();
      c.a = 10;
      (c.inner as Sub).b = 'test';
      (c.inner as Sub).subSub = new SubSub();
      ((c.inner as Sub).subSub as SubSub).c = 'test2';
      chai.expect(c.a ).to.equal(10);
      chai.expect((c.inner as any).subSub.__state['c'].value).to.deep.equal('test2');
      chai.expect((c.inner as any).subSub.c).to.deep.equal('test2');
      chai.expect((c.inner as any).subSub.__isDefault()).to.deep.equal(false);

      chai.expect(fsp.access(filePath)).to.rejectedWith();
      await c.load();
      chai.expect(fsp.access(filePath)).not.to.rejectedWith();

      await c2.load();
      c2.inner = new Sub();
      (c2.inner as Sub).subSub = new SubSub();
      await c2.load();
      chai.expect(c2.a ).to.equal(10);
      chai.expect((c2.inner as any).subSub.__state['c'].value).to.deep.equal('test2');
      chai.expect((c2.inner as any).subSub.c).to.deep.equal('test2');
      chai.expect((c2.inner as any).subSub.__isDefault()).to.deep.equal(false);
    });
  });
});
