/* tslint:disable:no-inferrable-types */
import 'reflect-metadata';
import {ConfigClass} from '../../src/decorators/class/ConfigClass';
import {ConfigProperty} from '../../src/decorators/property/ConfigPropoerty';
import {TestHelper} from '../TestHelper';
import {promises as fsp} from 'fs';
import * as optimist from 'optimist';
import {ConfigClassBuilder} from '../../src/decorators/builders/ConfigClassBuilder';
import {SubConfigClass} from '../../src/decorators/class/SubConfigClass';
import {ConfigClassOptions} from '../../src/decorators/class/IConfigClass';

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

  it('should JSON contain __state ', () => {

    @ConfigClass()
    class C {
      @ConfigProperty({readonly: true})
      num: number = 5;

      @ConfigProperty()
      num2: number = 5;
    }

    const c = ConfigClassBuilder.attachPrivateInterface(new C());
    chai.expect(c.toJSON({attachState: true})).to.deep.equal({__state: {num: {readonly: true}, num2: {}}, num: 5, num2: 5});
  });
  it('should JSON contain adds volatile ', () => {

    @ConfigClass()
    class C {
      @ConfigProperty({volatile: true})
      num: number = 5;

      @ConfigProperty()
      num2: number = 50;
    }

    const c = ConfigClassBuilder.attachPrivateInterface(new C());
    chai.expect(c.toJSON({attachVolatile: false})).to.deep.equal({num2: 50});
    chai.expect(c.toJSON({attachVolatile: true})).to.deep.equal({num: 5, num2: 50});
  });

  describe('man page', () => {

    it('should print default override options', () => {

      @ConfigClass({cli: {defaults: {enabled: true}}})
      class C {

        @ConfigProperty()
        num: number = 5;

      }

      const c = ConfigClassBuilder.attachPrivateInterface(new C());
      chai.expect(c.__printMan()).to.equal('Usage: <appname> [options] \n' +
        '\n' +
        'Meta cli options: \n' +
        '--help                           prints this manual \n' +
        '\n' +
        '<appname> can be configured through the configuration file, cli switches and environmental variables. \n' +
        'All settings are case sensitive. \n' +
        'Example for setting config MyConf through cli: \'<appname> --MyConf=5\' \n' +
        'and through env variable: \'SET MyConf=5\' . \n' +
        '\n' +
        'Default values can be also overwritten by prefixing the options with \'default-\', \n' +
        ' like \'<appname> --default-MyConf=5\' and  \'SET default-MyConf=5\'\n' +
        '\n' +
        'App CLI options: \n' +
        '  --num     (default: 5)\n' +
        '\n' +
        'Environmental variables: \n' +
        '  num   (default: 5)\n');

    });


    it('should not cli settings', () => {

      @ConfigClass({attachDescription: true})
      class C {

        @ConfigProperty({description: 'this is a number', envAlias: 'Number'})
        num: number = 5;

      }

      const c = ConfigClassBuilder.attachPrivateInterface(new C());
      chai.expect(c.__printMan()).to.equal('Usage: <appname> [options] \n' +
        '\n' +
        'Meta cli options: \n' +
        '--help                           prints this manual \n' +
        '\n' +
        '<appname> can be configured through the configuration file, cli switches and environmental variables. \n' +
        'All settings are case sensitive. \n' +
        'Example for setting config MyConf through cli: \'<appname> --MyConf=5\' \n' +
        'and through env variable: \'SET MyConf=5\' . \n' +
        '\n' +
        'App CLI options: \n' +
        '  --num    this is a number (default: 5)\n' +
        '\n' +
        'Environmental variables: \n' +
        '  num     this is a number (default: 5)\n' +
        '  Number   same as num\n');

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
        'Meta cli options: \n' +
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
        'App CLI options: \n' +
        '  --num    this is a number (default: 5)\n' +
        '\n' +
        'Environmental variables: \n' +
        '  num  this is a number (default: 5)\n');

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

        @ConfigProperty({readonly: true})
        roNum: number = 1000;

      }

      const c = ConfigClassBuilder.attachPrivateInterface(new C());
      const c2 = ConfigClassBuilder.attachPrivateInterface(new C2());
      chai.expect(c.toJSON()).to.deep.equal({num: 5});
      await c.load();
      chai.expect(c.toJSON()).to.deep.equal({num: 5});
      chai.expect(c2.toJSON()).to.deep.equal({num: 20, roNum: 1000});
      chai.expect(() => {
        c2.roNum = 11;
      }).to.throw(Error, 'readonly');
      await c2.load();
      chai.expect(c2.toJSON()).to.deep.equal({num: 5, roNum: 1000});
      c2.num = 999;
      chai.expect(c2.toJSON()).to.deep.equal({num: 999, roNum: 1000});
      chai.expect(() => {
        c2.roNum = 11;
      }).to.throw(Error, 'readonly');
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

    const cleanUp = () => {

      delete optimist.argv['config-path'];
      delete optimist.argv['config-attachDefs'];
      delete optimist.argv['config-attachDesc'];
      delete optimist.argv['config-rewrite-cli'];
      delete optimist.argv['config-rewrite-env'];
      delete optimist.argv['config-string-enum'];
      delete optimist.argv['config-save-and-exist'];
      delete optimist.argv['config-save-if-not-exist'];
    };
    beforeEach(cleanUp);
    afterEach(cleanUp);


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

      const c = ConfigClassBuilder.attachPrivateInterface(new C());
      const opts: ConfigClassOptions = c.__options;

      chai.expect(opts.configPath).to.not.equal('test');
      chai.expect(opts.enumsAsString).to.not.equal(true);
      chai.expect(opts.attachDescription).to.not.equal(true);
      chai.expect(opts.rewriteENVConfig).to.not.equal(true);
      chai.expect(opts.rewriteCLIConfig).to.not.equal(true);
      chai.expect(opts.attachDefaults).to.not.equal(true);
      chai.expect(opts.saveIfNotExist).to.not.equal(false);


    });

    it('should set', async () => {

      optimist.argv['config-path'] = 'test';
      optimist.argv['config-attachDefs'] = true;
      optimist.argv['config-attachDesc'] = true;
      optimist.argv['config-rewrite-cli'] = true;
      optimist.argv['config-rewrite-env'] = true;
      optimist.argv['config-string-enum'] = true;
      optimist.argv['config-save-and-exist'] = true;
      optimist.argv['config-save-if-not-exist'] = false;

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
      const opts: ConfigClassOptions = c.__options;
      chai.expect(opts.configPath).to.equal('test');
      chai.expect(opts.enumsAsString).to.equal(true);
      chai.expect(opts.attachDescription).to.equal(true);
      chai.expect(opts.rewriteENVConfig).to.equal(true);
      chai.expect(opts.rewriteCLIConfig).to.equal(true);
      chai.expect(opts.attachDefaults).to.equal(true);
      chai.expect(opts.saveIfNotExist).to.equal(false);

    });


    it('should not set', async () => {

      optimist.argv['config-path'] = 'test';
      optimist.argv['config-attachDefs'] = true;
      optimist.argv['config-attachDesc'] = true;
      optimist.argv['config-rewrite-cli'] = true;
      optimist.argv['config-rewrite-env'] = true;
      optimist.argv['config-string-enum'] = true;
      optimist.argv['config-save-and-exist'] = true;
      optimist.argv['config-save-if-not-exist'] = false;

      @ConfigClass()
      class C {

        @ConfigProperty({description: 'this is a number'})
        num: number = 5;

      }


      const c = ConfigClassBuilder.attachPrivateInterface(new C());
      const opts: ConfigClassOptions = c.__options;
      chai.expect(opts.configPath).to.not.equal('test');
      chai.expect(opts.enumsAsString).to.not.equal(true);
      chai.expect(opts.attachDescription).to.not.equal(true);
      chai.expect(opts.rewriteENVConfig).to.not.equal(true);
      chai.expect(opts.rewriteCLIConfig).to.not.equal(true);
      chai.expect(opts.attachDefaults).to.not.equal(true);
      chai.expect(opts.saveIfNotExist).to.not.equal(false);

    });

  });

  describe('defaults', () => {

    const cleanUp = () => {

      delete optimist.argv['default-num'];
      delete process.env['default-num'];
      delete optimist.argv['default-num2'];
      delete optimist.argv['num2'];
      delete process.env['default-num2'];
      delete process.env['num2'];
    };

    beforeEach(cleanUp);
    afterEach(cleanUp);


    it('should set through env', async () => {
      @ConfigClass({
        cli: {
          defaults: {
            enabled: true
          }
        }
      })
      class C {

        @ConfigProperty()
        num: number = 5;

        @ConfigProperty()
        num2: number = 5;

      }

      process.env['default-num'] = '1001';
      process.env['default-num2'] = '501';
      process.env['num2'] = '52';
      const c = ConfigClassBuilder.attachPrivateInterface(new C());
      await c.load();

      chai.expect(c.__defaults).to.deep.equal({num: '1001', num2: '501'});
      chai.expect(c.num).to.equal(1001);
      chai.expect(c.num2).to.equal(52);
    });


    it('should set through cli', async () => {
      @ConfigClass({
        cli: {
          defaults: {
            enabled: true
          }
        }
      })
      class C {

        @ConfigProperty()
        num: number = 5;

        @ConfigProperty()
        num2: number = 5;

      }

      optimist.argv['default-num'] = '100';
      optimist.argv['default-num2'] = '50';
      optimist.argv['num2'] = '52';
      const c = ConfigClassBuilder.attachPrivateInterface(new C());
      await c.load();

      chai.expect(c.__defaults).to.deep.equal({num: '100', num2: '50'});
      chai.expect(c.num).to.equal(100);
      chai.expect(c.num2).to.equal(52);


    });


    it('should not set', async () => {
      @ConfigClass()
      class C {

        @ConfigProperty()
        num: number = 5;

        @ConfigProperty()
        num2: number = 5;

      }

      process.env['default-num'] = '100';
      process.env['default-num2'] = '50';
      optimist.argv['default-num'] = '100';
      optimist.argv['default-num2'] = '50';
      optimist.argv['num2'] = '52';
      const c = ConfigClassBuilder.attachPrivateInterface(new C());
      await c.load();

      chai.expect(c.__defaults).to.deep.equal({num: 5, num2: 5});
      chai.expect(c.num).to.equal(5);
      chai.expect(c.num2).to.equal(52);


    });


  });

});
