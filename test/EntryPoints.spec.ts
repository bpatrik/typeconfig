import * as common from '../common.js';
import * as node from '../node.js';
import * as web from '../web.js';

import * as chaiModule from 'chai';

const chai: any = chaiModule;

/**
 * The runtime exports of the public entry points. (Their types are checked at compile time.)
 */
describe('entry points', () => {

  it('common should export the environment-agnostic API', () => {
    chai.expect(Object.keys(common).sort()).to.deep.equal([
      'ConfigDefaults', 'ConfigMap', 'ConfigProperty', 'ConfigState',
      'ConstraintError', 'GenericConfigType', 'SubConfigClass'
    ]);
  });

  it('node should export the node root config', () => {
    chai.expect(Object.keys(node).sort()).to.deep.equal(['ConfigClass', 'ConfigClassBuilder']);
  });

  it('web should export the browser root config', () => {
    chai.expect(Object.keys(web).sort()).to.deep.equal(['WebConfigClass', 'WebConfigClassBuilder']);
  });
});
