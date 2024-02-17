/* tslint:disable:no-inferrable-types */
import 'reflect-metadata';
import {ConfigClass} from '../src/decorators/class/ConfigClass';
import {ConfigProperty} from '../src/decorators/property/ConfigPropoerty';
import {ConfigClassBuilder} from '../src/decorators/builders/ConfigClassBuilder';
import {SubConfigClass} from '../src/decorators/class/SubConfigClass';
import {GenericConfigType} from '../src/GenericConfigType';
import {WebConfigClassBuilder} from '../src/decorators/builders/WebConfigClassBuilder';
import {WebConfigClass} from '../src/decorators/class/WebConfigClass';

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
    console.log(JSON.stringify(c.toJSON({attachState: true}),null,4));
    wc.load(JSON.parse(JSON.stringify(c.toJSON({attachState: true}))));
    chai.expect(wc.__state['a'].value).to.deep.equal(10);
    chai.expect((wc.inner as any).__state['b']?.value).to.deep.equal('test');
    chai.expect((wc.inner as any).b).to.deep.equal('test');
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

});
