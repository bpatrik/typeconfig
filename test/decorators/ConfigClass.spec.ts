/* tslint:disable:no-inferrable-types */
import 'reflect-metadata';
import {ConfigClass} from '../../src/decorators/class/ConfigClass';
import {ConfigProperty} from '../../src/decorators/property/ConfigPropoerty';
import {TestHelper} from '../TestHelper';
import {promises as fsp} from 'fs';
import {ConfigClassBuilder} from '../../src/decorators/builders/ConfigClassBuilder';
import {SubConfigClass} from '../../src/decorators/class/SubConfigClass';
import {ConfigClassOptions, IConfigClassPrivate} from '../../src/decorators/class/IConfigClass';
import {WebConfigClass} from '../../src/decorators/class/WebConfigClass';
import {WebConfigClassBuilder} from '../../web';
import {GenericConfigType} from '../../src/GenericConfigType';
import {IConfigClassPrivateBase} from '../../src/decorators/class/base/IConfigClassBase';

const chai: any = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

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

    @ConfigClass({attachState: true})
    class C {

      @ConfigProperty()
      num: number = 5;
    }

    const c = ConfigClassBuilder.attachPrivateInterface(new C());
    chai.expect(c.toJSON()).to.deep.equal({num: 5, __state: {num: {default: 5}}});
    c.num = 10;
    chai.expect(c.toJSON()).to.deep.equal({num: 10, __state: {num: {default: 5}}});
  });

  it('should have defaults of dynamically added class', async () => {

    @SubConfigClass()
    class Inner {
      @ConfigProperty()
      b: number = 3;
    }


    @SubConfigClass()
    class Sub {
      @ConfigProperty()
      subNum: number = 3;

      @ConfigProperty()
      inner: unknown = {};
    }

    @SubConfigClass()
    class MainConf {
      @ConfigProperty()
      a: number = 5;

      @ConfigProperty({arrayType: Sub})
      list: Sub[] = [];
    }

    @ConfigClass()
    class C {
      @ConfigProperty({type: MainConf})
      main: MainConf = new MainConf();
    }

    const c = ConfigClassBuilder.attachPrivateInterface(new C());
    c.main.list.push(new Sub());
    c.main.list[0].inner = new Inner();
    chai.expect(c.toJSON()).to.deep.equal({main: {a: 5, list: [{subNum: 3, inner: {b: 3}}]}});
    (c.main.list[0].inner as Inner).b = 11;
    chai.expect(c.toJSON()).to.deep.equal({main: {a: 5, list: [{subNum: 3, inner: {b: 11}}]}});
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
    chai.expect(c.toJSON({attachState: true})).to.deep.equal({
      __state: {num: {readonly: true, default: 5}, num2: {default: 5}},
      num: 5,
      num2: 5
    });
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

  it('should JSON do not override existing tags ', () => {


    @SubConfigClass()
    class Sub {
      @ConfigProperty({
        tags: {
          name: ['main name'],
          extraTag: 'test'
        }
      })
      a: number = 5;

    }

    @ConfigClass()
    class C {
      @ConfigProperty({arrayType: Sub})
      main: Sub[] = [new Sub()];
    }

    @SubConfigClass<{ name: string }>()
    class WebSub {
      @ConfigProperty({
        tags: {
          name: 'web name',
        }
      })
      a: number = 5;

    }

    @WebConfigClass()
    class WC {
      @ConfigProperty({arrayType: WebSub})
      main: WebSub[] = [new WebSub()];
    }


    const c = ConfigClassBuilder.attachPrivateInterface(new C());
    const wc = ConfigClassBuilder.attachPrivateInterface(new WC());
    c.loadSync();
    (c.main as Sub[])[0].a = 11;

    wc.load(JSON.parse(JSON.stringify(c.toJSON({attachState: true}))));


    chai.expect(JSON.parse(JSON.stringify(wc.toJSON({attachState: true})))).to.not
      .deep.equal(JSON.parse(JSON.stringify(c.toJSON({attachState: true}))));

    chai.expect((c.__state as any).main.value[0].__state.a.tags.name).to.deep.equal(['main name']);
    chai.expect((wc.__state as any).main.value[0].__state.a.tags.name).to.deep.equal('web name');
    chai.expect((wc.__state as any).main.value[0].__state.a.tags.extraTag).to.deep.equal('test');
    chai.expect(((wc.clone() as IConfigClassPrivateBase<{}>).__state as any).main.value[0].__state.a.tags.name).to.deep.equal('web name');
  });

  it('should JSON skip default values should not change value', () => {

    @SubConfigClass()
    class SubSub {
      @ConfigProperty({
        tags: {
          name: 'SubSub tag name'
        },
        description: 'SubSub dsc'
      })
      b: number = 3;
    }


    @SubConfigClass()
    class Sub {
      @ConfigProperty({
        tags: {
          name: 'just a tag name'
        },
        description: 'dsc'
      })
      subNum: number = 3;

      @ConfigProperty({type: GenericConfigType})
      subsub: GenericConfigType;
    }

    @SubConfigClass()
    class MainConf {
      @ConfigProperty()
      a: number = 5;

      @ConfigProperty({arrayType: Sub})
      subArr: Sub[] = [new Sub()];

      @ConfigProperty({arrayType: GenericConfigType})
      genArr: GenericConfigType[] = [];
    }

    @ConfigClass()
    class C {
      @ConfigProperty({type: MainConf})
      main: MainConf = new MainConf();
    }


    @WebConfigClass()
    class WC {
      @ConfigProperty({type: MainConf})
      main: MainConf = new MainConf();
    }


    const c = ConfigClassBuilder.attachPrivateInterface(new C());
    c.loadSync();
    c.main.genArr.push(new Sub());
    (c.main.genArr[0] as Sub).subsub = new SubSub();
    ((c.main.genArr[0] as Sub).subsub as SubSub).b = 13;
    c.main.subArr.push(new Sub());
    c.main.subArr[0].subsub = new SubSub();
    (c.main.subArr[0].subsub as SubSub).b = 10;
    c.main.subArr[1].subsub = new SubSub();
    (c.main.subArr[1].subsub as SubSub).b = 20;
    const wc = WebConfigClassBuilder.attachPrivateInterface(new WC());

    wc.load(JSON.parse(JSON.stringify(c.toJSON({attachState: true, skipDefaultValues: true}))));

    chai.expect(JSON.parse(JSON.stringify(wc.toJSON()))).to.deep.equal(
      JSON.parse(JSON.stringify(c.toJSON())));
    chai.expect(JSON.parse(JSON.stringify(c.toJSON()))).to.deep.equal(
      JSON.parse(JSON.stringify(c.toJSON())));
    chai.expect(JSON.parse(JSON.stringify(wc.toJSON()))).to.deep.equal(
      JSON.parse(JSON.stringify(wc.toJSON())));
    chai.expect(JSON.parse(JSON.stringify(wc.toJSON({attachState: true, skipDefaultValues: true})))).to.deep.equal(
      JSON.parse(JSON.stringify(c.toJSON({attachState: true, skipDefaultValues: true}))));
    chai.expect(JSON.parse(JSON.stringify(wc.toJSON({attachState: true})))).to.deep.equal(
      JSON.parse(JSON.stringify(c.toJSON({attachState: true}))));
    chai.expect(JSON.parse(JSON.stringify(wc.toJSON({attachState: true})))).to.deep.equal(
      JSON.parse(JSON.stringify(wc.toJSON({attachState: true}))));
    chai.expect(JSON.parse(JSON.stringify(c.toJSON({attachState: true})))).to.deep.equal(
      JSON.parse(JSON.stringify(c.toJSON({attachState: true}))));
  });

  it('should JSON skip default values ', () => {

    @SubConfigClass()
    class SubSub {
      @ConfigProperty({
        tags: {
          name: 'just a tag name'
        },
        description: 'dsc'
      })
      b: number = 3;
    }


    @SubConfigClass()
    class Sub {
      @ConfigProperty({
        tags: {
          name: 'just a tag name'
        },
        description: 'dsc'
      })
      subNum: number = 3;

      @ConfigProperty({type: GenericConfigType})
      sub: GenericConfigType;
    }

    @SubConfigClass()
    class MainConf {
      @ConfigProperty()
      a: number = 5;

      @ConfigProperty({arrayType: Sub})
      sub: Sub[] = [new Sub()];

      @ConfigProperty({arrayType: GenericConfigType})
      gen: GenericConfigType[] = [];
    }

    @ConfigClass()
    class C {
      @ConfigProperty({type: MainConf})
      main: MainConf = new MainConf();
    }


    const c = ConfigClassBuilder.attachPrivateInterface(new C());
    c.loadSync();
    c.main.gen.push(new Sub());
    (c.main.gen[0] as Sub).sub = new SubSub();
    ((c.main.gen[0] as Sub).sub as SubSub).b = 13;
    c.main.sub.push(new Sub());
    c.main.sub[0].sub = new SubSub();
    (c.main.sub[0].sub as SubSub).b = 10;
    c.main.sub[1].sub = new SubSub();
    (c.main.sub[1].sub as SubSub).b = 20;

    chai.expect(JSON.parse(JSON.stringify(c.toJSON({attachState: true, skipDefaultValues: true})))).to.not
      .deep.equal(JSON.parse(JSON.stringify(c.toJSON({attachState: true}))));
    // TODO: this is not the best implementation
    chai.expect(JSON.parse(JSON.stringify(c.toJSON({attachState: true, skipDefaultValues: true})))).to.deep.equal(
      {
        main: {
          gen: [{
            __state: {
              sub: {
                b: {
                  default: 3,
                  description: 'dsc', tags: {name: 'just a tag name'},
                  type: 'float'
                }
              },
              subNum: {
                default: 3,
                description: 'dsc', tags: {name: 'just a tag name'},
                type: 'float'
              }
            },
            sub: {
              __state: {
                b: {
                  default: 3,
                  description: 'dsc', tags: {name: 'just a tag name'},
                  type: 'float'
                }
              }, b: 13
            },
            subNum: 3
          }],
          sub: [{
            __state: {
              sub: {
                b: {
                  default: 3,
                  description: 'dsc', tags: {name: 'just a tag name'},
                  type: 'float'
                }
              }
            },
            sub: {
              __state: {
                b: {
                  default: 3,
                  description: 'dsc', tags: {name: 'just a tag name'},
                  type: 'float'
                }
              }, b: 10
            },
          }, {
            __state: {
              sub: {
                b: {
                  default: 3,
                  description: 'dsc', tags: {name: 'just a tag name'},
                  type: 'float'
                }
              },
              subNum: {
                default: 3,
                description: 'dsc', tags: {name: 'just a tag name'},
                type: 'float'
              }
            },
            sub: {
              __state: {
                b: {
                  default: 3,
                  description: 'dsc', tags: {name: 'just a tag name'},
                  type: 'float'
                }
              }, b: 20
            },
            subNum: 3
          }]
        }
      });
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
        'All settings are case-sensitive. \n' +
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
        'All settings are case-sensitive. \n' +
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
            attachState: true,
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
        '--config-attachState             prints the value state (default, readonly, volatile, etc..) to the config file \n' +
        '--config-attachDesc              prints description to the config file \n' +
        '--config-rewrite-cli             updates the config file with the options from cli switches \n' +
        '--config-rewrite-env             updates the config file with the options from environmental variables \n' +
        '--config-string-enum             enums are stored as string in the config file (instead of numbers) \n' +
        '--config-save-if-not-exist       creates config file if not exist \n' +
        '--config-save-and-exist          creates config file and terminates \n' +
        '\n' +
        '<appname> can be configured through the configuration file, cli switches and environmental variables. \n' +
        'All settings are case-sensitive. \n' +
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
      process.argv = process.argv.filter(s => !s.startsWith('--num'));
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

    it('should load when constructor is used', async () => {


      @SubConfigClass()
      class Subsub {
        @ConfigProperty()
        a: number = 6;

        constructor(a: number = -1) {
          this.a = a;
        }
      }

      @SubConfigClass()
      class Sub {
        @ConfigProperty({arrayType: Subsub})
        s: (IConfigClassPrivate<{}> & Subsub)[] = [new Subsub(11) as any, new Subsub(15) as any];
      }


      @ConfigClass({configPath: filePath})
      class C {
        @ConfigProperty()
        num: number = 5;

        @ConfigProperty({type: Sub})
        s: IConfigClassPrivate<{}> & Sub = new Sub() as any;
      }


      const c = ConfigClassBuilder.attachPrivateInterface(new C());
      c.s.s.push(new Subsub(1111) as any);
      c.s.s[0] = new Subsub(9999) as any;
      c.s.__inheritDefaultsFromParent(c.s.__defaults);
      await c.save();
      await c.load();
      const c2 = ConfigClassBuilder.attachPrivateInterface(new C());
      await c2.load();
      const c3 = ConfigClassBuilder.attachPrivateInterface(new C());
      await c3.load();

      chai.expect(c.__defaults).to.deep.equal({
        num: 5, s: {s: [{a: 11}, {a: 15}]}
      });
      chai.expect(c.__defaults).to.deep.equal(c2.__defaults);
      chai.expect(c.__defaults).to.deep.equal(c3.__defaults);

      chai.expect(c.s.__defaults).to.deep.equal({s: [{a: 11}, {a: 15}]});
      chai.expect(c.s.__defaults).to.deep.equal(c2.s.__defaults);
      chai.expect(c.s.__defaults).to.deep.equal(c3.s.__defaults);

      chai.expect(c.s.s[0].__defaults).to.deep.equal({a: 11});
      chai.expect(c.s.s[1].__defaults).to.deep.equal({a: 15});
      chai.expect(c.s.s[0].__defaults).to.deep.equal(c2.s.s[0].__defaults);
      chai.expect(c.s.s[1].__defaults).to.deep.equal(c2.s.s[1].__defaults);
      chai.expect(c.s.s[2].__defaults).to.deep.equal(c2.s.s[2].__defaults);
      chai.expect(c.s.s[0].__defaults).to.deep.equal(c3.s.s[0].__defaults);
      chai.expect(c.s.s[1].__defaults).to.deep.equal(c3.s.s[1].__defaults);

      chai.expect(c3.toJSON({attachState: true})).to.deep.equal(c2.toJSON({attachState: true}));
      chai.expect(c2.toJSON({attachState: true})).to.deep.equal(c.toJSON({attachState: true}));

    });

    it('should load throw syntax error', async () => {

      enum Test {
        a, b, c
      }

      @ConfigClass({configPath: filePath})
      class C {

        @ConfigProperty({type: Test})
        e: Test = Test.a;

      }

      const c = ConfigClassBuilder.attachPrivateInterface(new C());
      const json = c.toJSON();
      json.e = 'test';

      await fsp.writeFile(filePath, JSON.stringify(json, null, 4));
      chai.expect(() => {
        c.loadSync();
      }).to.throw(TypeError);

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

      process.argv.push('--num=101');
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

      process.argv.push('--num=120');
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


    it('should loadSync config-array type', async () => {

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
      c.loadSync();
      chai.expect(c.toJSON()).to.deep.equal({subArr: [{num: 100}, {num: 200}]});
      chai.expect(c2.toJSON()).to.deep.equal({subArr: [{num: 10}, {num: 12}]});
      c2.loadSync();
      chai.expect(c2.toJSON()).to.deep.equal({subArr: [{num: 100}, {num: 200}]});
      c2.subArr = [];
      c2.loadSync();
      chai.expect(c2.toJSON()).to.deep.equal({subArr: [{num: 100}, {num: 200}]});
      chai.expect((<any>c2.subArr[0]).toJSON()).to.deep.equal({num: 100});
    });

    it('should load subconfig array as config obj', async () => {

      @SubConfigClass()
      class SA {
        @ConfigProperty()
        num: number = 5;

        @ConfigProperty()
        num2: number;

        constructor(n?: number) {
          this.num = n;
        }
      }

      @SubConfigClass()
      class S {
        @ConfigProperty({arrayType: SA})
        arr: SA[] = [];
      }

      @ConfigClass()
      class C {
        @ConfigProperty()
        sub: S = new S();
      }

      const c = ConfigClassBuilder.attachPrivateInterface(new C());
      chai.expect(c.toJSON()).to.deep.equal({sub: {arr: []}});
      await fsp.writeFile(filePath, JSON.stringify({sub: {arr: [{num: 1}, {num2: 2}]}}, null, 4));
      await c.load({pathOverride: filePath});
      chai.expect((c.sub.arr[1] as any).toJSON({attachState: true})).to.deep.equal({
        __state: {num: {}, num2: {}}, num2: 2
      });
      c.sub.arr[1].num2 = 10;
      chai.expect((c.sub.arr[1] as any).toJSON({attachState: true})).to.deep.equal({
        __state: {num: {}, num2: {}}, num2: 10
      });
      chai.expect((c.sub.arr[1] as any).toJSON({attachState: true})).to.deep.equal({
        __state: {num: {}, num2: {}}, num2: 10
      });

    });

    it('should loadSync subconfig array as config obj', async () => {

      @SubConfigClass()
      class SA {
        @ConfigProperty()
        num: number = 5;

        @ConfigProperty()
        num2: number;

        constructor(n?: number) {
          this.num = n;
        }
      }

      @SubConfigClass()
      class S {
        @ConfigProperty({arrayType: SA})
        arr: SA[] = [];
      }

      @ConfigClass()
      class C {
        @ConfigProperty()
        sub: S = new S();
      }

      const c = ConfigClassBuilder.attachPrivateInterface(new C());
      chai.expect(c.toJSON()).to.deep.equal({sub: {arr: []}});
      await fsp.writeFile(filePath, JSON.stringify({sub: {arr: [{num: 1}, {num2: 2}]}}, null, 4));
      c.loadSync({pathOverride: filePath});
      chai.expect((c.sub.arr[1] as any).toJSON({attachState: true})).to.deep.equal({
        __state: {num: {}, num2: {}}, num2: 2
      });
      c.sub.arr[1].num2 = 10;
      chai.expect((c.sub.arr[1] as any).toJSON({attachState: true})).to.deep.equal({
        __state: {num: {}, num2: {}}, num2: 10
      });
      chai.expect((c.sub.arr[1] as any).toJSON({attachState: true})).to.deep.equal({
        __state: {num: {}, num2: {}}, num2: 10
      });

    });

    it('should load dynamically added class', async () => {

      @SubConfigClass()
      class Inner {
        @ConfigProperty()
        b: number = 3;
      }


      @SubConfigClass()
      class Sub {
        @ConfigProperty()
        subNum: number = 3;

        @ConfigProperty()
        inner: unknown = {};
      }

      @SubConfigClass()
      class MainConf {
        @ConfigProperty()
        a: number = 5;

        @ConfigProperty({arrayType: Sub})
        list: Sub[] = [];
      }

      @ConfigClass()
      class C {
        @ConfigProperty({type: MainConf})
        main: MainConf = new MainConf();
      }

      const c = ConfigClassBuilder.attachPrivateInterface(new C());
      c.main.list.push(new Sub());
      c.main.list[0].inner = new Inner();
      chai.expect(c.toJSON()).to.deep.equal({main: {a: 5, list: [{subNum: 3, inner: {b: 3}}]}});
      await c.load();
      chai.expect(c.toJSON()).to.deep.equal({main: {a: 5, list: [{subNum: 3, inner: {b: 3}}]}});
      (c.main.list[0].inner as Inner).b = 11;
      chai.expect(c.toJSON()).to.deep.equal({main: {a: 5, list: [{subNum: 3, inner: {b: 11}}]}});
    });

    it('should loadSync dynamically added class', async () => {

      @SubConfigClass()
      class Inner {
        @ConfigProperty()
        b: number = 3;
      }


      @SubConfigClass()
      class Sub {
        @ConfigProperty()
        subNum: number = 3;

        @ConfigProperty()
        inner: unknown = {};
      }

      @SubConfigClass()
      class MainConf {
        @ConfigProperty()
        a: number = 5;

        @ConfigProperty({arrayType: Sub})
        list: Sub[] = [];
      }

      @ConfigClass()
      class C {
        @ConfigProperty({type: MainConf})
        main: MainConf = new MainConf();
      }

      const c = ConfigClassBuilder.attachPrivateInterface(new C());
      c.main.list.push(new Sub());
      c.main.list[0].inner = new Inner();
      chai.expect(c.toJSON()).to.deep.equal({main: {a: 5, list: [{subNum: 3, inner: {b: 3}}]}});
      c.loadSync();
      chai.expect(c.toJSON()).to.deep.equal({main: {a: 5, list: [{subNum: 3, inner: {b: 3}}]}});
      (c.main.list[0].inner as Inner).b = 11;
      chai.expect(c.toJSON()).to.deep.equal({main: {a: 5, list: [{subNum: 3, inner: {b: 11}}]}});
    });

    it('should load from partial config', async () => {

      @ConfigClass()
      class C {
        @ConfigProperty()
        a: number = 5;

        @ConfigProperty()
        b: number = 3;
      }

      const c = ConfigClassBuilder.attachPrivateInterface(new C());
      chai.expect(c.toJSON()).to.deep.equal({a: 5, b: 3});
      await fsp.writeFile(filePath, JSON.stringify({a: 4}, null, 4));
      await c.load({pathOverride: filePath});
      chai.expect(c.toJSON()).to.deep.equal({a: 4, b: 3});
    });

    it('should loadSync from partial config', async () => {

      @ConfigClass()
      class C {
        @ConfigProperty()
        a: number = 5;

        @ConfigProperty()
        b: number = 3;
      }

      const c = ConfigClassBuilder.attachPrivateInterface(new C());
      chai.expect(c.toJSON()).to.deep.equal({a: 5, b: 3});
      await fsp.writeFile(filePath, JSON.stringify({a: 4}, null, 4));
      c.loadSync({pathOverride: filePath});
      chai.expect(c.toJSON()).to.deep.equal({a: 4, b: 3});
    });

    it('should load subconfig from partial config', async () => {

      @SubConfigClass()
      class Inner {
        @ConfigProperty()
        b: number = 5;

        @ConfigProperty()
        c: number = 8;
      }

      @ConfigClass()
      class C {
        @ConfigProperty()
        a: number = 3;

        @ConfigProperty({type: Inner})
        inner: Inner = new Inner();
      }

      const c = ConfigClassBuilder.attachPrivateInterface(new C());
      chai.expect(c.toJSON()).to.deep.equal({a: 3, inner: {b: 5, c: 8}});
      await fsp.writeFile(filePath, JSON.stringify({a: 4}, null, 4));
      await c.load({pathOverride: filePath});
      chai.expect(c.toJSON()).to.deep.equal({a: 4, inner: {b: 5, c: 8}});
    });

    it('should loadSync subconfig from partial config', async () => {

      @SubConfigClass()
      class Inner {
        @ConfigProperty()
        b: number = 5;

        @ConfigProperty()
        c: number = 8;
      }

      @ConfigClass()
      class C {
        @ConfigProperty()
        a: number = 3;

        @ConfigProperty({type: Inner})
        inner: Inner = new Inner();
      }

      const c = ConfigClassBuilder.attachPrivateInterface(new C());
      chai.expect(c.toJSON()).to.deep.equal({a: 3, inner: {b: 5, c: 8}});
      await fsp.writeFile(filePath, JSON.stringify({a: 4}, null, 4));
      c.loadSync({pathOverride: filePath});
      chai.expect(c.toJSON()).to.deep.equal({a: 4, inner: {b: 5, c: 8}});
    });
  });

  describe('cli options', () => {

    const cleanUp = () => {

      process.argv = process.argv.filter(s => !s.startsWith('--config-path') &&
        !s.startsWith('--config-attachState') &&
        !s.startsWith('--config-attachDesc') &&
        !s.startsWith('--config-rewrite-cli') &&
        !s.startsWith('--config-rewrite-env') &&
        !s.startsWith('--config-string-enum') &&
        !s.startsWith('--config-save-and-exist') &&
        !s.startsWith('--config-save-if-not-exist'));
    };
    beforeEach(cleanUp);
    afterEach(cleanUp);


    it('should not set without switch', async () => {
      @ConfigClass({
        cli: {
          enable: {
            configPath: true,
            attachState: true,
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

      const c = ConfigClassBuilder.attachPrivateInterface<string[], C>(new C());
      const opts: ConfigClassOptions<string[]> = c.__options;

      chai.expect(opts.configPath).to.not.equal('test');
      chai.expect(opts.enumsAsString).to.not.equal(true);
      chai.expect(opts.attachDescription).to.not.equal(true);
      chai.expect(opts.rewriteENVConfig).to.not.equal(true);
      chai.expect(opts.rewriteCLIConfig).to.not.equal(true);
      chai.expect(opts.attachState).to.not.equal(true);
      chai.expect(opts.saveIfNotExist).to.not.equal(false);


    });

    it('should set', async () => {

      process.argv.push('--config-path=test');
      process.argv.push('--config-attachState=true');
      process.argv.push('--config-attachDesc=true');
      process.argv.push('--config-rewrite-cli=true');
      process.argv.push('--config-rewrite-env=true');
      process.argv.push('--config-string-enum=true');
      process.argv.push('--config-save-and-exist=true');
      process.argv.push('--config-save-if-not-exist=false');

      @ConfigClass({
        cli: {
          enable: {
            configPath: true,
            attachState: true,
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


      const c = ConfigClassBuilder.attachPrivateInterface<string[], C>(new C());
      const opts: ConfigClassOptions<string[]> = c.__options;

      chai.expect(opts.configPath).to.equal('test');
      chai.expect(opts.enumsAsString).to.equal(true, 'opts.enumsAsString');
      chai.expect(opts.attachDescription).to.equal(true, 'opts.attachDescription');
      chai.expect(opts.rewriteENVConfig).to.equal(true, 'opts.rewriteENVConfig');
      chai.expect(opts.rewriteCLIConfig).to.equal(true, 'opts.rewriteCLIConfig');
      chai.expect(opts.attachState).to.equal(true, 'opts.attachState');
      chai.expect(opts.saveIfNotExist).to.equal(false, 'opts.saveIfNotExist');

    });


    it('should not set when disabled', async () => {

      process.argv.push('--config-path=test');
      process.argv.push('--config-attachState=true');
      process.argv.push('--config-attachDesc=true');
      process.argv.push('--config-rewrite-cli=true');
      process.argv.push('--config-rewrite-env=true');
      process.argv.push('--config-string-enum=true');
      process.argv.push('--config-save-and-exist=true');
      process.argv.push('--config-save-if-not-exist=false');

      @ConfigClass()
      class C {

        @ConfigProperty({description: 'this is a number'})
        num: number = 5;

      }


      const c = ConfigClassBuilder.attachPrivateInterface<string[], C>(new C());
      const opts: ConfigClassOptions<string[]> = c.__options;
      chai.expect(opts.configPath).to.not.equal('test');
      chai.expect(opts.enumsAsString).to.not.equal(true);
      chai.expect(opts.attachState).to.not.equal(true);
      chai.expect(opts.rewriteENVConfig).to.not.equal(true);
      chai.expect(opts.rewriteCLIConfig).to.not.equal(true);
      chai.expect(opts.saveIfNotExist).to.not.equal(false);

    });

  });

  describe('defaults', () => {

    const cleanUp = () => {

      process.argv = process.argv.filter(s => !s.startsWith('--default-num')
        && !s.startsWith('--default-num2') && !s.startsWith('--num2'));
      process.argv.push('--config-path=test');
      delete process.env['default-num'];
      delete process.env['default-sub-num'];
      delete process.env['num'];
      delete process.env['default-num2'];
      delete process.env['num2'];
      delete process.env['default-sub-subsub-myNum'];
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

    it('should set sub-config through env', async () => {

      @SubConfigClass()
      class Sub {

        @ConfigProperty()
        num: number = 5;


      }

      @ConfigClass({
        cli: {
          defaults: {
            enabled: true
          }
        }
      })
      class C {

        @ConfigProperty()
        num: number = 99;

        @ConfigProperty({type: Sub})
        sub: Sub = new Sub();

        @ConfigProperty({type: Sub})
        sub2: Sub = new Sub();

      }

      process.env['default-sub-num'] = '1001'; // node converts it to string
      process.env['num'] = '995';
      const c = ConfigClassBuilder.attachPrivateInterface(new C());
      chai.expect(c.__defaults).to.deep.equal({num: 99, sub: {num: 5}, sub2: {num: 5}});
      await c.load();
      chai.expect(c.toJSON({attachState: true})).to.deep.equal(
        {
          __state: {num: {default: 99, readonly: true}, sub: {num: {default: '1001'}}, sub2: {num: {default: 5}}},
          num: 995, sub: {num: 1001}, sub2: {num: 5}
        });
      chai.expect(c.__defaults).to.deep.equal({num: 99, sub: {num: '1001'}, sub2: {num: 5}});
      chai.expect(c.sub.num).to.equal(1001);
      chai.expect(c.num).to.equal(995);
    });

    it('should set subsub-config through env', async () => {

      @SubConfigClass()
      class SubSub {
        @ConfigProperty()
        myNum: number = 5;
      }

      @SubConfigClass()
      class Sub {
        @ConfigProperty()
        num: number = 5;
        @ConfigProperty({type: SubSub})
        subsub: SubSub = new SubSub();
      }

      @ConfigClass({
        cli: {
          defaults: {
            enabled: true
          }
        }
      })
      class C {

        @ConfigProperty()
        num: number = 99;

        @ConfigProperty({type: Sub})
        sub: Sub = new Sub();

        @ConfigProperty({type: Sub})
        sub2: Sub = new Sub();

      }

      process.env['default-sub-subsub-myNum'] = '1001';
      process.env['num'] = '995';
      const c = ConfigClassBuilder.attachPrivateInterface(new C());
      chai.expect(c.__defaults).to.deep.equal({num: 99, sub: {num: 5, subsub: {myNum: 5}}, sub2: {num: 5, subsub: {myNum: 5}}});
      await c.load();
      chai.expect(c.toJSON({attachState: true})).to.deep.equal(
        {
          __state: {
            num: {default: 99, readonly: true},
            sub: {num: {default: 5}, subsub: {myNum: {default: '1001'}}},
            sub2: {num: {default: 5}, subsub: {myNum: {default: 5}}}
          },
          num: 995, sub: {num: 5, subsub: {myNum: 1001}}, sub2: {num: 5, subsub: {myNum: 5}}
        });
      chai.expect(c.__defaults).to.deep.equal({num: 99, sub: {num: 5, subsub: {myNum: '1001'}}, sub2: {num: 5, subsub: {myNum: 5}}});
      chai.expect(c.sub.subsub.myNum).to.equal(1001);
      chai.expect(c.num).to.equal(995);
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

      process.argv.push('--default-num=100');
      process.argv.push('--default-num2=50');
      process.argv.push('--num2=52');
      const c = ConfigClassBuilder.attachPrivateInterface(new C());
      await c.load();

      chai.expect(c.__defaults).to.deep.equal({num: 100, num2: 50});
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
      process.argv.push('--default-num=100');
      process.argv.push('--default-num2=50');
      process.argv.push('--num2=52');
      const c = ConfigClassBuilder.attachPrivateInterface(new C());
      await c.load();

      chai.expect(c.__defaults).to.deep.equal({num: 5, num2: 5});
      chai.expect(c.num).to.equal(5);
      chai.expect(c.num2).to.equal(52);

    });


    it('default is always JSON', async () => {
      @SubConfigClass()
      class SA {
        @ConfigProperty()
        num: number = 5;

        @ConfigProperty()
        num2: number;

        constructor(n?: number) {
          this.num = n;
        }
      }

      @SubConfigClass()
      class S {
        @ConfigProperty({arrayType: SA})
        arr: SA[] = [new SA(11)];
      }

      @SubConfigClass()
      class S2 {
        @ConfigProperty()
        num: number = 10;
      }

      @WebConfigClass()
      class C {
        @ConfigProperty()
        sub: S = new S();
        @ConfigProperty()
        sub2: S2 = new S2();
      }

      const c = ConfigClassBuilder.attachPrivateInterface(new C());

      chai.expect(c.__defaults).to.deep.equal({sub2: {num: 10}, sub: {arr: [{num: 11}]}});

    });

    it('should get hard default', async () => {
      @SubConfigClass()
      class SA {
        @ConfigProperty()
        num: number = 5;

        @ConfigProperty()
        num2: number;

        constructor(n?: number) {
          if (n) {
            this.num = n;
          }
        }
      }

      @SubConfigClass()
      class S {
        @ConfigProperty()
        s: string = 'text';

        @ConfigProperty({arrayType: SA})
        arr: (IConfigClassPrivate<unknown> & SA)[] = [new SA(11) as any, new SA() as any];
      }


      @WebConfigClass()
      class C {
        @ConfigProperty()
        sub: IConfigClassPrivate<unknown> & S = (new S()) as any;
      }

      const c = ConfigClassBuilder.attachPrivateInterface(new C());

      chai.expect(c.sub.__getPropertyHardDefault('s')).to.deep.equal('text');
      chai.expect(c.sub.arr[0].__getPropertyHardDefault('num')).to.deep.equal(11);
      chai.expect(c.sub.arr[1].__getPropertyHardDefault('num')).to.deep.equal(5);
      chai.expect(c.__getHardDefault()).to.deep.equal({
        sub: {arr: [{num: 11}, {num: 5}], s: 'text'}
      });
      chai.expect(c.sub.__getHardDefault()).to.deep.equal({
        arr: [{num: 11}, {num: 5}], s: 'text'
      });

      chai.expect(c.sub.arr[0].__getHardDefault()).to.deep.equal({
        num: 11
      });

    });

    describe('isDefault', () => {
      it('should tell if value is not default', async () => {

        @ConfigClass()
        class C {
          @ConfigProperty()
          b: number = 3;
        }

        const c = ConfigClassBuilder.attachPrivateInterface(new C());
        await c.load();
        chai.expect(c.__isPropertyDefault('b')).to.deep.equal(true);
        chai.expect(c.__isDefault()).to.deep.equal(true);
        c.b = 10;
        chai.expect(c.__isPropertyDefault('b')).to.deep.equal(false);
        chai.expect(c.__isDefault()).to.deep.equal(false);
      });


      it('should tell if value is not default', async () => {

        @SubConfigClass()
        class Inner {
          @ConfigProperty()
          b: number = 3;
        }

        @SubConfigClass()
        class Sub {
          @ConfigProperty()
          subNum: number = 3;

          @ConfigProperty()
          inner: unknown = {};
        }

        @SubConfigClass()
        class MainConf {
          @ConfigProperty()
          a: number = 5;

          @ConfigProperty({arrayType: Sub})
          list: Sub[] = [];
        }

        @ConfigClass()
        class C {
          @ConfigProperty({type: MainConf})
          main: IConfigClassPrivate<unknown> & MainConf = ConfigClassBuilder.attachPrivateInterface(new MainConf());
        }

        const c = ConfigClassBuilder.attachPrivateInterface(new C());
        await c.load();
        chai.expect(c.main.__isPropertyDefault('list')).to.deep.equal(true);
        chai.expect(c.__isDefault()).to.deep.equal(true);
        c.main.list.push(new Sub());
        c.main.list[0].inner = new Inner();

        chai.expect(c.main.__isPropertyDefault('list')).to.deep.equal(false);
        chai.expect(c.main.__isPropertyDefault('a')).to.deep.equal(true);
        chai.expect(c.__isDefault()).to.deep.equal(false);

        chai.expect((c.main.list[0].inner as any).__isPropertyDefault('b')).to.deep.equal(true);
        chai.expect((c.main.list[0] as any).__isDefault()).to.deep.equal(true);
        (c.main.list[0].inner as Inner).b = 11;
        chai.expect((c.main.list[0].inner as any).__isPropertyDefault('b')).to.deep.equal(false);
        chai.expect((c.main.list[0] as any).__isDefault()).to.deep.equal(false);
      });

      it('should tell if value is not default when loaded from json', async () => {

        @SubConfigClass()
        class Inner {
          @ConfigProperty()
          b: string = 'inner string';
        }

        @SubConfigClass()
        class Sub {
          @ConfigProperty()
          subNum: number = 3;

          @ConfigProperty({type: GenericConfigType})
          inner: GenericConfigType;
        }

        @SubConfigClass()
        class MainConf {
          @ConfigProperty()
          a: number = 5;

          @ConfigProperty({arrayType: Sub})
          list: Sub[] = [];
        }

        @ConfigClass()
        class C {
          @ConfigProperty({type: MainConf})
          main: IConfigClassPrivate<null> & MainConf = ConfigClassBuilder.attachPrivateInterface(new MainConf());
        }

        @WebConfigClass()
        class WC {
          @ConfigProperty({type: MainConf})
          main: IConfigClassPrivate<null> & MainConf = ConfigClassBuilder.attachPrivateInterface(new MainConf());
        }

        const c = ConfigClassBuilder.attachPrivateInterface(new C());
        await c.load();
        chai.expect(c.main.__isPropertyDefault('list')).to.deep.equal(true);
        chai.expect(c.__isDefault()).to.deep.equal(true, 'main is not default after loading');
        c.main.list.push(new Sub());
        c.main.list[0].inner = new Inner();
        (c.main.list[0].inner as Inner).b = 'new inner string';
        const wc = WebConfigClassBuilder.attachPrivateInterface(new WC());
        chai.expect(wc.__isDefault()).to.deep.equal(true);
        wc.load(JSON.parse(JSON.stringify(c.toJSON({attachState: true}))));

        chai.expect((wc.main.list[0] as any).__isPropertyDefault('subNum')).to.deep.equal(true, 'wc.main.list[0].subNum');
        chai.expect((wc.main.list[0].inner as any).__isPropertyDefault('b')).to.deep.equal(false, 'wc.main.list[0].inner.b'
          + JSON.stringify((wc.main.list[0].inner as any).__getPropertyDefault('b')));
        chai.expect((wc.main.list[0] as any).__isDefault()).to.deep.equal(false, 'wc.main.list');
        chai.expect((wc.main as any).__isDefault()).to.deep.equal(false);
        chai.expect(wc.__isDefault()).to.deep.equal(false);
      });

      it('should tell if list value is not default when loaded from json', async () => {

        @SubConfigClass()
        class Inner {
          @ConfigProperty()
          b: string = 'inner string';
        }

        @SubConfigClass()
        class Inner2 {
          @ConfigProperty()
          x: string = 'inner2 string';
        }


        @SubConfigClass()
        class MainConf {
          @ConfigProperty()
          a: number = 5;

          @ConfigProperty({arrayType: GenericConfigType})
          list: GenericConfigType[] = [];
        }

        @ConfigClass()
        class C {
          @ConfigProperty({type: MainConf})
          main: IConfigClassPrivate<null> & MainConf = ConfigClassBuilder.attachPrivateInterface(new MainConf());
        }

        @WebConfigClass()
        class WC {
          @ConfigProperty({type: MainConf})
          main: IConfigClassPrivate<null> & MainConf = ConfigClassBuilder.attachPrivateInterface(new MainConf());
        }

        const c = ConfigClassBuilder.attachPrivateInterface(new C());
        await c.load();
        chai.expect(c.main.__isPropertyDefault('list')).to.deep.equal(true);
        chai.expect(c.__isDefault()).to.deep.equal(true);
        c.main.list.push(new Inner());
        c.main.list.push(new Inner2());
        (c.main.list[0] as Inner2).x = 'changed';
        const wc = WebConfigClassBuilder.attachPrivateInterface(new WC());
        chai.expect(c.__isDefault()).to.deep.equal(false);

        chai.expect(wc.__isDefault()).to.deep.equal(true);
        wc.load(JSON.parse(JSON.stringify(c.toJSON({attachState: true}))));
        chai.expect(wc.__isDefault()).to.deep.equal(false);
      });
    });

  });

  describe('tags', () => {

    const cleanUp = () => {

      process.argv = process.argv.filter(s => !s.startsWith('--default-num')
        && !s.startsWith('--default-num2') && !s.startsWith('--num2'));
      process.argv.push('--config-path=test');
      delete process.env['default-num'];
      delete process.env['default-sub-num'];
      delete process.env['num'];
      delete process.env['default-num2'];
      delete process.env['num2'];
      delete process.env['default-sub-subsub-myNum'];
    };

    beforeEach(cleanUp);
    afterEach(cleanUp);


    it('should set tags to sub class', async () => {

      @SubConfigClass({tags: {'inner-sub': true}})
      class Sub {

        @ConfigProperty()
        subNum: number = 5;


      }

      @ConfigClass({
        cli: {
          defaults: {
            enabled: true
          }
        },
        tags: {main: true}
      })
      class C {

        @ConfigProperty()
        mainNum: number = 99;

        @ConfigProperty({type: Sub, tags: {'sub1': true}})
        sub: Sub = new Sub();

        @ConfigProperty({type: Sub, tags: {'sub2': true}})
        sub2: Sub = new Sub();

      }

      const c = ConfigClassBuilder.attachPrivateInterface(new C());
      await c.load();

      chai.expect(c.__state.sub.tags).to.deep.equal({sub1: true, main: true});
      chai.expect(c.__state.sub.value.__state.subNum.tags).to.deep.equal({'inner-sub': true});
    });


    it('should load tags to sub class', async () => {

      @SubConfigClass({tags: {'inner-sub': true}})
      class SubSub {
        @ConfigProperty({
          tags: {
            testTag: 'my value'
          },
          description: 'just a description'
        })
        c: string = 'SubSub string';
      }


      @SubConfigClass({
        tags: {
          subtag: 'testclass'
        }
      })
      class Sub {
        @ConfigProperty({
          tags: {
            btag: 'test'
          }
        })
        b: string = 'Sub string';

        @ConfigProperty({type: GenericConfigType, tags: {gentype: true}})
        subSub: GenericConfigType;
      }

      @ConfigClass()
      class C {

        @ConfigProperty()
        a: number = 3;

        @ConfigProperty({type: GenericConfigType})
        inner: GenericConfigType;
      }


      @WebConfigClass()
      class WC {
        @ConfigProperty()
        a: number = 3;

        @ConfigProperty({type: GenericConfigType})
        inner: GenericConfigType;
      }

      const c = ConfigClassBuilder.attachPrivateInterface(new C());
      await c.load();
      c.inner = new Sub();
      c.a = 10;
      (c.inner as Sub).b = 'test';
      (c.inner as Sub).subSub = new SubSub();
      ((c.inner as Sub).subSub as SubSub).c = 'test2';
      const wc = WebConfigClassBuilder.attachPrivateInterface(new WC());
      wc.load(JSON.parse(JSON.stringify(c.toJSON({attachState: true}))));
      const wcClone = WebConfigClassBuilder.attachPrivateInterface(wc.clone<WC>());


      chai.expect(JSON.parse(JSON.stringify(wc.clone().toJSON({attachState: true})))).to.deep
        .equal(JSON.parse(JSON.stringify(c.toJSON({attachState: true}))));
      chai.expect(((c.inner as Sub).subSub as any).__state['c'].tags).to.deep
        .equal({
          'inner-sub': true,
          testTag: 'my value'
        });
      chai.expect(((wc.inner as Sub).subSub as any).__state['c'].tags).to.deep
        .equal({
          'inner-sub': true,
          testTag: 'my value'
        });
      chai.expect(((wcClone.inner as Sub).subSub as any).__state['c'].tags).to.deep
        .equal({
          'inner-sub': true,
          testTag: 'my value'
        });


      chai.expect((c.inner as any).__state['b'].tags).to.deep
        .equal({
          'subtag': 'testclass',
          btag: 'test'
        });
      chai.expect((wc.inner as any).__state['b'].tags).to.deep
        .equal({
          'subtag': 'testclass',
          btag: 'test'
        });
      chai.expect((wcClone.inner as any).__state['b'].tags).to.deep
        .equal({
          'subtag': 'testclass',
          btag: 'test'
        });
      chai.expect(JSON.parse(JSON.stringify(wcClone.toJSON({attachState: true})))).to.deep
        .equal(JSON.parse(JSON.stringify(c.toJSON({attachState: true}))));
      chai.expect(JSON.parse(JSON.stringify(wc.toJSON({attachState: true})))).to.deep
        .equal(JSON.parse(JSON.stringify(c.toJSON({attachState: true}))));
    });

    it('should skip', async () => {

      @SubConfigClass({tags: {'inner-sub': true}})
      class Sub {

        @ConfigProperty()
        subNum: number = 5;
        @ConfigProperty({tags: {skip: true}})
        skip: number = 5;


      }

      @ConfigClass({
        cli: {
          defaults: {
            enabled: true
          }
        },
        tags: {'main': true}
      })
      class C {

        @ConfigProperty()
        mainNum: number = 99;

        @ConfigProperty({type: Sub, tags: {'skip': true}})
        shouldSkipThis: Sub = new Sub();

        @ConfigProperty({type: Sub, tags: {'sub': true}})
        sub: Sub = new Sub();

      }

      const c = ConfigClassBuilder.attachPrivateInterface(new C());
      await c.load();

      chai.expect(c.toJSON({skipTags: {'skip': true}})).to.deep.equal({mainNum: 99, sub: {subNum: 5}});
      chai.expect(c.toJSON({
        skipTags: {'skip': true},
        keepTags: {'sub': true, 'inner-sub': true}
      })).to.deep.equal({
        sub: {subNum: 5}
      });

    });

  });

  describe('state', () => {
    it('should set state if cannot be inferred', async () => {

      @SubConfigClass()
      class SubSub {
        @ConfigProperty()
        b: number = 3;
      }


      @SubConfigClass()
      class Sub {
        @ConfigProperty()
        subNum: number = 3;

        @ConfigProperty({type: GenericConfigType})
        sub: GenericConfigType;
      }

      @SubConfigClass()
      class MainConf {
        @ConfigProperty()
        a: number = 5;

        @ConfigProperty({arrayType: Sub})
        sub: Sub[] = [new Sub()];

        @ConfigProperty({arrayType: GenericConfigType})
        gen: GenericConfigType[] = [];
      }

      @ConfigClass()
      class C {
        @ConfigProperty({type: MainConf})
        main: MainConf = new MainConf();
      }


      const c = ConfigClassBuilder.attachPrivateInterface(new C());
      await c.load();
      c.main.gen.push(new Sub());
      (c.main.gen[0] as Sub).sub = new SubSub();
      c.main.sub.push(new Sub());
      c.main.sub[0].sub = new SubSub();
      (c.main.sub[0].sub as SubSub).b = 10;
      c.main.sub[1].sub = new SubSub();
      (c.main.sub[1].sub as SubSub).b = 20;

      chai.expect(JSON.parse(JSON.stringify(c.toJSON({attachState: true})))).to.deep.equal(
        {
          __state: {
            main: {
              a: {default: 5}, gen: {default: []},
              sub: {default: [{subNum: 3}]}
            }
          },
          main: {
            a: 5,
            gen: [{
              __state: {
                sub: {b: {default: 3, type: 'float'}},
                subNum: {default: 3, type: 'float'}
              },
              sub: {
                __state: {b: {default: 3, type: 'float'}}, b: 3
              },
              subNum: 3
            }],
            sub: [{
              __state: {
                sub: {b: {default: 3, type: 'float'}},
                subNum: {default: 3, type: 'float'}
              },
              sub: {__state: {b: {default: 3, type: 'float'}}, b: 10},
              subNum: 3
            }, {
              __state: {
                sub: {b: {default: 3, type: 'float'}},
                subNum: {default: 3, type: 'float'}
              },
              sub: {__state: {b: {default: 3, type: 'float'}}, b: 20},
              subNum: 3
            }]
          }
        });
    });


    it('should set state and def of dynamically added class', async () => {

      @SubConfigClass()
      class Inner {
        @ConfigProperty()
        b: number = 3;
      }


      @SubConfigClass()
      class Sub {
        @ConfigProperty()
        subNum: number = 3;

        @ConfigProperty()
        inner: unknown = {};
      }

      @SubConfigClass()
      class MainConf {
        @ConfigProperty()
        a: number = 5;

        @ConfigProperty({arrayType: Sub})
        list: Sub[] = [];
      }

      @ConfigClass()
      class C {
        @ConfigProperty({type: MainConf})
        main: MainConf = new MainConf();
      }


      @WebConfigClass()
      class WC {
        @ConfigProperty({type: MainConf})
        main: MainConf = new MainConf();
      }

      const c = ConfigClassBuilder.attachPrivateInterface(new C());
      await c.load();
      c.main.list.push(new Sub());
      c.main.list[0].inner = new Inner();
      (c.main.list[0].inner as Inner).b = 11;

      const wc = WebConfigClassBuilder.attachPrivateInterface(new WC());
      chai.expect(c.toJSON({attachState: true})).to.not.deep.equal(wc.toJSON({attachState: true}));
      chai.expect(c.toJSON({attachState: true})).to.deep.equal(JSON.parse(JSON.stringify(c.toJSON({attachState: true}))));
      chai.expect(wc.toJSON({attachState: true})).to.deep.equal(JSON.parse(JSON.stringify(wc.toJSON({attachState: true}))));
      wc.load(JSON.parse(JSON.stringify(c.toJSON({attachState: true}))));
      chai.expect(wc.toJSON({attachState: true})).to.deep.equal(c.toJSON({attachState: true}));
      chai.expect(wc.toJSON({attachState: true})).to.deep.equal(JSON.parse(JSON.stringify(wc.toJSON({attachState: true}))));
    });
  });

});
