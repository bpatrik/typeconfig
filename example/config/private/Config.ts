import * as path from 'path';
import {PrivateConfigClass} from './PrivateConfigClass';
import {ConfigLoader} from '../../../src/ConfigLoader';


export let Config = new PrivateConfigClass();


ConfigLoader.loadBackendConfig(Config,
  path.join(__dirname, './../../../config.json'),
  [{alias: 'PORT', key: 'Private-PORT'}]);
