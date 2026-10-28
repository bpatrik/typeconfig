import {Loader} from '../src/Loader.js';

import * as chaiModule from 'chai';

const chai: any = chaiModule;

describe('Loader', () => {

  describe('flatToObjHierarchy', () => {

    it('should split keys by dash into nested objects', () => {
      chai.expect(Loader.flatToObjHierarchy({'a-b-c': 1, 'a-d': 'text', e: 2}))
        .to.deep.equal({a: {b: {c: 1}, d: 'text'}, e: 2});
    });

    it('should convert boolean strings', () => {
      chai.expect(Loader.flatToObjHierarchy({a: 'true', b: 'FALSE', c: 'truthy'}))
        .to.deep.equal({a: true, b: false, c: 'truthy'});
    });
  });

  describe('loadObject', () => {

    it('should only set known keys and report changes', () => {
      const target = {a: 1, sub: {b: 'x', c: 2}};
      chai.expect(Loader.loadObject(target, {a: 1, unknown: 5, sub: {b: 'y'}})).to.equal(true);
      chai.expect(target).to.deep.equal({a: 1, sub: {b: 'y', c: 2}});
      chai.expect(Loader.loadObject(target, {a: 1, sub: {b: 'y'}})).to.equal(false);
    });

    it('should replace arrays', () => {
      const target = {arr: [1, 2, 3]};
      chai.expect(Loader.loadObject(target, {arr: [4]})).to.equal(true);
      chai.expect(target).to.deep.equal({arr: [4]});
    });

    it('should load hierarchy variables', () => {
      const target = {a: {b: 1}};
      chai.expect(Loader.processHierarchyVar(target, {'a-b': 5})).to.equal(true);
      chai.expect(target).to.deep.equal({a: {b: 5}});
    });
  });
});
