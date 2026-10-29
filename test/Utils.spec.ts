import {Utils} from '../src/Utils.js';

import * as chaiModule from 'chai';

const chai: any = chaiModule;

describe('Utils', () => {

  it('should detect numeric enums', () => {
    enum Numeric {
      a = 1, b = 5
    }

    chai.expect(Utils.isEnum(Numeric)).to.equal(true);
  });

  it('should detect string enums', () => {
    enum Text {
      a = 'a', b = 'b'
    }

    chai.expect(Utils.isEnum(Text)).to.equal(true);
  });

  it('should not detect other values as enum', () => {
    chai.expect(Utils.isEnum(undefined)).to.equal(false);
    chai.expect(Utils.isEnum(null)).to.equal(false);
    chai.expect(Utils.isEnum('string')).to.equal(false);
    chai.expect(Utils.isEnum('integer')).to.equal(false);
    chai.expect(Utils.isEnum(5)).to.equal(false);
    chai.expect(Utils.isEnum({})).to.equal(false);
    chai.expect(Utils.isEnum({a: 'b'})).to.equal(false);
    chai.expect(Utils.isEnum({a: 1})).to.equal(false);
    chai.expect(Utils.isEnum({a: true})).to.equal(false);
    chai.expect(Utils.isEnum(Number)).to.equal(false);
  });
});
