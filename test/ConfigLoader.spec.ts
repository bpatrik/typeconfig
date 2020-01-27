import {ConfigLoader} from '../src/ConfigLoader';

const chai: any = require('chai');
const should = chai.should();

describe('ConfigLoader', () => {


  it('Should set from env variables', () => {
    const testObj = {
      sub: {
        data: {
          a: '0',
          b: 'testText'
        }
      },
      sub2: {
        data: 10
      }
    };
    process.env['sub-data-a'] = '2';
    ConfigLoader.loadBackendConfig(testObj);
    should.equal(testObj.sub.data.a, '2');
    should.equal(testObj.sub.data.b, 'testText');
    should.equal(testObj.sub2.data, 10);
  });


});
