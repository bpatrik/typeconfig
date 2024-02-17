/* tslint:disable:no-inferrable-types */
import 'reflect-metadata';
import {ConfigClass} from '../../src/decorators/class/ConfigClass';
import {ConfigProperty} from '../../src/decorators/property/ConfigPropoerty';
import {ConfigState} from '../../src/decorators/property/ConfigState';

const chai: any = require('chai');
const should = chai.should();

describe('ConfigState', () => {


  it('should have state', () => {

    @ConfigClass()
    class C {

      @ConfigState()
      State: any;

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
    chai.expect(c.toJSON()).to.deep.equal({num: 5, zero: 0});
    chai.expect(c.State).to.deep.equal({
      noDefNum: {type: 'float'},
      num: {default: 5, hardDefault: 5, type: 'float', value: 5},
      zero: {default: 0, hardDefault: 0, type: 'float', value: 0}
    });
    c.num = 10;
    c.noDefNum = 12;
    chai.expect(c.toJSON()).to.deep.equal({num: 10, noDefNum: 12, zero: 0});
    chai.expect(c.State).to.deep.equal({
      noDefNum: {type: 'float', value: 12},
      num: {default: 5, hardDefault: 5, type: 'float', value: 10},
      zero: {default: 0, hardDefault: 0, type: 'float', value: 0}
    });
  });

  it('should have deep state ', () => {


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

      @ConfigState()
      State: any;

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
    chai.expect(c.State).to.deep.equal({
      noDefNum: {type: 'float'},
      num: {default: 5, hardDefault: 5, type: 'float', value: 5},
      sub: {
        noDefStr: {type: 'string'},
        str: {default: 'apple', hardDefault: 'apple', type: 'string', value: 'apple'},
        subSub: {bool: {default: true, hardDefault: true, type: 'boolean', value: true}}
      }
    });
    c.num = 10;
    c.noDefNum = 12;
    c.sub.str = 'pear';
    c.sub.noDefStr = 'peach';
    c.sub.subSub.bool = false;
    chai.expect(c.toJSON()).to.deep.equal({
      num: 10, noDefNum: 12,
      sub: {str: 'pear', noDefStr: 'peach', subSub: {bool: false}}
    });
    chai.expect(c.State).to.deep.equal({
      noDefNum: {type: 'float', value: 12},
      num: {default: 5, hardDefault: 5, type: 'float', value: 10},
      sub: {
        noDefStr: {type: 'string', value: 'peach'},
        str: {default: 'apple', hardDefault: 'apple', type: 'string', value: 'pear'},
        subSub: {bool: {default: true, hardDefault: true, type: 'boolean', value: false}}
      }
    });
  });


});
