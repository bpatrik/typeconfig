import {ConfigLoader} from '../src/ConfigLoader';

describe('ConfigLoader', () => {


  it('Should set from env variables', () => {
    const testObj = {
      sub: {
        data: '0'
      }
    };
    process.env['sub-data'] = '2';
    ConfigLoader.loadBackendConfig(testObj);
    expect(testObj.sub.data).toEqual('2');
  });

  it('Should set from cli variables', () => {
    const testObj = {
      sub: {
        data: '0'
      }
    };
    process.argv.push('sub-data=2');
    ConfigLoader.loadBackendConfig(testObj);
    expect(testObj.sub.data).toEqual('2');
  });


});
