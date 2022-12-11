/* tslint:disable:no-inferrable-types */
import 'reflect-metadata';
import {SubConfigClass} from '../../src/decorators/class/SubConfigClass';
import {ConfigProperty} from '../../src/decorators/property/ConfigPropoerty';

@SubConfigClass({tags: ['clientSubSub']})
export class ClientInnerGroupConfig {
  @ConfigProperty({tags: ['xyz']})
  innerClientValue: number = 10;
}


@SubConfigClass({tags: ['clientSub']})
export class ClientGroupConfig {
  @ConfigProperty({tags: ['abc']})
  clientValue: number = 10;

  @ConfigProperty()
  innerGroup: ClientInnerGroupConfig = new ClientInnerGroupConfig();
}

@SubConfigClass({tags: ['client']})
export class ClientConfig {
  @ConfigProperty()
  Group: ClientGroupConfig = new ClientGroupConfig();

  @ConfigProperty({tags: ['mainClient']})
  clientMainValue: number = 15;
}
