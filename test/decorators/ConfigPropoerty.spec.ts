import 'reflect-metadata';
import {ConfigClass} from '../../src/decorators/class/ConfigClass';
import {ConfigProperty} from '../../src/decorators/ConfigPropoerty';
import {SubConfigClass} from '../../src/decorators/class/SubConfigClass';
import {ConfigClassMethods} from '../../src/decorators/class/RootConfigClassFactory';

const chai: any = require('chai');
const should = chai.should();

describe('ConfigProperty', () => {


  describe('should support', () => {

    it('number', () => {

      @ConfigClass()
      class C {

        @ConfigProperty()
        num: number = 5.2;

        toJSON(): any {
        }
      }

      const c = new C();
      chai.expect(c.toJSON()).to.deep.equal({num: 5.2});
      c.num = 10;
      chai.expect(c.toJSON()).to.deep.equal({num: 10});
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

      const c = new C();
      chai.expect(c.toJSON()).to.deep.equal({enum: TestEnum.red});
      c.enum = TestEnum.blue;
      chai.expect(c.toJSON()).to.deep.equal({enum: TestEnum.blue});
      c.enum = <any>'green';
      chai.expect(c.toJSON()).to.deep.equal({enum: TestEnum.green});
      chai.expect(() => {
        c.enum = <any>'yellow';
      }).to.throw(TypeError, 'should be an Enum');
    });

    it('string-array', () => {
      @ConfigClass()
      class C {

        @ConfigProperty({arrayType: String})
        arr: string[] = ['apple'];

        toJSON(): any {
        }
      }

      const c = new C();
      chai.expect(c.toJSON()).to.deep.equal({arr: ['apple']});
      c.arr = ['pear', 'peach'];
      chai.expect(c.toJSON()).to.deep.equal({arr: ['pear', 'peach']});
      c.arr = ['apple', <any>4, <any>7, null];
      chai.expect(c.toJSON()).to.deep.equal({arr: ['apple', '4', '7', 'null']});

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

      const c = new C();
      chai.expect(c.toJSON()).to.deep.equal({arr: [10, 30]});
      c.arr = [10, 40];
      chai.expect(c.toJSON()).to.deep.equal({arr: [10, 40]});
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

      const c = new C();
      chai.expect(c.toJSON()).to.deep.equal({arr: [TestEnum.blue]});
      c.arr = [TestEnum.green, TestEnum.red];
      chai.expect(c.toJSON()).to.deep.equal({arr: [TestEnum.green, TestEnum.red]});
      c.arr = <any>['red', 'blue'];
      chai.expect(c.toJSON()).to.deep.equal({arr: [TestEnum.red, TestEnum.blue]});

      chai.expect(() => {
        c.arr = <any>'yellow';
      }).to.throw(TypeError, 'should be an array');
      chai.expect(() => {
        c.arr = <any>['yellow'];
      }).to.throw(TypeError, 'should be an Enum');
    });

  });

  it('should skip volatile', () => {

    @ConfigClass()
    class C {

      @ConfigProperty()
      num: number = 5;

      @ConfigProperty({volatile: true})
      vNum: number = 5.2;

      toJSON(): any {
      }
    }

    const c = new C();
    chai.expect(c.toJSON()).to.deep.equal({num: 5});
    c.vNum = 10;
    chai.expect(c.toJSON()).to.deep.equal({num: 5});
    chai.expect(c.vNum).to.deep.equal(10);
  });

  describe('constraint', () => {

    it('should validate', () => {

      @ConfigClass()
      class C extends ConfigClassMethods {

        @ConfigProperty({
          constraint: {assert: v => v >= 5}
        })
        num: number = 5;


      }

      const c = new C();
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
      class C extends ConfigClassMethods {

        @ConfigProperty({
          constraint: {assert: v => v >= 5, fallBackValue: 10}
        })
        num: number = 5;


      }

      const c = new C();
      try {
        c.num = 1;
      } catch (e) {
      }
      chai.expect(c.toJSON()).to.deep.equal({num: 10});

    });
    it('should error on default value error ', () => {
      @ConfigClass()
      class C extends ConfigClassMethods {

        @ConfigProperty({
          constraint: {assert: v => v >= 5, fallBackValue: 10}
        })
        num: number = 1;
      }

      chai.expect(() => new C()).to.throw(Error, 'Constraint');

    });

    it('should print custom assert reason', () => {
      @ConfigClass()
      class C extends ConfigClassMethods {

        @ConfigProperty({
          constraint: {assert: v => v >= 5, assertReason: 'Should be greater than five'}
        })
        num: number = 5;
      }

      const c = new C();
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
      class C extends ConfigClassMethods {

        @ConfigProperty({
          constraint: {assert: v => v >= 5, fallBackValue: 10, assertReason: 'Should be greater than five'}
        })
        num: number = 5;
      }

      const c = new C();
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
      class C extends ConfigClassMethods {

        @ConfigProperty()
        num: number = 5;

        @ConfigProperty()
        sub: Sub = new Sub();
      }

      const c = new C();
      chai.expect(() => {
        c.num = 0;
        console.log('lefut', c);
      }).to.throw(Error, 'Constraint');
    });


    it('should cascade', () => {


      @ConfigClass()
      class C extends ConfigClassMethods {
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

      const c = new C();

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
      class C extends ConfigClassMethods {
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

      const c = new C();

      chai.expect(c.toJSON()).to.deep.equal({a: 5, b: 5, sub: {c: 5}});
      chai.expect(() => {
        c.a = 1;
      }).to.throw(Error, 'Constraint');
      chai.expect(c.toJSON()).to.deep.equal({a: 1, b: 2, sub: {c: 3}});
    });


  });


  describe('env alias', () => {
    afterEach(() => {
      delete process.env['numAlias'];
    });

    it('should be loaded', async () => {

      @ConfigClass()
      class C extends ConfigClassMethods {

        @ConfigProperty({envAlias: 'numAlias'})
        num: number = 5;

        @ConfigProperty()
        num2: number = 10;

      }

      const c = new C();
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
      class C extends ConfigClassMethods {


        @ConfigProperty()
        sub: S = new S();

      }

      const c = new C();
      chai.expect(c.toJSON()).to.deep.equal({sub: {num: 5}});
      process.env['numAlias'] = '100';
      await c.load();
      chai.expect(c.toJSON()).to.deep.equal({sub: {num: 100}});

    });
  });
});
