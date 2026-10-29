import 'reflect-metadata';
import {ConfigClassBase} from '../../src/decorators/class/base/ConfigClassBase.js';
import {ConfigClass} from '../../src/decorators/class/ConfigClass.js';
import {SubConfigClass} from '../../src/decorators/class/SubConfigClass.js';
import {ConfigProperty} from '../../src/decorators/property/ConfigPropoerty.js';
import {ConfigClassBuilder} from '../../src/decorators/builders/ConfigClassBuilder.js';

import * as chaiModule from 'chai';

const chai: any = chaiModule;

describe('ConfigClassBase', () => {

  it('should require options', () => {
    chai.expect(() => ConfigClassBase(class {
    }, undefined)).to.throw(Error, 'options not set');
  });

  it('should leave creating new instances to the decorators', () => {
    const Base = ConfigClassBase(class {
    }, {});
    chai.expect(() => new Base().__getNewInstance()).to.throw(Error, 'Not implemented');
  });

  it('should detect config classes', () => {
    @ConfigClass()
    class C {
      @ConfigProperty()
      num: number = 5;
    }

    const Base = ConfigClassBase(class {
    }, {});
    chai.expect(Base.isConfigClassBaseCtor(C)).to.equal(true);
    chai.expect(Base.isConfigClassBaseCtor(class {
    })).to.equal(false);
    chai.expect(Base.isConfigClassBase(new C())).to.equal(true);
    chai.expect(Base.isConfigClassBase({})).to.equal(false);
  });

  it('should only add and remove properties dynamically on generic config types', () => {
    @ConfigClass()
    class C {
      @ConfigProperty()
      num: number = 5;
    }

    const c = ConfigClassBuilder.attachPrivateInterface(new C());
    chai.expect(() => c.__addPropertyDynamically('other', {type: 'integer'}, 1)).to.throw(Error, 'Unintended use');
    chai.expect(() => c.__removePropertyDynamically('num')).to.throw(Error, 'Unintended use');
    chai.expect(c.toJSON()).to.deep.equal({num: 5});
  });

  describe('loading', () => {

    it('should ignore missing and unknown inputs', () => {
      @ConfigClass()
      class C {
        @ConfigProperty()
        num: number = 5;
      }

      const c = ConfigClassBuilder.attachPrivateInterface(new C());
      chai.expect(c.__loadJSONObject(null)).to.equal(false);
      chai.expect(c.__loadJSONObject(undefined)).to.equal(false);
      c.__loadDefaultsJSONObject(null);
      c.__loadDefaultsJSONObject({unknown: 1, num: undefined});
      c.__loadStateJSONObject(null);
      c.__loadStateJSONObject({unknown: {readonly: true}});
      chai.expect(c.toJSON({attachState: true})).to.deep.equal({num: 5, __state: {num: {default: 5}}});
    });

    it('should load volatile state', () => {
      @ConfigClass()
      class C {
        @ConfigProperty()
        num: number = 5;
      }

      const c = ConfigClassBuilder.attachPrivateInterface(new C());
      c.__loadStateJSONObject({num: {volatile: true}});
      chai.expect(c.__state.num.volatile).to.equal(true);
      chai.expect(c.toJSON()).to.deep.equal({});
    });

    it('should load defaults into the default sub config', () => {
      @SubConfigClass()
      class Sub {
        @ConfigProperty()
        a: number = 1;
      }

      @ConfigClass()
      class C {
        @ConfigProperty({type: Sub})
        sub: Sub = new Sub();
      }

      const c = ConfigClassBuilder.attachPrivateInterface(new C());
      // the default can also be a config class, not just a plain JSON
      c.__state.sub.default = new Sub();
      c.__loadDefaultsJSONObject({sub: {a: 3}});
      chai.expect(c.__state.sub.default.toJSON()).to.deep.equal({a: 3});
    });

    it('should reject a string that is not a JSON array for an array', () => {
      @ConfigClass()
      class C {
        @ConfigProperty({arrayType: 'integer'})
        arr: number[] = [1];
      }

      const c = ConfigClassBuilder.attachPrivateInterface(new C());
      chai.expect(() => c.__loadJSONObject({arr: 'not an array'})).to.throw(Error, 'should be an array');
      c.__loadJSONObject({arr: '[2, 3]'});
      chai.expect(c.arr).to.deep.equal([2, 3]);
    });
  });

  describe('validation', () => {

    it('should support arrays of arrays', () => {
      @ConfigClass()
      class C {
        @ConfigProperty({arrayType: 'array'})
        arr: number[][] = [[1, 2]];
      }

      const c = ConfigClassBuilder.attachPrivateInterface(new C());
      c.arr = [[3], [4, 5]];
      chai.expect(c.toJSON()).to.deep.equal({arr: [[3], [4, 5]]});
    });

  });

  describe('toJSON', () => {

    it('should preserve infinite numbers', () => {
      @ConfigClass()
      class C {
        @ConfigProperty({type: 'float'})
        pos: number = Infinity;

        @ConfigProperty({type: 'float'})
        neg: number = -Infinity;
      }

      const c = ConfigClassBuilder.attachPrivateInterface(new C());
      chai.expect(c.toJSON()).to.deep.equal({pos: Infinity, neg: -Infinity});
    });

    it('should print enums as string', () => {
      enum E {
        a, b
      }

      @ConfigClass()
      class C {
        @ConfigProperty({type: E})
        e: E = E.b;
      }

      const c = ConfigClassBuilder.attachPrivateInterface(new C());
      chai.expect(c.toJSON()).to.deep.equal({e: E.b});
      chai.expect(c.toJSON({enumsAsString: true})).to.deep.equal({e: 'b'});
    });

    it('should attach the state of a sub config that is not set', () => {
      @SubConfigClass()
      class Sub {
        @ConfigProperty()
        a: number = 1;
      }

      @ConfigClass()
      class C {
        @ConfigProperty({type: Sub})
        sub: Sub = null;
      }

      const c = ConfigClassBuilder.attachPrivateInterface(new C());
      c.__state.sub.default = new Sub();
      chai.expect(c.toJSON({attachState: true})).to.deep.equal({sub: null, __state: {sub: {a: {default: 1, type: 'float'}}}});
    });

    it('should skip default values when a sub config is not set', () => {
      @SubConfigClass()
      class Sub {
        @ConfigProperty()
        a: number = 1;
      }

      @ConfigClass()
      class C {
        @ConfigProperty()
        num: number = 5;

        @ConfigProperty({type: Sub})
        sub: Sub = new Sub();
      }

      const c = ConfigClassBuilder.attachPrivateInterface(new C());
      c.sub = null;
      c.num = 6;
      chai.expect(c.toJSON({skipDefaultValues: true})).to.deep.equal({num: 6, sub: null});
    });
  });

  describe('defaults', () => {

    @SubConfigClass()
    class Sub {
      @ConfigProperty()
      a: number = 1;
    }

    @ConfigClass()
    class C {
      @ConfigProperty()
      num: number = 5;

      @ConfigProperty({type: Sub})
      sub: Sub = new Sub();

      @ConfigProperty({arrayType: Sub})
      subs: Sub[] = [new Sub(), new Sub()];

      @ConfigProperty({arrayType: 'integer'})
      nums: number[] = [1, 2];
    }

    it('should get the defaults', () => {
      const c = ConfigClassBuilder.attachPrivateInterface(new C());
      c.num = 6;
      c.sub.a = 2;
      c.subs[0].a = 3;
      c.nums = [3, 4];
      chai.expect(c.__getDefault()).to.deep.equal({num: 5, sub: {a: 1}, subs: [{a: 1}, {a: 1}], nums: [1, 2]});
    });

    it('should get the hard defaults', () => {
      const c = ConfigClassBuilder.attachPrivateInterface(new C());
      c.__loadDefaultsJSONObject({num: 10});
      chai.expect(c.__getPropertyHardDefault('unknown')).to.equal(undefined);
      chai.expect(c.__getHardDefault()).to.deep.equal({num: 5, sub: {a: 1}, subs: [{a: 1}, {a: 1}], nums: [1, 2]});

      // the hard default can also hold config classes
      c.__state.sub.hardDefault = new Sub();
      c.__state.subs.hardDefault = [new Sub(), {a: 4}];
      chai.expect(c.__getPropertyHardDefault('sub')).to.deep.equal({a: 1});
      chai.expect(c.__getPropertyHardDefault('subs')).to.deep.equal([{a: 1}, {a: 4}]);
    });

    it('should tell if an array of sub configs has its default value', () => {
      const c = ConfigClassBuilder.attachPrivateInterface(new C());
      chai.expect(c.__isPropertyDefault('subs')).to.equal(true);
      c.subs[1].a = 3;
      chai.expect(c.__isPropertyDefault('subs')).to.equal(false);
      chai.expect(c.__isDefault()).to.equal(false);
    });

    it('should reject unknown properties', () => {
      const c = ConfigClassBuilder.attachPrivateInterface(new C());
      chai.expect(() => c.__getPropertyDefault('unknown')).to.throw(Error, 'Unknown property "unknown"');
      chai.expect(() => c.__isPropertyDefault('unknown')).to.throw(Error, 'Unknown property "unknown"');
    });
  });

  describe('man page', () => {

    it('should print enum and object defaults and skip volatile properties', () => {
      enum E {
        a, b
      }

      @ConfigClass()
      class C {
        @ConfigProperty({type: E})
        e: E = E.b;

        @ConfigProperty({arrayType: 'integer'})
        nums: number[] = [1, 2];

        @ConfigProperty({volatile: true})
        hiddenVolatileProperty: number = 5;
      }

      const man = ConfigClassBuilder.attachPrivateInterface(new C()).__printMan();
      chai.expect(man).to.contain('--e        (default: \'b\')');
      chai.expect(man).to.contain('--nums     (default: [1,2])');
      chai.expect(man).to.not.contain('hiddenVolatileProperty');
    });
  });
});
