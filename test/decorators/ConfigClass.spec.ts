import 'reflect-metadata';
import {ConfigClass} from '../../src/decorators/class/ConfigClass';
import {ConfigProperty} from '../../src/decorators/property/ConfigPropoerty';
import {TestHelper} from '../TestHelper';
import {promises as fsp} from 'fs';
import * as optimist from 'optimist';
import {ConfigClassBuilder} from '../../src/decorators/builders/ConfigClassBuilder';

const chai: any = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const should = chai.should();

describe('ConfigClass', () => {

  it('should create distinct objects', () => {

    @ConfigClass()
    class C {
      @ConfigProperty()
      num: number = 5;
    }

    const c1 = ConfigClassBuilder.attachPrivateInterface(new C());
    const c2 = ConfigClassBuilder.attachPrivateInterface(new C());
    chai.expect(c1.toJSON()).to.deep.equal({num: 5});
    chai.expect(c1.toJSON()).to.deep.equal(c2.toJSON());
    c1.num = 10;
    chai.expect(c1.toJSON()).to.not.deep.equal(c2.toJSON());
  });

  it('should have description', () => {

    @ConfigClass({attachDescription: true})
    class C {

      @ConfigProperty({description: 'this is a number'})
      num: number = 5;
    }

    const c = ConfigClassBuilder.attachPrivateInterface(new C());
    chai.expect(c.toJSON()).to.deep.equal({num: 5, '//[num]': 'this is a number'});
    c.num = 10;
    chai.expect(c.toJSON()).to.deep.equal({num: 10, '//[num]': 'this is a number'});
  });

  it('should have defaults', () => {

    @ConfigClass({attachDefaults: true})
    class C {

      @ConfigProperty()
      num: number = 5;
    }

    const c = ConfigClassBuilder.attachPrivateInterface(new C());
    chai.expect(c.toJSON()).to.deep.equal({num: 5, __defaults: {num: 5}});
    c.num = 10;
    chai.expect(c.toJSON()).to.deep.equal({num: 10, __defaults: {num: 5}});
  });

  it('should JSON keep description-value order', () => {

    @ConfigClass({attachDescription: true})
    class C {

      @ConfigProperty({description: 'this is a number'})
      num: number = 5;

      @ConfigProperty({description: 'this is an other number'})
      num2: number = 5;
    }

    const c = ConfigClassBuilder.attachPrivateInterface(new C());
    chai.expect(JSON.stringify(c)).to.equal('{"//[num]":"this is a number","num":5,"//[num2]":"this is an other number","num2":5}');
  });

  describe('man page', () => {
    it('should JSON keep description-value order', () => {

     throw new Error('TODO implement');
    });
  });


  describe('config file', () => {

    const filePath = TestHelper.getFilePath('testConf.json');
    const saveENV = JSON.parse(JSON.stringify(process.env));
    beforeEach(async () => {
      await TestHelper.cleanTempFolder();
      process.env = saveENV;
    });
    afterEach(async () => {
      await TestHelper.removeTempFolder();
      process.env = saveENV;
      delete optimist.argv['num'];
      delete process.env['num'];
      delete process.env['num2'];
    });


    it('should load', async () => {

      @ConfigClass({configPath: filePath})
      class C {

        @ConfigProperty()
        num: number = 5;

      }

      @ConfigClass({configPath: filePath})
      class C2 {

        @ConfigProperty()
        num: number = 20;

      }

      const c = ConfigClassBuilder.attachPrivateInterface(new C());
      const c2 = ConfigClassBuilder.attachPrivateInterface(new C2());
      await c.load();
      chai.expect(c2.toJSON()).to.deep.equal({num: 20});
      await c2.load();
      chai.expect(c2.toJSON()).to.deep.equal({num: 5});
    });

    it('should save', async () => {

      @ConfigClass({configPath: filePath})
      class C {

        @ConfigProperty()
        num: number = 5;

      }

      const c = ConfigClassBuilder.attachPrivateInterface(new C());
      chai.expect(fsp.access(filePath)).to.rejectedWith();
      await c.load();
      chai.expect(fsp.access(filePath)).not.to.rejectedWith();
      chai.expect(JSON.parse(await fsp.readFile(filePath, 'utf8'))).to.deep.equal({num: 5});
    });

    it('should save with comments', async () => {
      @ConfigClass({configPath: filePath, attachDescription: true})
      class C {
        @ConfigProperty({description: 'its a number'})
        num: number = 5;
      }

      const c = ConfigClassBuilder.attachPrivateInterface(new C());
      await chai.expect(fsp.access(filePath)).to
        .rejectedWith('ENOENT: no such file or directory');
      await c.load();
      await chai.expect(fsp.access(filePath)).not.to.rejectedWith();
      const loaded = JSON.parse(await fsp.readFile(filePath, 'utf8'));
      chai.expect(loaded).to.deep.equal({num: 5, '//[num]': 'its a number'});
    });


    it('should rewrite cli arguments', async () => {
      @ConfigClass({configPath: filePath, rewriteCLIConfig: true})
      class C {
        @ConfigProperty({description: 'its a number'})
        num: number = 15;
      }

      optimist.argv['num'] = 101;
      const c = ConfigClassBuilder.attachPrivateInterface(new C());

      chai.expect(c.num).to.equal(15);
      await chai.expect(fsp.access(filePath)).to
        .rejectedWith('ENOENT: no such file or directory');
      await c.load();
      await chai.expect(fsp.access(filePath)).not.to.rejectedWith();
      const loaded = JSON.parse(await fsp.readFile(filePath, 'utf8'));
      chai.expect(loaded).to.deep.equal({num: 101});
    });

    it('should rewrite env arguments', async () => {
      @ConfigClass({configPath: filePath, rewriteENVConfig: true})
      class C {
        @ConfigProperty({description: 'its a number'})
        num: number = 25;
      }

      process.env['num'] = '110';
      const c = ConfigClassBuilder.attachPrivateInterface(new C());
      chai.expect(c.num).to.equal(25);
      await chai.expect(fsp.access(filePath)).to
        .rejectedWith('ENOENT: no such file or directory');
      await c.load();
      await chai.expect(fsp.access(filePath)).not.to.rejectedWith();
      const loaded = JSON.parse(await fsp.readFile(filePath, 'utf8'));
      chai.expect(loaded).to.deep.equal({num: 110});
    });

    it('should not rewrite env and cli arguments', async () => {
      @ConfigClass({configPath: filePath})
      class C {
        @ConfigProperty({description: 'its a number'})
        num: number = 55;

        @ConfigProperty()
        num2: number = 55;
      }

      optimist.argv['num'] = 120;
      process.env['num2'] = '120';
      const c = ConfigClassBuilder.attachPrivateInterface(new C());
      chai.expect(c.num).to.equal(55);
      await chai.expect(fsp.access(filePath)).to
        .rejectedWith('ENOENT: no such file or directory');
      await c.load();
      await chai.expect(fsp.access(filePath)).not.to.rejectedWith();
      chai.expect(JSON.parse(await fsp.readFile(filePath, 'utf8'))).to.deep.equal({num: 55, num2: 55});
    });

  });

  describe('cli options', () => {

    it('should set config path', async () => {
      throw new Error('TODO implement');
    });

  });


});
