import 'reflect-metadata';
import {ConfigClass} from '../../src/decorators/class/ConfigClass';
import {ConfigProperty} from '../../src/decorators/property/ConfigPropoerty';
import {ConfigDefaults} from '../../src/decorators/property/ConfigDefaults';

const chai: any = require('chai');
const should = chai.should();

describe('ConfigDefault', () => {


  it('should have default value', () => {

    @ConfigClass()
    class C {

      @ConfigDefaults()
      Defaults: C;

      @ConfigProperty()
      num: number = 5;

      @ConfigProperty()
      zero: number = 0;

      @ConfigProperty()
      noDefNum: number;

      toJSON(): any {
      }
    }

    const c = new C();
    chai.expect(c.toJSON()).to.deep.equal({num: 5, zero:0});
    chai.expect(c.Defaults).to.deep.equal({num: 5, zero:0});
    c.num = 10;
    c.noDefNum = 12;
    chai.expect(c.toJSON()).to.deep.equal({num: 10, noDefNum: 12, zero:0});
    chai.expect(c.Defaults).to.deep.equal({num: 5, zero:0});
  });

  it('should have deep default ', () => {


    @ConfigClass()
    class SubSub {

      @ConfigProperty()
      bool: boolean = true;

    }

    @ConfigClass()
    class Sub {

      @ConfigProperty()
      str: string = 'apple';

      @ConfigProperty()
      noDefStr: string;

      @ConfigProperty()
      subSub: SubSub = new SubSub();

      toJSON(): any {
      }
    }

    @ConfigClass()
    class C {

      @ConfigDefaults()
      Defaults: C;

      @ConfigProperty()
      num: number = 5;

      @ConfigProperty()
      noDefNum: number;

      @ConfigProperty()
      sub: Sub = new Sub();


      toJSON(): any {
      }
    }

    const c = new C();
    chai.expect(c.sub.toJSON()).to.deep.equal({str: 'apple', subSub: {bool: true}});
    chai.expect(c.toJSON()).to.deep.equal({num: 5, sub: {str: 'apple', subSub: {bool: true}}});
    chai.expect(c.Defaults).to.deep.equal({num: 5, sub: {str: 'apple', subSub: {bool: true}}});
    c.num = 10;
    c.noDefNum = 12;
    c.sub.str = 'pear';
    c.sub.noDefStr = 'peach';
    c.sub.subSub.bool = false;
    chai.expect(c.toJSON()).to.deep.equal({
      num: 10, noDefNum: 12,
      sub: {str: 'pear', noDefStr: 'peach', subSub: {bool: false}}
    });
    chai.expect(c.Defaults).to.deep.equal({num: 5, sub: {str: 'apple', subSub: {bool: true}}});
  });


});
