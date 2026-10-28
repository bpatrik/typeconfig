import 'reflect-metadata';
import {ConfigClass} from '../../../src/decorators/class/ConfigClass.js';
import {ConfigProperty} from '../../../src/decorators/property/ConfigPropoerty.js';
import {ConfigClassBuilder} from '../../../src/decorators/builders/ConfigClassBuilder.js';

import * as chaiModule from 'chai';

const chai: any = chaiModule;
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);

describe('ConfigClassBuilder', () => {

  it('should build', () => {

    @ConfigClass()
    class C {
      @ConfigProperty()
      num: number = 5;
    }

    const c1 = ConfigClassBuilder.attachPrivateInterface(new C());
    const c2 = ConfigClassBuilder.attachInterface(new C());
    const c3 = ConfigClassBuilder.buildPrivate(C);
    const c4 = ConfigClassBuilder.build(C);
    chai.expect(c1.num).to.deep.equal(c2.num);
    chai.expect(c1.num).to.deep.equal(c3.num);
    chai.expect(c1.num).to.deep.equal(c4.num);
    chai.expect(c1.toJSON()).to.deep.equal({num: 5});
    chai.expect(c2.toJSON()).to.deep.equal({num: 5});
    chai.expect(c3.toJSON()).to.deep.equal({num: 5});
    chai.expect(c4.toJSON()).to.deep.equal({num: 5});
    chai.expect(c1.__defaults).to.deep.equal({num: 5});
    chai.expect(c3.__defaults).to.deep.equal({num: 5});
  });

  it('should pass the constructor arguments', () => {

    @ConfigClass()
    class C {
      @ConfigProperty()
      num: number = 5;

      constructor(a: number = 1, b: number = 2) {
        this.num = a + b;
      }
    }

    chai.expect(ConfigClassBuilder.build(C, 3, 4).num).to.equal(7);
    chai.expect(ConfigClassBuilder.buildPrivate(C, 4, 4).num).to.equal(8);
    chai.expect(ConfigClassBuilder.build(C).num).to.equal(3);
  });


});
