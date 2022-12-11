/* tslint:disable:no-inferrable-types */
import 'reflect-metadata';
import {ConfigProperty, SubConfigClass} from '../../common';
import {ConfigClass, ConfigClassBuilder} from '../../node';
import * as path from 'path';
import {ClientConfig, ClientGroupConfig} from './ClientConfig';


@SubConfigClass({tags: ['serverSub']})
export class ServerGroupConfig extends ClientGroupConfig {
  @ConfigProperty({description: 'this is just a property'})
  serverValue: string = 'apple';
}


@ConfigClass({
  configPath: path.join(__dirname, '.config.json'),
  saveIfNotExist: true,
  attachDescription: true,
  enumsAsString: true,
  softReadonly: true,
  cli: {
    enable: {
      configPath: true,
      attachState: true,
      attachDescription: true,
      rewriteCLIConfig: true,
      rewriteENVConfig: true,
      enumsAsString: true,
      saveIfNotExist: true,
      exitOnConfig: true,
    },
    defaults: {
      enabled: true,
    },
  },
  tags: ['server']
})
export class ServerConfigClass extends ClientConfig {
  @ConfigProperty()
  Group: ServerGroupConfig = new ServerGroupConfig();

  @ConfigProperty({tags: ['mainServer']})
  serverMainValue: number = 15;
}

export const Config = ConfigClassBuilder.attachInterface(
  new ServerConfigClass()
);
Config.loadSync();

