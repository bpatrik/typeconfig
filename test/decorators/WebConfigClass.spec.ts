/* tslint:disable:no-inferrable-types */
import 'reflect-metadata';
import {ConfigProperty} from '../../src/decorators/property/ConfigPropoerty';
import {WebConfigClass} from '../../src/decorators/class/WebConfigClass';
import {WebConfigClassBuilder} from '../../src/decorators/builders/WebConfigClassBuilder';
import {SubConfigClass} from '../../src/decorators/class/SubConfigClass';

const chai: any = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const should = chai.should();

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
      c.load({__state: {sub: {num: {default: 77}}}, sub: {num: 66}});
      chai.expect(c.toJSON({attachState: true})).to.deep.equal({__state: {sub: {num: {default: 77}}}, sub: {num: 66}});

    });
  });


});
