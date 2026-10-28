import 'reflect-metadata';
import {ConfigProperty} from '../../../src/decorators/property/ConfigPropoerty.js';
import {WebConfigClass} from '../../../src/decorators/class/WebConfigClass.js';
import {WebConfigClassBuilder} from '../../../src/decorators/builders/WebConfigClassBuilder.js';

import * as chaiModule from 'chai';

const chai: any = chaiModule;
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);

describe('WebConfigClassBuilder', () => {

  it('should build', () => {

    @WebConfigClass()
    class C {
      @ConfigProperty()
      num: number = 5;
    }

    const c1 = WebConfigClassBuilder.attachPrivateInterface(new C());
    const c2 = WebConfigClassBuilder.attachInterface(new C());
    const c3 = WebConfigClassBuilder.buildPrivate(C);
    const c4 = WebConfigClassBuilder.build(C);
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

    @WebConfigClass()
    class C {
      @ConfigProperty()
      num: number = 5;

      constructor(a: number = 1, b: number = 2) {
        this.num = a + b;
      }
    }

    chai.expect(WebConfigClassBuilder.build(C, 3, 4).num).to.equal(7);
    chai.expect(WebConfigClassBuilder.buildPrivate(C, 4, 4).num).to.equal(8);
    chai.expect(WebConfigClassBuilder.build(C).num).to.equal(3);
  });


});
