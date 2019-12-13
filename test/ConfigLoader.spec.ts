import {ConfigLoader} from '../src/ConfigLoader';

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
    expect(testObj.sub.data.a).toEqual('2');
    expect(testObj.sub.data.b).toEqual('testText');
    expect(testObj.sub2.data).toEqual(10);
  });


});
