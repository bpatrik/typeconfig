import 'reflect-metadata';
import {ConfigClass, ConfigClassOptions} from '../../src/decorators/class/ConfigClass';
import {ConfigProperty} from '../../src/decorators/property/ConfigPropoerty';
import {TestHelper} from '../TestHelper';
import {promises as fsp} from 'fs';
import * as optimist from 'optimist';
import {ConfigClassBuilder} from '../../src/decorators/builders/ConfigClassBuilder';
import {SubConfigClass} from '../../src/decorators/class/SubConfigClass';

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
    it('should not cli settings', () => {

      @ConfigClass({attachDescription: true})
      class C {

        @ConfigProperty({description: 'this is a number'})
        num: number = 5;

      }

      const c = ConfigClassBuilder.attachPrivateInterface(new C());
      chai.expect(c.__printMan()).to.equal('Usage: <appname> [options] \n' +
        '\n' +
        'Meta options: \n' +
        '--help                           prints this manual \n' +
        '\n' +
        '<appname> can be configured through the configuration file, cli switches and environmental variables. \n' +
        'All settings are case sensitive. \n' +
        'Example for setting config MyConf through cli: \'<appname> --MyConf=5\' \n' +
        'and through env variable: \'SET MyConf=5\' . \n' +
        '\n' +
        'App options: \n' +
        '--num  this is a number (default: 5)\n');

    });

    it('should add cli settings', () => {

      @ConfigClass({
        attachDescription: true, cli: {
          enable: {
            configPath: true,
            attachDefaults: true,
            attachDescription: true,
            rewriteCLIConfig: true,
            rewriteENVConfig: true,
            enumsAsString: true,
            saveIfNotExist: true,
            exitOnConfig: true
          }
        }
      })
      class C {

        @ConfigProperty({description: 'this is a number'})
        num: number = 5;

      }

      const c = ConfigClassBuilder.attachPrivateInterface(new C());
      chai.expect(c.__printMan()).to.equal('Usage: <appname> [options] \n' +
        '\n' +
        'Meta options: \n' +
        '--help                           prints this manual \n' +
        '--config-path                    sets the config file location \n' +
        '--config-attachDefs              prints the defaults to the config file \n' +
        '--config-attachDesc              prints description to the config file \n' +
        '--config-rewrite-cli             updates the config file with the options from cli switches \n' +
        '--config-rewrite-env             updates the config file with the options from environmental variables \n' +
        '--config-string-enum             enums are stored as string in the config file (instead of numbers) \n' +
        '--config-save-if-not-exist       creates config file if not exist \n' +
        '--config-save-and-exist          creates config file and terminates \n' +
        '\n' +
        '<appname> can be configured through the configuration file, cli switches and environmental variables. \n' +
        'All settings are case sensitive. \n' +
        'Example for setting config MyConf through cli: \'<appname> --MyConf=5\' \n' +
        'and through env variable: \'SET MyConf=5\' . \n' +
        '\n' +
        'App options: \n' +
        '--num  this is a number (default: 5)\n');

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
      chai.expect(c.toJSON()).to.deep.equal({num: 5});
      await c.load();
      chai.expect(c.toJSON()).to.deep.equal({num: 5});
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


    it('should load config-array type', async () => {

      @SubConfigClass()
      class SubC {


        @ConfigProperty()
        num: number = 5;

        constructor(num: number) {
          this.num = num;
        }

      }

      @ConfigClass({configPath: filePath})
      class C {

        @ConfigProperty({arrayType: SubC})
        subArr: SubC[] = [new SubC(10), new SubC(12)];

      }

      const c = ConfigClassBuilder.attachPrivateInterface(new C());
      const c2 = ConfigClassBuilder.attachPrivateInterface(new C());
      chai.expect(c.toJSON()).to.deep.equal({subArr: [{num: 10}, {num: 12}]});
      c.subArr[0].num = 100;
      c.subArr[1].num = 200;
      chai.expect(c.toJSON()).to.deep.equal({subArr: [{num: 100}, {num: 200}]});
      await c.load();
      chai.expect(c.toJSON()).to.deep.equal({subArr: [{num: 100}, {num: 200}]});
      chai.expect(c2.toJSON()).to.deep.equal({subArr: [{num: 10}, {num: 12}]});
      await c2.load();
      chai.expect(c2.toJSON()).to.deep.equal({subArr: [{num: 100}, {num: 200}]});
      c2.subArr = [];
      await c2.load();
      chai.expect(c2.toJSON()).to.deep.equal({subArr: [{num: 100}, {num: 200}]});
      chai.expect((<any>c2.subArr[0]).toJSON()).to.deep.equal({num: 100});
    });


  });

  describe('cli options', () => {

    beforeEach(()=>{

      delete optimist.argv['--config-path'];
      delete optimist.argv['--config-attachDefs'];
      delete optimist.argv['--config-attachDesc'];
      delete optimist.argv['--config-rewrite-cli'];
      delete optimist.argv['--config-rewrite-env'];
      delete optimist.argv['--config-string-enum'];
      delete optimist.argv['--config-save-and-exist'];
      delete optimist.argv['--config-save-if-not-exist'];
    });


    it('should not set', async () => {
      @ConfigClass({
        cli: {
          enable: {
            configPath: true,
            attachDefaults: true,
            attachDescription: true,
            rewriteCLIConfig: true,
            rewriteENVConfig: true,
            enumsAsString: true,
            saveIfNotExist: true,
            exitOnConfig: true
          }
        }
      })
      class C {

        @ConfigProperty({description: 'this is a number'})
        num: number = 5;

      }

      let c = ConfigClassBuilder.attachPrivateInterface(new C());
      let opts:ConfigClassOptions = c.__options;

      chai.expect(opts.configPath).to.not.equal('test');
      chai.expect(opts.enumsAsString).to.not.equal(true);
      chai.expect(opts.attachDescription).to.not.equal(true);
      chai.expect(opts.rewriteENVConfig).to.not.equal(true);
      chai.expect(opts.rewriteCLIConfig).to.not.equal(true);
      chai.expect(opts.attachDefaults).to.not.equal(true);
      chai.expect(opts.saveIfNotExist).to.not.equal(false);


    });

    it('should set', async () => {

      optimist.argv['--config-path'] = 'test';
      optimist.argv['--config-attachDefs'] = true;
      optimist.argv['--config-attachDesc'] = true;
      optimist.argv['--config-rewrite-cli'] = true;
      optimist.argv['--config-rewrite-env'] = true;
      optimist.argv['--config-string-enum'] = true;
      optimist.argv['--config-save-and-exist'] = true;
      optimist.argv['--config-save-if-not-exist'] = false;
      @ConfigClass({
        cli: {
          enable: {
            configPath: true,
            attachDefaults: true,
            attachDescription: true,
            rewriteCLIConfig: true,
            rewriteENVConfig: true,
            enumsAsString: true,
            saveIfNotExist: true,
            exitOnConfig: true
          }
        }
      })
      class C {

        @ConfigProperty({description: 'this is a number'})
        num: number = 5;

      }


      const c = ConfigClassBuilder.attachPrivateInterface(new C());
      const opts:ConfigClassOptions = c.__options;
      chai.expect(opts.configPath).to.equal('test');
      chai.expect(opts.enumsAsString).to.equal(true);
      chai.expect(opts.attachDescription).to.equal(true);
      chai.expect(opts.rewriteENVConfig).to.equal(true);
      chai.expect(opts.rewriteCLIConfig).to.equal(true);
      chai.expect(opts.attachDefaults).to.equal(true);
      chai.expect(opts.saveIfNotExist).to.equal(false);

    });

  });


});
