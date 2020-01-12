import 'reflect-metadata';
import {ConfigClass} from '../../src/decorators/class/ConfigClass';
import {ConfigProperty} from '../../src/decorators/ConfigPropoerty';
import {ConfigClassMethods} from '../../src/decorators/class/RootConfigClassFactory';

const chai: any = require('chai');
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
  describe('man page', () => {
    it('should JSON keep description-value order', () => {

      @ConfigClass({attachDescription: true})
      class C extends ConfigClassMethods {

        @ConfigProperty({description: 'this is a number'})
        num: number = 5;

      }

      const c = new C();
      console.log(c.___printMan());
      chai.expect(c.___printMan()).to.equal('{"//num":"this is a number","num":5,"//num2":"this is an other number","num2":5}');
    });
  });


});
