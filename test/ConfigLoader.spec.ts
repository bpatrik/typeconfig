import {ConfigLoader} from '../src/ConfigLoader.js';
import {TestHelper} from './TestHelper.js';
import {promises as fsp} from 'fs';

import * as chaiModule from 'chai';

const chai: any = chaiModule;
const should = chai.should();

describe('ConfigLoader', () => {

  const cleanUp = () => {
    delete process.env['sub-data-a'];
  };
  beforeEach(cleanUp);
  afterEach(cleanUp);

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

  it('Should set from env aliases', () => {
    const testObj = {sub: {data: {a: '0'}}};
    process.env['TEST_ALIAS_A'] = '3';
    try {
      chai.expect(ConfigLoader.processEnvVariables(testObj, [{key: 'sub-data-a', alias: 'TEST_ALIAS_A'}])).to.equal(true);
    } finally {
      delete process.env['TEST_ALIAS_A'];
    }
    should.equal(testObj.sub.data.a, '3');
  });

  it('Should parse cli arguments', () => {
    chai.expect(ConfigLoader.getCLIArgsAsObject(['node', 'app.js', '--sub-data-a=5', '--flag', '--text=false', 'positional']))
      .to.deep.equal({sub: {data: {a: 5}}, flag: true, text: false});
  });

  describe('config file', () => {

    beforeEach(async () => {
      await TestHelper.cleanTempFolder();
    });

    afterEach(async () => {
      await TestHelper.removeTempFolder();
    });

    it('Should save and load', async () => {
      const filePath = TestHelper.getFilePath('legacy.json');
      await ConfigLoader.saveJSONConfigFile(filePath, {a: 1, sub: {b: 'x'}});
      const loaded = {a: 0, sub: {b: ''}};
      chai.expect(await ConfigLoader.loadJSONConfigFile(filePath, loaded)).to.equal(true);
      chai.expect(loaded).to.deep.equal({a: 1, sub: {b: 'x'}});
    });

    it('Should report missing and broken files', async () => {
      chai.expect(await ConfigLoader.loadJSONConfigFile(TestHelper.getFilePath('missing.json'), {})).to.equal(false);
      const filePath = TestHelper.getFilePath('broken.json');
      await fsp.writeFile(filePath, '{ not json');
      chai.expect(await ConfigLoader.loadJSONConfigFile(filePath, {})).to.equal(false);
    });

    it('Should create the config file if it does not exist', async () => {
      const filePath = TestHelper.getFilePath('created.json');
      await ConfigLoader.loadBackendConfig({a: 1}, filePath);
      chai.expect(JSON.parse(await fsp.readFile(filePath, 'utf8'))).to.deep.equal({a: 1});
    });

    it('Should rewrite the config file with the env variables', async () => {
      const filePath = TestHelper.getFilePath('rewrite.json');
      const testObj = {sub: {data: {a: '0'}}};
      await ConfigLoader.loadBackendConfig(testObj, filePath);
      process.env['sub-data-a'] = '2';
      await ConfigLoader.loadBackendConfig(testObj, filePath, [], true);
      chai.expect(JSON.parse(await fsp.readFile(filePath, 'utf8'))).to.deep.equal({sub: {data: {a: '2'}}});
    });
  });

});
