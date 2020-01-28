/* tslint:disable:no-inferrable-types */
import 'reflect-metadata';
import {ConfigClass} from '../../../src/decorators/class/ConfigClass';
import {ConfigProperty} from '../../../src/decorators/property/ConfigPropoerty';
import {ConfigClassBuilder} from '../../../src/decorators/builders/ConfigClassBuilder';

const chai: any = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const should = chai.should();

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


});
