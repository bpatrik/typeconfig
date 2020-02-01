/* tslint:disable:no-inferrable-types */
import 'reflect-metadata';
import {ConfigClass} from '../../src/decorators/class/ConfigClass';
import {ConfigProperty} from '../../src/decorators/property/ConfigPropoerty';
import {SubConfigClass} from '../../src/decorators/class/SubConfigClass';
import {ConfigClassBuilder} from '../../src/decorators/builders/ConfigClassBuilder';
import * as optimist from 'optimist';
import {IConfigClassPrivate} from '../../src/decorators/class/IConfigClass';

const chai: any = require('chai');
const should = chai.should();

describe('ConfigProperty', () => {


  describe('should support', () => {
    it('null', () => {
      @ConfigClass()
      class C {

        @ConfigProperty()
        num: number = null;

        toJSON(): any {
        }
      }

      const c = new C();
      chai.expect(c.toJSON()).to.deep.equal({num: null});
      c.num = 10;
      chai.expect(c.toJSON()).to.deep.equal({num: 10});
      c.num = null;
      chai.expect(c.toJSON()).to.deep.equal({num: null});
    });


    it('null with sub config', () => {

      @SubConfigClass()
      class Sub {

        @ConfigProperty()
        num: number;
      }


      @ConfigClass()
      class C {

        @ConfigProperty()
        sub: Sub = null;

        toJSON(): any {
        }
      }

      const c = new C();
      chai.expect(c.toJSON()).to.deep.equal({sub: null});
      c.sub = new Sub();
      chai.expect(c.toJSON()).to.deep.equal({sub: {}});
      c.sub.num = 10;
      chai.expect(c.toJSON()).to.deep.equal({sub: {num: 10}});
      c.sub = null;
      chai.expect(c.toJSON()).to.deep.equal({sub: null});
      c.sub = {num: 10};
      chai.expect(c.toJSON()).to.deep.equal({sub: {num: 10}});
    });

    it('undefined', () => {
      @ConfigClass()
      class C {

        @ConfigProperty()
        num: number;

        toJSON(): any {
        }
      }

      const c = new C();
      chai.expect(c.toJSON()).to.deep.equal({});
      c.num = 10;
      chai.expect(c.toJSON()).to.deep.equal({num: 10});
      c.num = null;
      chai.expect(c.toJSON()).to.deep.equal({num: null});
    });

    it('undefined with sub config', () => {

      @SubConfigClass()
      class Sub {

        @ConfigProperty()
        num: number;
      }


      @ConfigClass()
      class C {

        @ConfigProperty()
        sub: Sub;

        toJSON(): any {
        }
      }

      const c = new C();
      chai.expect(c.toJSON()).to.deep.equal({});
      c.sub = new Sub();
      chai.expect(c.toJSON()).to.deep.equal({sub: {}});
      c.sub.num = 10;
      chai.expect(c.toJSON()).to.deep.equal({sub: {num: 10}});
      c.sub = null;
      chai.expect(c.toJSON()).to.deep.equal({sub: null});
      c.sub = {num: null};
      chai.expect(c.toJSON()).to.deep.equal({sub: {num: null}});
      c.sub = {num: 10};
      chai.expect(c.toJSON()).to.deep.equal({sub: {num: 10}});
      c.sub.num = null;
      chai.expect(c.toJSON()).to.deep.equal({sub: {num: null}});
    });

    it('ratio', () => {
      @ConfigClass()
      class C {

        @ConfigProperty({type: 'ratio'})
        r: number = 0;

        toJSON(): any {
        }
      }

      const c = new C();
      chai.expect(c.toJSON()).to.deep.equal({r: 0});
      c.r = 0.2;
      chai.expect(c.toJSON()).to.deep.equal({r: 0.2});
      c.r = 1;
      chai.expect(c.toJSON()).to.deep.equal({r: 1});
      c.r = null;
      chai.expect(c.toJSON()).to.deep.equal({r: null});
      c.r = 0;
      chai.expect(c.toJSON()).to.deep.equal({r: 0});
      c.r = <any>'0.5';
      chai.expect(c.toJSON()).to.deep.equal({r: 0.5});
      chai.expect(() => {
        c.r = 10;
      }).to.throw(TypeError, 'ratio');
      chai.expect(() => {
        c.r = -10;
      }).to.throw(TypeError, 'ratio');
      chai.expect(() => {
        c.r = 1.1;
      }).to.throw(TypeError, 'ratio');
      chai.expect(() => {
        c.r = -0.1;
      }).to.throw(TypeError, 'ratio');
    });
    it('unsignedInt', () => {

      @ConfigClass()
      class C {

        @ConfigProperty({type: 'unsignedInt'})
        num: number = 0;

        toJSON(): any {
        }
      }

      const c = new C();
      chai.expect(c.toJSON()).to.deep.equal({num: 0});
      c.num = 2;
      chai.expect(c.toJSON()).to.deep.equal({num: 2});
      c.num = 0;
      chai.expect(c.toJSON()).to.deep.equal({num: 0});
      c.num = null;
      chai.expect(c.toJSON()).to.deep.equal({num: null});
      c.num = <any>'5';
      chai.expect(c.toJSON()).to.deep.equal({num: 5});
      chai.expect(() => {
        c.num = -1;
      }).to.throw(TypeError, 'unsigned');
      chai.expect(() => {
        c.num = 100.2;
      }).to.throw(TypeError, 'unsigned');
      chai.expect(() => {
        c.num = <any>'10.6';
      }).to.throw(TypeError, 'unsigned');
      chai.expect(() => {
        c.num = <any>'apple';
      }).to.throw(TypeError, 'unsigned');
    });

    it('positiveFloat', () => {


      @ConfigClass()
      class C {

        @ConfigProperty({type: 'positiveFloat'})
        num: number = 0;

        toJSON(): any {
        }
      }

      const c = new C();
      chai.expect(c.toJSON()).to.deep.equal({num: 0});
      c.num = 2;
      chai.expect(c.toJSON()).to.deep.equal({num: 2});
      c.num = null;
      chai.expect(c.toJSON()).to.deep.equal({num: null});
      c.num = 0;
      chai.expect(c.toJSON()).to.deep.equal({num: 0});
      c.num = <any>'5';
      chai.expect(c.toJSON()).to.deep.equal({num: 5});
      c.num = 0.3;
      chai.expect(c.toJSON()).to.deep.equal({num: 0.3});
      chai.expect(() => {
        c.num = -1;
      }).to.throw(TypeError, 'positive');
    });

    it('number', () => {

      @ConfigClass()
      class C {

        @ConfigProperty()
        num: number = 5.2;

        @ConfigProperty()
        zero: number = 0;

        toJSON(): any {
        }
      }

      const c = new C();
      chai.expect(c.toJSON()).to.deep.equal({num: 5.2, zero: 0});
      c.num = null;
      chai.expect(c.toJSON()).to.deep.equal({num: null, zero: 0});
      c.num = 10;
      chai.expect(c.toJSON()).to.deep.equal({num: 10, zero: 0});
      c.num = <any>'apple';
      chai.expect(c.toJSON()).to.deep.equal({num: NaN, zero: 0});
    });

    it('integer', () => {

      @ConfigClass()
      class C {

        @ConfigProperty({type: 'integer'})
        num: number = 5;

        toJSON(): any {
        }
      }

      const c = new C();
      chai.expect(c.toJSON()).to.deep.equal({num: 5});
      c.num = 6;
      chai.expect(c.toJSON()).to.deep.equal({num: 6});
      c.num = <any>'10';
      chai.expect(c.toJSON()).to.deep.equal({num: 10});
      chai.expect(() => {
        c.num = 100.2;
      }).to.throw(TypeError, 'integer');
      chai.expect(() => {
        c.num = <any>'10.6';
      }).to.throw(TypeError, 'integer');
      chai.expect(() => {
        c.num = <any>'apple';
      }).to.throw(TypeError, 'integer');
    });

    it('boolean', () => {

      @ConfigClass()
      class C {

        @ConfigProperty()
        bool: boolean = true;

        toJSON(): any {
        }
      }

      const c = new C();
      chai.expect(c.toJSON()).to.deep.equal({bool: true});
      c.bool = false;
      chai.expect(c.toJSON()).to.deep.equal({bool: false});
      c.bool = <any>'false';
      chai.expect(c.toJSON()).to.deep.equal({bool: false});
      c.bool = <any>'true';
      chai.expect(c.toJSON()).to.deep.equal({bool: true});
      chai.expect(() => {
        c.bool = <any>10;
      }).to.throw(TypeError, 'boolean');
      chai.expect(() => {
        c.bool = <any>'10.6';
      }).to.throw(TypeError, 'boolean');
      chai.expect(() => {
        c.bool = <any>'apple';
      }).to.throw(TypeError, 'boolean');
    });

    it('string', () => {

      @ConfigClass()
      class C {

        @ConfigProperty()
        str: string = 'apple';

        toJSON(): any {
        }
      }

      const c = new C();
      chai.expect(c.toJSON()).to.deep.equal({str: 'apple'});
      c.str = 'pear';
      chai.expect(c.toJSON()).to.deep.equal({str: 'pear'});
      c.str = <any>5;
      chai.expect(c.toJSON()).to.deep.equal({str: '5'});
    });

    it('date', () => {

      const now = new Date();

      @ConfigClass()
      class C {

        @ConfigProperty()
        date: Date = now;

        toJSON(): any {
        }
      }

      const c = new C();
      const later = new Date();
      later.setHours(now.getHours() + 2);
      chai.expect(c.toJSON()).to.deep.equal({date: now});
      chai.expect(c.toJSON()).to.not.deep.equal({date: later});
      c.date = later;
      chai.expect(c.toJSON()).to.deep.equal({date: later});
      c.date = <any>later.toISOString();
      chai.expect(c.toJSON()).to.deep.equal({date: later});
      c.date = <any>later.toString();
      later.setMilliseconds(0);
      chai.expect(c.toJSON()).to.deep.equal({date: later});
      c.date = <any>later.toLocaleString();
      chai.expect(c.toJSON()).to.deep.equal({date: later});
      c.date = <any>later.getTime();
      chai.expect(c.toJSON()).to.deep.equal({date: later});
    });

    it('enum', () => {

      enum TestEnum {
        red = 5, green = 10, blue = 12
      }

      @ConfigClass()
      class C {

        @ConfigProperty({type: TestEnum})
        enum: TestEnum = TestEnum.red;

        toJSON(): any {
        }
      }

      const c = ConfigClassBuilder.attachPrivateInterface(new C());
      chai.expect(c.toJSON()).to.deep.equal({enum: TestEnum.red});
      c.enum = TestEnum.blue;
      chai.expect(c.toJSON()).to.deep.equal({enum: TestEnum.blue});
      c.enum = <any>'green';
      chai.expect(c.toJSON()).to.deep.equal({enum: TestEnum.green});
      chai.expect(() => {
        c.enum = <any>'yellow';
      }).to.throw(TypeError, 'should be an Enum');
    });


    it('type factory', () => {


      @ConfigClass()
      class C {

        @ConfigProperty({
          typeBuilder: (v: any) => {
            if (typeof v === 'string') {
              return String;
            }
            return 'integer';
          }
        })
        var: any = 'apple';

      }

      const c = ConfigClassBuilder.attachPrivateInterface(new C());
      chai.expect(c.toJSON()).to.deep.equal({var: 'apple'});
      c.var = 'pear';
      chai.expect(c.toJSON()).to.deep.equal({var: 'pear'});
      c.var = 5;
      chai.expect(c.toJSON()).to.deep.equal({var: 5});
      chai.expect(() => {
        c.var = 0.1;
      }).to.throw(TypeError, 'integer');
    });


    it('array-type factory', () => {


      @ConfigClass()
      class C {

        @ConfigProperty({
          arrayTypeBuilder: (v: any) => {
            if (typeof v === 'string') {
              return String;
            }
            return 'integer';
          }
        })
        var: any[] = ['apple'];

      }

      const c = ConfigClassBuilder.attachPrivateInterface(new C());
      chai.expect(c.toJSON()).to.deep.equal({var: ['apple']});
      c.var = ['pear'];
      chai.expect(c.toJSON()).to.deep.equal({var: ['pear']});
      c.var = [5];
      chai.expect(c.toJSON()).to.deep.equal({var: [5]});
      chai.expect(() => {
        c.var = [0.1];
      }).to.throw(TypeError, 'integer');
    });

    it('string-array', () => {
      @ConfigClass()
      class C {

        @ConfigProperty({arrayType: String})
        arr: string[] = ['apple'];

        toJSON(): any {
        }
      }

      const c = ConfigClassBuilder.attachPrivateInterface(new C());
      chai.expect(c.toJSON()).to.deep.equal({arr: ['apple']});
      c.arr = ['pear', 'peach'];
      chai.expect(c.toJSON()).to.deep.equal({arr: ['pear', 'peach']});
      c.arr = null;
      chai.expect(c.toJSON()).to.deep.equal({arr: null});
      c.arr = ['apple', <any>4, <any>7, null];
      chai.expect(c.toJSON()).to.deep.equal({arr: ['apple', '4', '7', null]});

      chai.expect(() => {
        c.arr = <any>'yellow';
      }).to.throw(TypeError, 'should be an array');
    });

    it('int-array', () => {
      @ConfigClass()
      class C {

        @ConfigProperty({arrayType: 'integer'})
        arr: number[] = [10, 30];

        toJSON(): any {
        }
      }

      const c = ConfigClassBuilder.attachPrivateInterface(new C());
      chai.expect(c.toJSON()).to.deep.equal({arr: [10, 30]});
      c.arr = [10, 40];
      chai.expect(c.toJSON()).to.deep.equal({arr: [10, 40]});
      c.arr = null;
      chai.expect(c.toJSON()).to.deep.equal({arr: null});
      c.arr = <any>[10, 40, '20'];
      chai.expect(c.toJSON()).to.deep.equal({arr: [10, 40, 20]});

      chai.expect(() => {
        c.arr = <any>'yellow';
      }).to.throw(TypeError, 'should be an array');
      chai.expect(() => {
        c.arr = <any><any>[10, 40, '20.2'];
      }).to.throw(TypeError, 'integer');
      chai.expect(() => {
        c.arr = <any><any>[10, 40, 'apple'];
      }).to.throw(TypeError, 'integer');
    });

    it('enum-array', () => {

      enum TestEnum {
        red, green, blue
      }

      @ConfigClass()
      class C {

        @ConfigProperty({arrayType: TestEnum})
        arr: TestEnum[] = [TestEnum.blue];

        toJSON(): any {
        }
      }

      const c = ConfigClassBuilder.attachPrivateInterface(new C());
      chai.expect(c.toJSON()).to.deep.equal({arr: [TestEnum.blue]});
      c.arr = [TestEnum.green, TestEnum.red];
      chai.expect(c.toJSON()).to.deep.equal({arr: [TestEnum.green, TestEnum.red]});
      c.arr = null;
      chai.expect(c.toJSON()).to.deep.equal({arr: null});
      c.arr = <any>['red', 'blue'];
      chai.expect(c.toJSON()).to.deep.equal({arr: [TestEnum.red, TestEnum.blue]});

      chai.expect(() => {
        c.arr = <any>'yellow';
      }).to.throw(TypeError, 'should be an array');
      chai.expect(() => {
        c.arr = <any>['yellow'];
      }).to.throw(TypeError, 'should be an Enum');
    });

    it('anonym-config-array', () => {
      @SubConfigClass()
      class Sub {


        @ConfigProperty()
        num: number;

        constructor(num?: number) {
          this.num = num;
        }
      }


      @ConfigClass()
      class C {

        @ConfigProperty()
        sub: Sub[] = [];

        toJSON(): any {
        }
      }

      const c = new C();
      chai.expect(c.toJSON()).to.deep.equal({sub: []});
      c.sub = [new Sub(2)];
      chai.expect(c.toJSON()).to.deep.equal({sub: [{num: 2}]});
      c.sub = [new Sub(2), new Sub(3)];
      chai.expect(c.toJSON()).to.deep.equal({sub: [{num: 2}, {num: 3}]});
      c.sub = [{num: 2}, {num: 3}];
      c.sub[0].num = 10;
      chai.expect(c.toJSON()).to.deep.equal({sub: [{num: 10}, {num: 3}]});
      c.sub = [];
      chai.expect(c.toJSON()).to.deep.equal({sub: []});

    });
    it('config-array', () => {
      @SubConfigClass()
      class Sub {


        @ConfigProperty()
        num: number;

        constructor(num?: number) {
          this.num = num;
        }

        toJSON(): any {
        }
      }


      @ConfigClass()
      class C {

        @ConfigProperty({arrayType: Sub})
        sub: Sub[] = [];

      }

      const c = ConfigClassBuilder.attachPrivateInterface(new C());
      chai.expect(c.toJSON()).to.deep.equal({sub: []});
      c.sub = [new Sub(2)];
      chai.expect(c.toJSON()).to.deep.equal({sub: [{num: 2}]});
      c.sub = [new Sub(2), new Sub(3)];
      chai.expect(c.toJSON()).to.deep.equal({sub: [{num: 2}, {num: 3}]});
      c.sub = <any>[{num: 2}, {num: 3}];
      c.sub[0].num = 10;
      chai.expect(c.toJSON()).to.deep.equal({sub: [{num: 10}, {num: 3}]});
      chai.expect(c.sub[0].toJSON()).to.deep.equal({num: 10});
      c.sub = [];
      chai.expect(c.toJSON()).to.deep.equal({sub: []});

    });

  });

  it('should skip volatile', () => {

    @ConfigClass()
    class C {

      @ConfigProperty()
      num: number = 5;

      @ConfigProperty({volatile: true})
      vNum: number = 5.2;

    }

    const c = ConfigClassBuilder.attachPrivateInterface(new C());
    chai.expect(c.toJSON()).to.deep.equal({num: 5});
    c.vNum = 10;
    chai.expect(c.toJSON()).to.deep.equal({num: 5});
    chai.expect(c.vNum).to.deep.equal(10);
  });


  describe('readonly', () => {

    const cleanUp = () => {
      delete process.env['num'];
      delete process.env['sub-num'];
      delete optimist.argv['num'];
    };

    beforeEach(cleanUp);
    afterEach(cleanUp);

    it('should support', () => {

      @ConfigClass()
      class C {
        @ConfigProperty({readonly: true})
        num: number = 5;
      }

      const c = ConfigClassBuilder.attachPrivateInterface(new C());
      chai.expect(c.toJSON()).to.deep.equal({num: 5});
      c.num = 5;
      chai.expect(c.__state.num.readonly).to.equal(true);

      chai.expect(() => {
        c.num = 10;
      }).to.throw(Error, 'readonly');
    });

    it('env should make readonly', () => {

      @ConfigClass()
      class C {
        @ConfigProperty()
        num: number = 5;
      }

      process.env['num'] = '20';
      const c = ConfigClassBuilder.attachPrivateInterface(new C());
      chai.expect(c.toJSON()).to.deep.equal({num: 5});
      c.num = 10;
      chai.expect(c.toJSON()).to.deep.equal({num: 10});
      c.loadSync();
      chai.expect(c.toJSON()).to.deep.equal({num: 20});
      chai.expect(c.__state.num.readonly).to.equal(true);
      c.num = 20;
      chai.expect(() => {
        c.num = 11;
      }).to.throw(Error, 'readonly');
    });


    it('env should make readonly in subconfig', () => {

      @SubConfigClass()
      class Sub {
        @ConfigProperty()
        num: number = 5;
      }

      @ConfigClass()
      class C {
        @ConfigProperty({type: Sub})
        sub: IConfigClassPrivate & Sub = <any>new Sub();
      }

      process.env['sub-num'] = '20';
      const c = ConfigClassBuilder.attachPrivateInterface(new C());
      chai.expect(c.toJSON()).to.deep.equal({sub: {num: 5}});
      c.sub.num = 10;
      chai.expect(c.toJSON()).to.deep.equal({sub: {num: 10}});
      chai.expect(c.__state.sub.readonly).to.not.equal(true);
      chai.expect(c.sub.__state.num.readonly).to.not.equal(true);
      c.loadSync();
      chai.expect(c.toJSON()).to.deep.equal({sub: {num: 20}});
      chai.expect(c.__state.sub.readonly).to.not.equal(true);
      chai.expect(c.sub.__state.num.readonly).to.equal(true);
      chai.expect(c.toJSON({attachState: true}))
        .to.deep.equal({__state: {sub: {num: {readonly: true}}}, sub: {num: 20}});
      c.sub.num = 20;
      chai.expect(() => {
        c.sub.num = 11;
      }).to.throw(Error, 'readonly');
    });


    it('cli should make readonly', () => {

      @ConfigClass()
      class C {
        @ConfigProperty()
        num: number = 5;
      }

      optimist.argv['num'] = '20';
      const c = ConfigClassBuilder.attachPrivateInterface(new C());
      chai.expect(c.toJSON()).to.deep.equal({num: 5});
      c.num = 10;
      chai.expect(c.toJSON()).to.deep.equal({num: 10});
      c.loadSync();
      chai.expect(c.toJSON()).to.deep.equal({num: 20});
      chai.expect(c.__state.num.readonly).to.equal(true);
      c.num = 20;
      chai.expect(() => {
        c.num = 11;
      }).to.throw(Error, 'readonly');
    });


  });


  describe('constraint', () => {


    it('should validate', () => {

      @ConfigClass()
      class C {

        @ConfigProperty({
          constraint: {assert: v => v >= 5}
        })
        num: number = 5;


      }

      const c = ConfigClassBuilder.attachPrivateInterface(new C());

      chai.expect(c.toJSON()).to.deep.equal({num: 5});
      c.num = 6;
      chai.expect(c.toJSON()).to.deep.equal({num: 6});

      chai.expect(() => {
        c.num = 0;
      }).to.throw(Error, 'Constraint');


      try {
        c.num = 1;
      } catch (e) {
      }
      chai.expect(c.toJSON()).to.deep.equal({num: 6});

    });
    it('should fallback', () => {

      @ConfigClass()
      class C {

        @ConfigProperty({
          constraint: {assert: v => v >= 5, fallBackValue: 10}
        })
        num: number = 5;


      }

      const c = ConfigClassBuilder.attachPrivateInterface(new C());

      try {
        c.num = 1;
      } catch (e) {
      }
      chai.expect(c.toJSON()).to.deep.equal({num: 10});

    });
    it('should error on default value error ', () => {
      @ConfigClass()
      class C {

        @ConfigProperty({
          constraint: {assert: v => v >= 5, fallBackValue: 10}
        })
        num: number = 1;
      }

      chai.expect(() => new C()).to.throw(Error, 'Constraint');

    });

    it('should print custom assert reason', () => {
      @ConfigClass()
      class C {

        @ConfigProperty({
          constraint: {assert: v => v >= 5, assertReason: 'Should be greater than five'}
        })
        num: number = 5;
      }

      const c = ConfigClassBuilder.attachPrivateInterface(new C());

      try {
        c.num = 1;
      } catch (e) {
      }
      chai.expect(c.toJSON()).to.deep.equal({num: 5});
      chai.expect(() => {
        c.num = 0;
      }).to.throw(Error, 'Should be greater than five');
    });

    it('should print custom assert reason with default value', () => {
      @ConfigClass()
      class C {

        @ConfigProperty({
          constraint: {assert: v => v >= 5, fallBackValue: 10, assertReason: 'Should be greater than five'}
        })
        num: number = 5;
      }

      const c = ConfigClassBuilder.attachPrivateInterface(new C());
      try {
        c.num = 1;
      } catch (e) {
      }
      chai.expect(c.toJSON()).to.deep.equal({num: 10});
      chai.expect(() => {
        c.num = 0;
      }).to.throw(Error, 'Should be greater than five');
    });

    it('should access root config', () => {

      @SubConfigClass()
      class Sub {
        @ConfigProperty({
          constraint: {
            assert: (value, config: C) => config.num >= 5
          }
        })
        str: string = 'apple';
      }

      @ConfigClass()
      class C {

        @ConfigProperty()
        num: number = 5;

        @ConfigProperty()
        sub: Sub = new Sub();
      }

      const c = ConfigClassBuilder.attachPrivateInterface(new C());
      chai.expect(() => {
        c.num = 0;
      }).to.throw(Error, 'Constraint');
    });


    it('should cascade', () => {


      @ConfigClass()
      class C {
        @ConfigProperty()
        a: number = 5;

        @ConfigProperty({
          constraint: {
            assert: (value, config: C) => config.a >= 5,
            fallBackValue: 2
          }
        })
        b: number = 5;

        @ConfigProperty({
          constraint: {
            assert: (value, config: C) => config.b >= 5,
            fallBackValue: 3
          }
        })
        c: number = 5;

      }

      const c = ConfigClassBuilder.attachPrivateInterface(new C());

      chai.expect(c.toJSON()).to.deep.equal({a: 5, b: 5, c: 5});
      chai.expect(() => {
        c.a = 1;
      }).to.throw(Error, 'Constraint');
      chai.expect(c.toJSON()).to.deep.equal({a: 1, b: 2, c: 3});
    });


    it('should cascade in sub config', () => {

      @SubConfigClass()
      class Sub {
        @ConfigProperty({
          constraint: {
            assert: (value, config: C) => config.b >= 5,
            fallBackValue: 3
          }
        })
        c: number = 5;
      }

      @ConfigClass()
      class C {
        @ConfigProperty()
        a: number = 5;

        @ConfigProperty({
          constraint: {
            assert: (value, config: C) => config.a >= 5,
            fallBackValue: 2
          }
        })
        b: number = 5;

        @ConfigProperty()
        sub: Sub = new Sub();

      }

      const c = ConfigClassBuilder.attachPrivateInterface(new C());


      chai.expect(c.toJSON()).to.deep.equal({a: 5, b: 5, sub: {c: 5}});
      chai.expect(() => {
        c.a = 1;
      }).to.throw(Error, 'Constraint');
      chai.expect(c.toJSON()).to.deep.equal({a: 1, b: 2, sub: {c: 3}});
    });


  });

  describe('env alias', () => {

    const cleanUp = () => {
      delete process.env['numAlias'];
    };

    beforeEach(cleanUp);
    afterEach(cleanUp);

    it('should be loaded', async () => {

      @ConfigClass()
      class C {

        @ConfigProperty({envAlias: 'numAlias'})
        num: number = 5;

        @ConfigProperty()
        num2: number = 10;

      }

      const c = ConfigClassBuilder.attachPrivateInterface(new C());

      chai.expect(c.toJSON()).to.deep.equal({num: 5, num2: 10});
      process.env['numAlias'] = '100';
      await c.load();
      chai.expect(c.toJSON()).to.deep.equal({num: 100, num2: 10});

    });

    it('should be loaded in sub config', async () => {

      @SubConfigClass()
      class S {

        @ConfigProperty({envAlias: 'numAlias'})
        num: number = 5;

      }

      @ConfigClass()
      class C {


        @ConfigProperty()
        sub: S = new S();

      }

      const c = ConfigClassBuilder.attachPrivateInterface(new C());

      chai.expect(c.toJSON()).to.deep.equal({sub: {num: 5}});
      process.env['numAlias'] = '100';
      await c.load();
      chai.expect(c.toJSON()).to.deep.equal({sub: {num: 100}});

    });
  });
  describe('on new value', () => {

    it('should call function', async () => {
      @ConfigClass()
      class C {
        @ConfigProperty({
          onNewValue: () => {
            throw new Error('called');
          }
        })
        num: number = 5;
      }


      const c = ConfigClassBuilder.attachPrivateInterface(new C());
      chai.expect(() => {
        c.num = 10;
      }).to.throw(Error, 'called');

    });

    it('should access config', async () => {


      @SubConfigClass()
      class S {

        @ConfigProperty({
          onNewValue: (v, cnf: C) => {
            cnf.a++;
          }
        })
        num: number = 5;

      }

      @ConfigClass()
      class C {
        @ConfigProperty()
        sub: S = new S();

        @ConfigProperty()
        a: number = 10;
      }


      const c = ConfigClassBuilder.attachPrivateInterface(new C());
      chai.expect(c.toJSON()).to.deep.equal({sub: {num: 5}, a: 10});
      c.sub.num = 10;
      chai.expect(c.toJSON()).to.deep.equal({sub: {num: 10}, a: 11});
      c.sub.num = 10;
      chai.expect(c.toJSON()).to.deep.equal({sub: {num: 10}, a: 11});
      c.sub.num = 8;
      chai.expect(c.toJSON()).to.deep.equal({sub: {num: 8}, a: 12});

    });
  });
});
