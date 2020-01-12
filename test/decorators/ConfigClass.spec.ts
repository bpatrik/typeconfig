import 'reflect-metadata';
import {ConfigClass} from '../../src/decorators/class/ConfigClass';
import {ConfigProperty} from '../../src/decorators/ConfigPropoerty';
import {ConfigClassMethods} from '../../src/decorators/class/RootConfigClassFactory';
import {TestHelper} from '../TestHelper';
import {promises as fsp} from 'fs';
import * as fs from 'fs';
import * as optimist from 'optimist';

const chai: any = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const should = chai.should();

describe('ConfigClass', () => {


  it('should have description', () => {

    @ConfigClass({attachDescription: true})
    class C extends ConfigClassMethods {

      @ConfigProperty({description: 'this is a number'})
      num: number = 5;
    }

    const c = new C();
    chai.expect(c.toJSON()).to.deep.equal({num: 5, '//num': 'this is a number'});
    c.num = 10;
    chai.expect(c.toJSON()).to.deep.equal({num: 10, '//num': 'this is a number'});
  });

  it('should have defaults', () => {

    @ConfigClass({attachDefaults: true})
    class C extends ConfigClassMethods {

      @ConfigProperty()
      num: number = 5;
    }

    const c = new C();
    chai.expect(c.toJSON()).to.deep.equal({num: 5, __defaults: {num: 5}});
    c.num = 10;
    chai.expect(c.toJSON()).to.deep.equal({num: 10, __defaults: {num: 5}});
  });

  it('should JSON keep description-value order', () => {

    @ConfigClass({attachDescription: true})
    class C extends ConfigClassMethods {

      @ConfigProperty({description: 'this is a number'})
      num: number = 5;

      @ConfigProperty({description: 'this is an other number'})
      num2: number = 5;
    }

    const c = new C();
    chai.expect(JSON.stringify(c)).to.equal('{"//num":"this is a number","num":5,"//num2":"this is an other number","num2":5}');
  });
  // describe('man page', () => {
  //   it('should JSON keep description-value order', () => {
  //
  //     @ConfigClass({attachDescription: true})
  //     class C extends ConfigClassMethods {
  //
  //       @ConfigProperty({description: 'this is a number'})
  //       num: number = 5;
  //
  //     }
  //
  //     const c = new C();
  //     console.log(c.___printMan());
  //     chai.expect(c.___printMan()).to.equal('{"//num":"this is a number","num":5,"//num2":"this is an other number","num2":5}');
  //   });
  // });


  describe('config file', () => {

    const filePath = TestHelper.getFilePath('testConf.json');
    let saveENV = JSON.parse(JSON.stringify(process.env));
    beforeEach(async () => {
      await TestHelper.cleanTempFolder();
      process.env = saveENV;
    });
    afterEach(async () => {
      await TestHelper.removeTempFolder();
      process.env = saveENV;
      delete process.env['num'];
      delete process.env['num2'];
    });

    it('should save', async () => {

      @ConfigClass({configPath: filePath})
      class C extends ConfigClassMethods {

        @ConfigProperty()
        num: number = 5;

      }

      const c = new C();
      chai.expect(fsp.access(filePath)).to.rejectedWith();
      await c.load();
      chai.expect(fsp.access(filePath)).not.to.rejectedWith();
      chai.expect(JSON.parse(await fsp.readFile(filePath, 'utf8'))).to.deep.equal({num: 5});
    });

    it('should save with comments', async () => {
      @ConfigClass({configPath: filePath, attachDescription: true})
      class C extends ConfigClassMethods {
        @ConfigProperty({description: 'its a number'})
        num: number = 5;
      }

      const c = new C();
      await chai.expect(fsp.access(filePath)).to.rejectedWith('ENOENT: no such file or directory');
      await c.load();
      await chai.expect(fsp.access(filePath)).not.to.rejectedWith();
      const loaded =  JSON.parse(await fsp.readFile(filePath, 'utf8'));
      chai.expect(loaded).to.deep.equal({num: 5, '//num': 'its a number'});
    });


    it('should rewrite cli arguments', async () => {
      @ConfigClass({configPath: filePath, rewriteCLIConfig: true})
      class C extends ConfigClassMethods {
        @ConfigProperty({description: 'its a number'})
        num: number = 5;
      }

      optimist.argv['num'] = 10;
      const c = new C();
      chai.expect(c.num).to.equal(5);
      await chai.expect(fsp.access(filePath)).to.rejectedWith('ENOENT: no such file or directory');
      await c.load();
      await chai.expect(fsp.access(filePath)).not.to.rejectedWith();
      const loaded =  JSON.parse(await fsp.readFile(filePath, 'utf8'));
      chai.expect(loaded).to.deep.equal({num: 10});
    });

    it('should rewrite env arguments', async () => {
      @ConfigClass({configPath: filePath, rewriteENVConfig: true})
      class C extends ConfigClassMethods {
        @ConfigProperty({description: 'its a number'})
        num: number = 5;
      }

      process.env['num'] = '10';
      const c = new C();
      chai.expect(c.num).to.equal(5);
      await chai.expect(fsp.access(filePath)).to.rejectedWith('ENOENT: no such file or directory');
      await c.load();
      await chai.expect(fsp.access(filePath)).not.to.rejectedWith();
      const loaded =  JSON.parse(await fsp.readFile(filePath, 'utf8'));
      chai.expect(loaded).to.deep.equal({num: 10});
    });

    it('should not rewrite env and cli arguments', async () => {
      @ConfigClass({configPath: filePath})
      class C extends ConfigClassMethods {
        @ConfigProperty({description: 'its a number'})
        num: number = 5;

        @ConfigProperty()
        num2: number = 5;
      }

      optimist.argv['num'] = 10;
      process.env['num2'] = '10';
      const c = new C();
      chai.expect(c.num).to.equal(5);
      await chai.expect(fsp.access(filePath)).to.rejectedWith('ENOENT: no such file or directory');
      await c.load();
      await chai.expect(fsp.access(filePath)).not.to.rejectedWith();
      chai.expect(JSON.parse(await fsp.readFile(filePath, 'utf8'))).to.deep.equal({num: 5, num2: 5});
    });


  });


});
