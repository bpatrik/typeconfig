import {WebConfigLoader} from '../src/WebConfigLoader.js';

import * as chaiModule from 'chai';

const chai: any = chaiModule;

describe('WebConfigLoader', () => {

  it('should load the frontend config', () => {
    const target = {a: 1, arr: [1], sub: {b: 'x'}};
    WebConfigLoader.loadFrontendConfig(target, {a: 2, arr: [3, 4], sub: {b: 'y'}, unknown: true});
    chai.expect(target).to.deep.equal({a: 2, arr: [3, 4], sub: {b: 'y'}});
  });

  describe('url params', () => {

    const g = globalThis as { window?: unknown };
    const originalWindow = g.window;
    afterEach(() => {
      g.window = originalWindow;
    });

    it('should load url params into the config', () => {
      g.window = {location: {search: '?a=5&sub-b=hello+world&sub-c=%C3%A1rv%C3%ADz&flag=true&unknown=1'}};
      const target = {a: 1, sub: {b: '', c: ''}, flag: false};
      WebConfigLoader.loadUrlParams(target);
      chai.expect(target).to.deep.equal({a: '5', sub: {b: 'hello world', c: 'árvíz'}, flag: true});
    });
  });
});
